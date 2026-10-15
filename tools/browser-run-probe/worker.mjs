import { launch } from "@cloudflare/playwright";
import { classifyEmbedStatus, controlLoaded } from "./probe-policy.mjs";
import { CONTROL, toEmbedUrl, validateBatch } from "./urls.mjs";

const MAX_BODY_BYTES = 4_096;

async function digest(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function inspectInteraction(page, frame, body, interaction) {
  if (!interaction) return null;
  if (interaction.kind === "hover") {
    const before = await digest(await body.screenshot());
    await frame.locator(interaction.selector).first().hover({ timeout: 5_000 });
    await page.waitForTimeout(700);
    const after = await digest(await body.screenshot());
    return { kind: "hover", changed: before !== after };
  }

  const before = await frame.evaluate(() => ({
    scrollY: window.scrollY,
    inlineStyles: Array.from(document.querySelectorAll("[style]"))
      .slice(0, 200)
      .map((element) => element.getAttribute("style")),
  }));
  await frame.evaluate(() =>
    window.scrollBy(0, Math.max(240, window.innerHeight * 0.6)),
  );
  await page.waitForTimeout(700);
  const after = await frame.evaluate(() => ({
    scrollY: window.scrollY,
    inlineStyles: Array.from(document.querySelectorAll("[style]"))
      .slice(0, 200)
      .map((element) => element.getAttribute("style")),
  }));
  const styleChanges = after.inlineStyles.filter(
    (style, index) => style !== before.inlineStyles[index],
  ).length;
  return {
    kind: "scroll",
    changed: after.scrollY !== before.scrollY && styleChanges > 0,
    scrollMoved: after.scrollY !== before.scrollY,
    styleChanges,
  };
}

export async function inspect(browser, candidate) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const resultResponses = [];
  const pageErrors = [];
  page.on("response", (response) => {
    if (response.url().startsWith("https://cdpn.io/")) {
      resultResponses.push(response.status());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error).slice(0, 160)));

  try {
    const navigation = await page.goto(toEmbedUrl(candidate.canonicalUrl), {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    const embedStatus = navigation?.status() ?? null;
    if (embedStatus !== 200) {
      return {
        id: candidate.id,
        status: classifyEmbedStatus(embedStatus),
        reason: `EMBED_HTTP_${embedStatus}`,
      };
    }

    const body = page.frameLocator("#result-iframe").locator("body");
    await body.waitFor({ state: "visible", timeout: 15_000 });
    const resultFrame = page
      .frames()
      .find((frame) => frame.url().startsWith("https://cdpn.io/"));
    if (!resultFrame || !resultResponses.includes(200)) {
      return {
        id: candidate.id,
        status: "inconclusive",
        reason: "RESULT_NOT_LOADED",
      };
    }

    const content = await resultFrame.evaluate(() => ({
      bodyLength: document.body?.innerHTML.length ?? 0,
      elementCount: document.body?.querySelectorAll("*").length ?? 0,
    }));
    if (content.bodyLength === 0 || content.elementCount === 0) {
      return {
        id: candidate.id,
        status: "inconclusive",
        reason: "EMPTY_RESULT",
      };
    }

    const first = await digest(await body.screenshot());
    await page.waitForTimeout(900);
    const middle = await digest(await body.screenshot());
    await page.waitForTimeout(900);
    const late = await digest(await body.screenshot());
    const earlyChange = first !== middle;
    const lateChange = middle !== late;
    let interaction = null;
    try {
      interaction = await inspectInteraction(
        page,
        resultFrame,
        body,
        candidate.interaction,
      );
    } catch (error) {
      interaction = {
        kind: candidate.interaction.kind,
        changed: false,
        error: String(error).slice(0, 160),
      };
    }
    const automaticChange = earlyChange || lateChange;
    const observedChange = automaticChange || interaction?.changed;
    return {
      id: candidate.id,
      status:
        observedChange && pageErrors.length === 0
          ? automaticChange
            ? "visual-change-observed"
            : "interaction-change-observed"
          : "needs-review",
      reason: pageErrors.length
        ? "PAGE_ERROR"
        : interaction?.error
          ? "INTERACTION_ERROR"
          : observedChange
            ? null
            : "NO_VISUAL_CHANGE_OBSERVED",
      embedStatus,
      resultStatus: 200,
      bodyLength: content.bodyLength,
      elementCount: content.elementCount,
      earlyChange,
      lateChange,
      interaction,
      pageErrors: pageErrors.slice(0, 3),
    };
  } catch (error) {
    return {
      id: candidate.id,
      status: "inconclusive",
      reason: String(error).slice(0, 180),
    };
  } finally {
    await page.close();
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST")
      return new Response("POST only", { status: 405 });
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES)
      return new Response("Body too large", { status: 413 });
    let candidates;
    try {
      candidates = JSON.parse(raw).candidates;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    const validationError = validateBatch(candidates);
    if (validationError) return new Response(validationError, { status: 400 });

    let browser;
    try {
      browser = await launch(env.BROWSER);
      const control = await inspect(browser, CONTROL);
      if (!controlLoaded(control)) {
        return Response.json({
          environment: "probe-blocked",
          control,
          candidates: [],
        });
      }
      const results = [];
      for (const candidate of candidates)
        results.push(await inspect(browser, candidate));
      return Response.json({
        environment: "available",
        control,
        candidates: results,
      });
    } catch (error) {
      return Response.json({
        environment: "probe-blocked",
        reason: String(error).slice(0, 180),
        candidates: [],
      });
    } finally {
      if (browser) await browser.close();
    }
  },
};
