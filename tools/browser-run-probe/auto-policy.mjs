const GENERIC_TITLE =
  /^(?:code\s*view|view\s*code|untitled|source|result|웹 애니메이션 예제\s*[a-z0-9]*)$/i;

export const AUTO_CATEGORIES = ["Animation/GSAP", "Animation/Loading"];
export const MIN_AUTO_BATCH = 3;

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
  const sourceTitle = String(row.source_title ?? "").trim();
  if (
    row.source_category === "Animation/Loading" &&
    !/\b(?:preload(?:er|ing)?|load(?:er|ing)?|spinner|progress)\b/i.test(
      sourceTitle,
    )
  )
    return false;
  return (
    title.length >= 8 &&
    !GENERIC_TITLE.test(title) &&
    sourceTitle.length >= 8 &&
    !GENERIC_TITLE.test(sourceTitle)
  );
}

export function pickAutomaticCandidates(rows, maxCount) {
  const eligible = rows.filter(isCandidateEligible);
  for (const category of AUTO_CATEGORIES) {
    const matches = eligible.filter((row) => row.source_category === category);
    if (matches.length >= MIN_AUTO_BATCH) return matches.slice(0, maxCount);
  }
  return [];
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
