import assert from "node:assert/strict";
import test from "node:test";
import { classifyEmbedStatus, controlLoaded } from "./probe-policy.mjs";

test("a finite control animation may stop before capture", () => {
  assert.equal(
    controlLoaded({
      status: "needs-review",
      embedStatus: 200,
      resultStatus: 200,
      bodyLength: 470,
      pageErrors: [],
    }),
    true,
  );
  assert.equal(
    controlLoaded({
      embedStatus: 403,
      resultStatus: 200,
      bodyLength: 470,
      pageErrors: [],
    }),
    false,
  );
});

test("only definite missing embeds count as failed", () => {
  assert.equal(classifyEmbedStatus(404), "failed");
  assert.equal(classifyEmbedStatus(410), "failed");
  assert.equal(classifyEmbedStatus(403), "inconclusive");
  assert.equal(classifyEmbedStatus(429), "inconclusive");
});
