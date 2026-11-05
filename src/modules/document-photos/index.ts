export const DOCUMENT_PHOTO_PRICE = 30.0

export const DOCUMENT_PHOTO_PACKAGES = {
  '3x4': 6,
  '3.5x4.5': 6,
  '5x5': 2,
  '5x7': 2
} as const

export type DocumentPhotoFormat = keyof typeof DOCUMENT_PHOTO_PACKAGES
