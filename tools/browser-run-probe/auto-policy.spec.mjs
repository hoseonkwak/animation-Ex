import assert from "node:assert/strict";
import test from "node:test";
import {
  isCandidateEligible,
  passesAutomaticProbe,
  sampleIndex,
} from "./auto-policy.mjs";

const row = {
  status: "review",
  canonical_url: "https://codepen.io/user/pen/AbC123",
  creator_name: "user",
  license_code: "MIT",
  license_evidence_url: "https://blog.codepen.io/legal/terms-of-service/",
  confirmed_tag: 1,
  duplicate_pen: 0,
  metadata_json: JSON.stringify({ publicTitle: "카드 전환 애니메이션" }),
};

test("불완전하거나 중복된 후보는 자동 검사 대상에서 제외한다", () => {
  assert.equal(isCandidateEligible(row), true);
  assert.equal(isCandidateEligible({ ...row, confirmed_tag: 0 }), false);
  assert.equal(isCandidateEligible({ ...row, duplicate_pen: 1 }), false);
  assert.equal(
    isCandidateEligible({
      ...row,
      metadata_json: '{"publicTitle":"CODE VIEW"}',
    }),
    false,
  );
});

test("Result 로드와 두 구간의 움직임 증거가 모두 있어야 통과한다", () => {
  const result = {
    status: "visual-change-observed",
    embedStatus: 200,
    resultStatus: 200,
    bodyLength: 400,
    elementCount: 9,
    earlyChange: true,
    lateChange: true,
    pageErrors: [],
  };
  assert.equal(passesAutomaticProbe(result), true);
  assert.equal(passesAutomaticProbe({ ...result, earlyChange: false }), false);
  assert.equal(
    passesAutomaticProbe({ ...result, pageErrors: ["boom"] }),
    false,
  );
  assert.equal(
    passesAutomaticProbe({ ...result, status: "interaction-change-observed" }),
    false,
  );
  assert.ok(sampleIndex("batch-1", 3) < 3);
});
