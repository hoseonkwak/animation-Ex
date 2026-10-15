export const CONTROL = {
  id: "positive-control",
  canonicalUrl: "https://codepen.io/hoseonkwak/pen/LEVeYQO",
};

export function toEmbedUrl(canonicalUrl) {
  let url;
  try {
    url = new URL(canonicalUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== "codepen.io") return null;
  if (url.search || url.hash || url.port || url.username || url.password)
    return null;
  const match = /^\/([A-Za-z0-9_-]+)\/pen\/([A-Za-z0-9_-]+)\/?$/.exec(
    url.pathname,
  );
  if (!match) return null;
  return `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result&theme-id=light`;
}

export function validateBatch(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    return "candidates must contain 1 to 5 items";
  }
  const ids = new Set();
  for (const item of value) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(item.id)
    ) {
      return "each candidate needs a safe id";
    }
    if (ids.has(item.id)) return "candidate ids must be unique";
    ids.add(item.id);
    if (
      typeof item.canonicalUrl !== "string" ||
      !toEmbedUrl(item.canonicalUrl)
    ) {
      return `invalid CodePen URL for ${item.id}`;
    }
    if (item.interaction !== undefined) {
      if (item.interaction?.kind === "scroll") continue;
      if (
        item.interaction?.kind !== "hover" ||
        typeof item.interaction.selector !== "string" ||
        item.interaction.selector.length < 1 ||
        item.interaction.selector.length > 80 ||
        /[<>]/.test(item.interaction.selector)
      ) {
        return `invalid interaction for ${item.id}`;
      }
    }
  }
  return null;
}
