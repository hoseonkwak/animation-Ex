export async function refreshStaleCandidates(rows, options) {
  if (!rows.length) return { status: "passed" };
  let browser;
  let result = { status: "passed" };
  try {
    browser = await options.launchBrowser();
    const control = await options.inspectPage(browser, options.control);
    if (!options.controlLoaded(control)) {
      result = { status: "blocked", code: "REFRESH_CONTROL_FAILED" };
    } else {
      for (const row of rows) {
        if (await options.paused()) {
          result = { status: "deferred" };
          break;
        }
        const probe = await options.inspectPage(browser, {
          id: row.candidate_id,
          canonicalUrl: row.canonical_url,
        });
        if (!(await options.recordProbe(row, probe))) {
          result = { status: "blocked", code: "STALE_RECHECK_FAILED" };
          break;
        }
      }
    }
  } catch (error) {
    result = {
      status: "blocked",
      code: `STALE_RECHECK_ERROR:${String(error)}`.slice(0, 100),
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        if (result.status === "passed") {
          result = {
            status: "blocked",
            code: `STALE_RECHECK_CLOSE_ERROR:${String(error)}`.slice(0, 100),
          };
        }
      }
    }
  }
  return result;
}
