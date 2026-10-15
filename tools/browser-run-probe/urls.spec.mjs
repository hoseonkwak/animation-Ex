import assert from "node:assert/strict";
import test from "node:test";
import { toEmbedUrl, validateBatch } from "./urls.mjs";

test("accepts only canonical CodePen Pen URLs", () => {
  assert.equal(
    toEmbedUrl("https://codepen.io/Sicontis/pen/oNbgjda"),
    "https://codepen.io/Sicontis/embed/oNbgjda?default-tab=result&theme-id=light",
  );
  for (const value of [
    "https://evil.example/pen/oNbgjda",
    "http://codepen.io/Sicontis/pen/oNbgjda",
    "https://codepen.io/Sicontis/pen/oNbgjda?x=1",
    "https://codepen.io/Sicontis/full/oNbgjda",
  ])
    assert.equal(toEmbedUrl(value), null);
});

test("caps batches and rejects duplicate ids", () => {
  const candidate = {
    id: "one",
    canonicalUrl: "https://codepen.io/Sicontis/pen/oNbgjda",
  };
  assert.equal(validateBatch([candidate]), null);
  assert.match(validateBatch([candidate, candidate]), /unique/);
  assert.match(validateBatch(Array(6).fill(candidate)), /1 to 5/);
});

test("only supported read-only interactions are accepted", () => {
  const base = {
    id: "hover-example",
    canonicalUrl: "https://codepen.io/Sicontis/pen/oNbgjda",
  };
  assert.equal(
    validateBatch([
      { ...base, interaction: { kind: "hover", selector: ".card" } },
    ]),
    null,
  );
  assert.equal(
    validateBatch([{ ...base, interaction: { kind: "scroll" } }]),
    null,
  );
  assert.match(
    validateBatch([
      { ...base, interaction: { kind: "click", selector: "button" } },
    ]),
    /invalid interaction/,
  );
});
