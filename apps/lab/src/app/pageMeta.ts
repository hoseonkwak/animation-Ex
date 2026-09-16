export function setPageMeta(
  title: string,
  description: string,
  canonicalPath: string,
  index = true,
): void {
  const fullTitle = title === 'Kwak Motion Lab' ? title : `${title} | Kwak Motion Lab`
  document.title = fullTitle
  setNamedMeta('description', description)
  setNamedMeta('robots', index ? 'index, follow' : 'noindex, follow')
  setPropertyMeta('og:title', fullTitle)
  setPropertyMeta('og:description', description)
  setPropertyMeta('og:type', 'website')
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = new URL(canonicalPath, window.location.origin).toString()
}

function setNamedMeta(name: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.append(element)
  }
  element.content = content
}

function setPropertyMeta(property: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.append(element)
  }
  element.content = content
}
