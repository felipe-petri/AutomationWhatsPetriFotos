import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_PHOTO_PACKAGES,
  DOCUMENT_PHOTO_PRICE,
  DocumentPhotoFormat
} from '../../src/modules/document-photos/index.js'

describe('Document Photos Pricing and Packages', () => {
  it('deve garantir que o preço de qualquer formato de foto de documento é fixado em R$ 30,00', () => {
    expect(DOCUMENT_PHOTO_PRICE).toBe(30.0)
  })

  it('deve conter as quantidades corretas por pacote', () => {
    expect(DOCUMENT_PHOTO_PACKAGES['3x4']).toBe(6)
    expect(DOCUMENT_PHOTO_PACKAGES['3.5x4.5']).toBe(6)
    expect(DOCUMENT_PHOTO_PACKAGES['5x5']).toBe(2)
    expect(DOCUMENT_PHOTO_PACKAGES['5x7']).toBe(2)
  })
})
