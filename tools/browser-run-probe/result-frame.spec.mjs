import assert from "node:assert/strict";
import test from "node:test";
import { isResultDocumentUrl } from "./result-frame.mjs";

test("기존 Pen과 CodePen 2.0 실행 프레임만 인식한다", () => {
  assert.equal(isResultDocumentUrl("https://cdpn.io/user/fullpage/abc"), true);
  assert.equal(isResultDocumentUrl("https://preview.codepen.dev/"), true);
  assert.equal(isResultDocumentUrl("https://codepen.dev/"), true);
  assert.equal(isResultDocumentUrl("https://codepen.dev.evil.example/"), false);
  assert.equal(isResultDocumentUrl("http://codepen.dev/"), false);
});
