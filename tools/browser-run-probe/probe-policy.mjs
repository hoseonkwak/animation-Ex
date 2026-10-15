export function controlLoaded(control) {
  return (
    control.embedStatus === 200 &&
    control.resultStatus === 200 &&
    control.bodyLength > 0 &&
    control.pageErrors.length === 0
  );
}

export function classifyEmbedStatus(status) {
  if (status === 404 || status === 410) return "failed";
  return "inconclusive";
}
