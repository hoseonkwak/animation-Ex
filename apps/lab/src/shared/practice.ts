export interface PracticeKitPayload {
  kitId: string
  versionId: string
  version: number
  code: { html: string; css: string; javascript: string }
  interactionInstructions: string
  provenance: {
    basis: 'independent-reimplementation'
    author: string
    licenseCode: string
  }
}
