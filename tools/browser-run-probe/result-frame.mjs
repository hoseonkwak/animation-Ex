export function isResultDocumentUrl(raw) {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      (url.hostname === "cdpn.io" ||
        url.hostname.endsWith(".cdpn.io") ||
        url.hostname === "codepen.dev" ||
        url.hostname.endsWith(".codepen.dev"))
    );
  } catch {
    return false;
  }
}
