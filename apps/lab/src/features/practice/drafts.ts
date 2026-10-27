import type { PracticeCode } from './runtime'

export interface PracticeDraft {
  id: string
  title: string
  referenceSlug: string | null
  code: PracticeCode
  lastGoodCode: PracticeCode | null
  recoveryCode?: PracticeCode | null
  initialCode?: PracticeCode
  kitVersionId?: string | null
  kitAuthor?: string | null
  kitLicenseCode?: string | null
  createdAt: string
  updatedAt: string
}

const databaseName = 'kwak-motion-practice'
const storeName = 'drafts'
const version = 1

function isCode(value: unknown): value is PracticeCode {
  if (!value || typeof value !== 'object') return false
  const code = value as Record<string, unknown>
  return (
    typeof code.html === 'string' &&
    typeof code.css === 'string' &&
    typeof code.javascript === 'string'
  )
}

function isDraft(value: unknown): value is PracticeDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Record<string, unknown>
  return (
    typeof draft.id === 'string' &&
    typeof draft.title === 'string' &&
    (draft.referenceSlug === null || typeof draft.referenceSlug === 'string') &&
    isCode(draft.code) &&
    (draft.lastGoodCode === null || isCode(draft.lastGoodCode)) &&
    (draft.recoveryCode === undefined ||
      draft.recoveryCode === null ||
      isCode(draft.recoveryCode)) &&
    (draft.initialCode === undefined || isCode(draft.initialCode)) &&
    (draft.kitVersionId === undefined ||
      draft.kitVersionId === null ||
      typeof draft.kitVersionId === 'string') &&
    (draft.kitAuthor === undefined ||
      draft.kitAuthor === null ||
      typeof draft.kitAuthor === 'string') &&
    (draft.kitLicenseCode === undefined ||
      draft.kitLicenseCode === null ||
      typeof draft.kitLicenseCode === 'string') &&
    typeof draft.createdAt === 'string' &&
    !Number.isNaN(Date.parse(draft.createdAt)) &&
    typeof draft.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(draft.updatedAt))
  )
}

export const blankCode: PracticeCode = {
  html: '<main class="stage">여기에서 시작해보세요</main>',
  css: 'body { margin: 0; font-family: system-ui, sans-serif; }\n.stage { min-height: 100vh; display: grid; place-items: center; }',
  javascript: '',
}

let databasePromise: Promise<IDBDatabase> | null = null

function database(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  const opened = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, version)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('초안 저장소를 열 수 없습니다.'))
  }).catch((error: unknown) => {
    databasePromise = null
    throw error
  })
  databasePromise = opened
  return opened
}

export async function saveDraft(draft: PracticeDraft): Promise<void> {
  const db = await database()
  const stored: PracticeDraft = {
    id: draft.id,
    title: draft.title,
    referenceSlug: draft.referenceSlug,
    code: { ...draft.code },
    lastGoodCode: draft.lastGoodCode ? { ...draft.lastGoodCode } : null,
    recoveryCode: draft.recoveryCode ? { ...draft.recoveryCode } : null,
    initialCode: draft.initialCode ? { ...draft.initialCode } : { ...blankCode },
    kitVersionId: draft.kitVersionId ?? null,
    kitAuthor: draft.kitAuthor ?? null,
    kitLicenseCode: draft.kitLicenseCode ?? null,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  }
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(stored)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('초안을 저장하지 못했습니다.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('초안 저장이 중단됐습니다.'))
  })
}

export async function getDraft(id: string): Promise<PracticeDraft | null> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(id)
    request.onsuccess = () => {
      if (request.result === undefined) return resolve(null)
      if (!isDraft(request.result)) return reject(new Error('연습 초안 데이터가 손상됐습니다.'))
      resolve(request.result)
    }
    request.onerror = () => reject(request.error ?? new Error('초안을 읽지 못했습니다.'))
  })
}

export async function listDrafts(): Promise<{ drafts: PracticeDraft[]; invalidCount: number }> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    request.onsuccess = () => {
      const drafts = (request.result as unknown[]).filter(isDraft)
      resolve({
        drafts: drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        invalidCount: request.result.length - drafts.length,
      })
    }
    request.onerror = () => reject(request.error ?? new Error('초안 목록을 읽지 못했습니다.'))
  })
}

export async function createDraft(
  title = '새 연습',
  referenceSlug: string | null = null,
  starter?: { code: PracticeCode; versionId: string; author: string; licenseCode: string },
) {
  const now = new Date().toISOString()
  const draft: PracticeDraft = {
    id: crypto.randomUUID(),
    title,
    referenceSlug,
    code: starter ? { ...starter.code } : { ...blankCode },
    lastGoodCode: null,
    recoveryCode: null,
    initialCode: starter ? { ...starter.code } : { ...blankCode },
    kitVersionId: starter?.versionId ?? null,
    kitAuthor: starter?.author ?? null,
    kitLicenseCode: starter?.licenseCode ?? null,
    createdAt: now,
    updatedAt: now,
  }
  await saveDraft(draft)
  return draft
}
