import { launch } from "@cloudflare/playwright";
import { AdminRepository } from "../../apps/lab/server/admin.ts";
import { suggestCandidateCopy } from "../../apps/lab/src/shared/candidateCopy.ts";
import {
  isCandidateEligible,
  passesAutomaticProbe,
  sampleIndex,
} from "./auto-policy.mjs";
import { inspect } from "./worker.mjs";
import { CONTROL } from "./urls.mjs";
import { controlLoaded } from "./probe-policy.mjs";

const MAX_PROBES = 8;
const MIN_BATCH = 3;
const ACTOR = "automatic-publication-browser-run-v1";

function now() {
  return new Date().toISOString();
}

function penKey(url) {
  const match = url.match(
    /^https:\/\/codepen\.io\/((?:team\/)?[^/]+)\/pen\/([A-Za-z0-9]+)\/?$/,
  );
  return match ? `${match[1]}/${match[2]}` : null;
}

async function paused(db) {
  const row = await db
    .prepare("SELECT paused FROM auto_publication_control WHERE id = 1")
    .first();
  return !row || row.paused !== 0;
}

async function recordRun(db, id, status, extra = {}) {
  await db
    .prepare(
      `UPDATE auto_publication_runs SET status = ?, examined_count = ?, passed_count = ?,
      published_count = ?, failure_code = ?, finished_at = ? WHERE id = ?`,
    )
    .bind(
      status,
      extra.examined ?? 0,
      extra.passed ?? 0,
      extra.published ?? 0,
      extra.failure ?? null,
      now(),
      id,
    )
    .run();
}

async function eligibleRows(db) {
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { results } = await db
    .prepare(
      `SELECT c.id, c.status, c.version, c.source_id, c.source_title, c.source_category,
      c.metadata_json, s.canonical_url, s.creator_name, s.license_code,
      s.license_evidence_url,
      EXISTS (SELECT 1 FROM candidate_tags ct JOIN tags t ON t.id = ct.tag_id
        WHERE ct.candidate_id = c.id AND ct.confirmed = 1
          AND t.axis IN ('technology', 'trigger', 'motion', 'section', 'technique')) AS confirmed_tag,
      EXISTS (SELECT 1 FROM codepen_refs r WHERE lower(r.pen_key) = lower(
        replace(replace(s.canonical_url, 'https://codepen.io/', ''), '/pen/', '/')
      )) AS duplicate_pen
    FROM candidates c JOIN sources s ON s.id = c.source_id
    WHERE c.status = 'review' AND s.type = 'codepen'
      AND NOT EXISTS (SELECT 1 FROM auto_publication_items ai WHERE ai.candidate_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM animation_entries e WHERE e.candidate_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM validation_runs v WHERE v.target_type = 'candidate'
        AND v.target_id = c.id AND v.validator = 'browser-run-auto'
        AND v.checked_at > ?)
    ORDER BY c.priority_score DESC, c.created_at ASC LIMIT 100`,
    )
    .bind(cutoff)
    .all();
  const eligible = results.filter(isCandidateEligible);
  const category = eligible.find(
    (row) =>
      eligible.filter((other) => other.source_category === row.source_category)
        .length >= MIN_BATCH,
  )?.source_category;
  return category
    ? eligible
        .filter((row) => row.source_category === category)
        .slice(0, MAX_PROBES)
    : [];
}

async function recordProbe(db, row, probe) {
  const passed = passesAutomaticProbe(probe);
  const key = penKey(row.canonical_url);
  await db
    .prepare(
      `INSERT INTO validation_runs (id, target_type, target_id, validator, validator_version,
      subject_fingerprint, result, viewport, failure_codes_json, evidence_json,
      checked_at, created_at)
    VALUES (?, 'candidate', ?, 'browser-run-auto', '1', ?, ?, 'desktop', ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      row.id,
      `pen:${key}|theme:light|tab:result`,
      passed ? "pass" : probe.status === "failed" ? "fail" : "warning",
      JSON.stringify(passed ? [] : [probe.reason ?? "AUTOMATIC_GATE_NOT_MET"]),
      JSON.stringify(probe),
      now(),
      now(),
    )
    .run();
  if (passed) {
    await db
      .prepare(
        `UPDATE sources SET availability = 'available', last_checked_at = ?, updated_at = ?
        WHERE id = ?`,
      )
      .bind(now(), now(), row.source_id)
      .run();
  }
  return passed;
}

async function stage(db, runId, rows, probes) {
  const batchId = crypto.randomUUID();
  const sample = sampleIndex(batchId, rows.length);
  const time = now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO auto_publication_batches (id, run_id, status, sample_candidate_id,
        sample_candidate_version, created_at)
      VALUES (?, ?, 'awaiting-sample', ?, ?, ?)`,
      )
      .bind(batchId, runId, rows[sample].id, rows[sample].version, time),
    ...rows.map((row, index) =>
      db
        .prepare(
          `INSERT INTO auto_publication_items (batch_id, candidate_id, candidate_version,
        role, status, probe_evidence_json)
      VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          batchId,
          row.id,
          row.version,
          index === sample ? "sample" : "automatic",
          index === sample ? "awaiting-sample" : "pending",
          JSON.stringify(probes[index]),
        ),
    ),
  ]);
  return batchId;
}

async function releaseBatch(db, batch) {
  async function blockBatch(failure) {
    const time = now();
    await db.batch([
      db
        .prepare(
          `UPDATE auto_publication_batches SET status = 'blocked', failure_code = ?,
          finished_at = ? WHERE id = ? AND status = 'awaiting-sample'`,
        )
        .bind(failure, time, batch.id),
      db
        .prepare(
          `UPDATE auto_publication_items SET status = 'blocked'
          WHERE batch_id = ? AND role = 'automatic' AND status = 'pending'`,
        )
        .bind(batch.id),
      db
        .prepare(
          `UPDATE auto_publication_runs SET status = 'blocked', failure_code = ?,
          finished_at = ? WHERE id = ?`,
        )
        .bind(failure, time, batch.run_id),
    ]);
  }
  const sample = await db
    .prepare(
      `SELECT c.status, e.status AS entry_status FROM candidates c
      LEFT JOIN animation_entries e ON e.candidate_id = c.id WHERE c.id = ?`,
    )
    .bind(batch.sample_candidate_id)
    .first();
  if (
    !sample ||
    ["rejected", "needs-edit", "duplicate", "validation-failed"].includes(
      sample.status,
    ) ||
    (sample.status === "approved" && sample.entry_status !== "published")
  ) {
    await blockBatch("SAMPLE_REJECTED");
    return;
  }
  if (sample.status !== "approved" || sample.entry_status !== "published")
    return;
  if (await paused(db)) return;

  const { results: items } = await db
    .prepare(
      `SELECT ai.candidate_id, ai.candidate_version, c.status, c.version,
      c.source_title, c.source_category, c.metadata_json, s.canonical_url,
      s.creator_name, s.license_code, s.license_evidence_url,
      EXISTS (SELECT 1 FROM candidate_tags ct JOIN tags t ON t.id = ct.tag_id
        WHERE ct.candidate_id = c.id AND ct.confirmed = 1
          AND t.axis IN ('technology', 'trigger', 'motion', 'section', 'technique')) AS confirmed_tag,
      EXISTS (SELECT 1 FROM codepen_refs r WHERE lower(r.pen_key) = lower(
        replace(replace(s.canonical_url, 'https://codepen.io/', ''), '/pen/', '/')
      )) AS duplicate_pen,
      v.result AS validation_result, v.subject_fingerprint, v.checked_at
    FROM auto_publication_items ai JOIN candidates c ON c.id = ai.candidate_id
      JOIN sources s ON s.id = c.source_id
      LEFT JOIN validation_runs v ON v.id = (SELECT id FROM validation_runs
        WHERE target_type = 'candidate' AND target_id = c.id
        ORDER BY checked_at DESC, id DESC LIMIT 1)
    WHERE ai.batch_id = ? AND ai.role = 'automatic' ORDER BY ai.candidate_id`,
    )
    .bind(batch.id)
    .all();
  const recent = Date.now() - 72 * 60 * 60 * 1000;
  const valid =
    items.length >= 2 &&
    items.every(
      (row) =>
        row.status === "review" &&
        row.version === row.candidate_version &&
        isCandidateEligible(row) &&
        row.validation_result === "pass" &&
        row.subject_fingerprint ===
          `pen:${penKey(row.canonical_url)}|theme:light|tab:result` &&
        Date.parse(row.checked_at) >= recent,
    );
  if (!valid) {
    await blockBatch("CANDIDATE_CHANGED_OR_STALE");
    return;
  }
  const repository = new AdminRepository(db);
  const published = [];
  try {
    for (const row of items) {
      if (await paused(db)) throw new Error("PAUSED_DURING_RELEASE");
      const meta = JSON.parse(row.metadata_json);
      const copy = suggestCandidateCopy({
        sourceTitle: row.source_title ?? "",
        suggestedTitle: meta.publicTitle,
        category: row.source_category,
        canonicalUrl: row.canonical_url,
      });
      const nextMeta = {
        ...meta,
        publicTitle: copy.publicTitle,
        summary: meta.summary?.trim() || copy.summary,
        slug: meta.slug?.trim() || copy.slug,
        difficulty: meta.difficulty || "intermediate",
        featured: false,
      };
      const time = now();
      const updated = await db
        .prepare(
          `UPDATE candidates SET metadata_json = ?, version = version + 1,
          updated_at = ? WHERE id = ? AND status = 'review' AND version = ?`,
        )
        .bind(JSON.stringify(nextMeta), time, row.candidate_id, row.version)
        .run();
      if (updated.meta.changes !== 1)
        throw new Error("CANDIDATE_VERSION_CHANGED");
      const entry = await repository.approve(
        row.candidate_id,
        { version: row.version + 1 },
        `auto:${batch.id}:${row.candidate_id}`,
        ACTOR,
      );
      published.push(entry.entryId);
      await db
        .prepare(
          `UPDATE auto_publication_items SET status = 'published', entry_id = ?
          WHERE batch_id = ? AND candidate_id = ?`,
        )
        .bind(entry.entryId, batch.id, row.candidate_id)
        .run();
    }
    const time = now();
    await db.batch([
      db
        .prepare(
          `UPDATE auto_publication_batches SET status = 'published', finished_at = ?
          WHERE id = ? AND status = 'awaiting-sample'`,
        )
        .bind(time, batch.id),
      db
        .prepare(
          `UPDATE auto_publication_runs SET status = 'published', published_count = ?,
          finished_at = ? WHERE id = ?`,
        )
        .bind(published.length, time, batch.run_id),
    ]);
  } catch (error) {
    for (const entryId of published) {
      try {
        await repository.unpublish(
          entryId,
          {
            reasonCode: "auto-batch-failed",
            note: "자동 공개 묶음 실패로 취소",
          },
          ACTOR,
        );
        await db
          .prepare(
            `UPDATE auto_publication_items SET status = 'rolled-back'
            WHERE batch_id = ? AND entry_id = ? AND status = 'published'`,
          )
          .bind(batch.id, entryId)
          .run();
      } catch (rollbackError) {
        console.error(
          "auto_publication_rollback_failed",
          entryId,
          String(rollbackError),
        );
      }
    }
    await db
      .prepare(
        `UPDATE auto_publication_control SET paused = 1, updated_at = ? WHERE id = 1`,
      )
      .bind(now())
      .run();
    await blockBatch(String(error).slice(0, 100));
    throw error;
  }
}

export async function runAutomaticPublication(env) {
  const db = env.DB;
  if (await paused(db)) return;
  const pending = await db
    .prepare(
      `SELECT * FROM auto_publication_batches WHERE status = 'awaiting-sample'
      ORDER BY created_at ASC LIMIT 1`,
    )
    .first();
  if (pending) {
    await releaseBatch(db, pending);
    return;
  }
  const runId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO auto_publication_runs (id, status, started_at) VALUES (?, 'running', ?)`,
    )
    .bind(runId, now())
    .run();
  let examined = 0;
  let passed = 0;
  try {
    const rows = await eligibleRows(db);
    if (rows.length < MIN_BATCH) {
      await recordRun(db, runId, "no-batch", {
        failure: "INSUFFICIENT_ELIGIBLE",
      });
      return;
    }
    let browser;
    try {
      browser = await launch(env.BROWSER);
      const control = await inspect(browser, CONTROL);
      if (!controlLoaded(control)) {
        await recordRun(db, runId, "blocked", {
          failure: "POSITIVE_CONTROL_FAILED",
        });
        return;
      }
      const successful = [];
      const probes = [];
      for (const row of rows) {
        if (await paused(db)) throw new Error("PAUSED_DURING_PROBE");
        const probe = await inspect(browser, {
          id: row.id,
          canonicalUrl: row.canonical_url,
        });
        examined++;
        if (await recordProbe(db, row, probe)) {
          successful.push(row);
          probes.push(probe);
          passed++;
        }
      }
      if (successful.length < MIN_BATCH) {
        await recordRun(db, runId, "no-batch", {
          examined,
          passed,
          failure: "INSUFFICIENT_RUNTIME_PASSES",
        });
        return;
      }
      await stage(db, runId, successful, probes);
      await recordRun(db, runId, "staged", { examined, passed });
    } finally {
      if (browser) await browser.close();
    }
  } catch (error) {
    await recordRun(db, runId, "failed", {
      examined,
      passed,
      failure: String(error).slice(0, 100),
    });
    throw error;
  }
}

export default {
  async scheduled(_controller, env, context) {
    context.waitUntil(runAutomaticPublication(env));
  },
};
