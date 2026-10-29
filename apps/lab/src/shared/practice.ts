export type PracticeLibrary = 'gsap@3.15.0'

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
