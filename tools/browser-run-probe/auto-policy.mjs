const GENERIC_TITLE =
  /^(?:code\s*view|view\s*code|untitled|source|result|웹 애니메이션 예제\s*[a-z0-9]*)$/i;

export function isCandidateEligible(row) {
  if (row.status !== "review" || !row.canonical_url || !row.creator_name)
    return false;
  if (row.license_code !== "MIT" || !row.license_evidence_url) return false;
  if (row.confirmed_tag !== 1 || row.duplicate_pen !== 0) return false;
  let metadata;
  try {
    metadata = JSON.parse(row.metadata_json);
  } catch {
    return false;
  }
  const title = String(metadata.publicTitle ?? "").trim();
  return title.length >= 8 && !GENERIC_TITLE.test(title);
}

export function passesAutomaticProbe(result) {
  return (
    result.status === "visual-change-observed" &&
    result.embedStatus === 200 &&
    result.resultStatus === 200 &&
    result.bodyLength >= 100 &&
    result.elementCount >= 2 &&
    result.earlyChange === true &&
    result.lateChange === true &&
    result.pageErrors.length === 0
  );
}

export function sampleIndex(batchId, count) {
  let hash = 2166136261;
  for (const char of batchId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}
