export type PracticeLibrary = 'gsap@3.15.0' | 'gsap-scrolltrigger@3.15.0'

export function validPracticeLibraries(value: unknown): value is PracticeLibrary[] {
  if (!Array.isArray(value) || new Set(value).size !== value.length) return false
  if (
    value.some((library) => library !== 'gsap@3.15.0' && library !== 'gsap-scrolltrigger@3.15.0')
  ) {
    return false
  }
  return !value.includes('gsap-scrolltrigger@3.15.0') || value.includes('gsap@3.15.0')
}

export interface PracticeKitPayload {
  kitId: string
  versionId: string
  version: number
  code: { html: string; css: string; javascript: string }
  libraries: PracticeLibrary[]
  interactionInstructions: string
  provenance: {
    basis: 'independent-reimplementation'
    author: string
    licenseCode: string
  }
}
