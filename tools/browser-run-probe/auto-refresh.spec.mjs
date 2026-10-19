import assert from "node:assert/strict";
import test from "node:test";
import { refreshStaleCandidates } from "./auto-refresh.mjs";

function setup({
  probePasses = true,
  controlPasses = true,
  paused = false,
} = {}) {
  const inspected = [];
  let closed = false;
  const options = {
    launchBrowser: async () => ({
      close: async () => {
        closed = true;
      },
    }),
    inspectPage: async (_browser, target) => {
      inspected.push(target);
      return { target };
    },
    control: { id: "control" },
    controlLoaded: () => controlPasses,
    paused: async () => paused,
    recordProbe: async () => probePasses,
  };
  return { options, inspected, wasClosed: () => closed };
}

const rows = [
  { candidate_id: "first", canonical_url: "https://codepen.io/a/pen/One" },
  { candidate_id: "second", canonical_url: "https://codepen.io/b/pen/Two" },
];

test("stale candidates need a working control and fresh passes", async () => {
  const state = setup();
  assert.deepEqual(await refreshStaleCandidates(rows, state.options), {
    status: "passed",
  });
  assert.deepEqual(
    state.inspected.map((item) => item.id),
    ["control", "first", "second"],
  );
  assert.equal(state.wasClosed(), true);
});

test("failed control or candidate blocks release", async () => {
  const control = setup({ controlPasses: false });
  assert.deepEqual(await refreshStaleCandidates(rows, control.options), {
    status: "blocked",
    code: "REFRESH_CONTROL_FAILED",
  });
  assert.equal(control.inspected.length, 1);
  assert.equal(control.wasClosed(), true);

  const candidate = setup({ probePasses: false });
  assert.deepEqual(await refreshStaleCandidates(rows, candidate.options), {
    status: "blocked",
    code: "STALE_RECHECK_FAILED",
  });
  assert.equal(candidate.inspected.length, 2);
  assert.equal(candidate.wasClosed(), true);
});

test("pause defers release without probing candidates", async () => {
  const state = setup({ paused: true });
  assert.deepEqual(await refreshStaleCandidates(rows, state.options), {
    status: "deferred",
  });
  assert.equal(state.inspected.length, 1);
  assert.equal(state.wasClosed(), true);
});
