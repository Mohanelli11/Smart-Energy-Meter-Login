import { describe, expect, it } from 'vitest'
import { checkPasswordPolicy, isValidPhone, normalizePhone } from './passwordPolicy'

describe('checkPasswordPolicy', () => {
  it('rejects short passwords', () => {
    expect(checkPasswordPolicy('Ab1!').ok).toBe(false)
  })

  it('requires three character classes', () => {
    expect(checkPasswordPolicy('onlylowercaseletters').ok).toBe(false)
    expect(checkPasswordPolicy('lowercase and 12345678').ok).toBe(false) // also hits a common sequence
  })

  it('rejects the old shared demo password and other common words', () => {
    expect(checkPasswordPolicy('@Testing123').ok).toBe(false)
    expect(checkPasswordPolicy('MyPassword-2024!').ok).toBe(false)
  })

  it('accepts a strong passphrase', () => {
    expect(checkPasswordPolicy('Crimson-Otter-Lantern-42')).toEqual({ ok: true })
  })
})

describe('phone helpers', () => {
  it('normalises spaces and dashes', () => {
    expect(normalizePhone('+254 700-000 000')).toBe('+254700000000')
  })

  it('requires international format', () => {
    expect(isValidPhone('+254700000000')).toBe(true)
    expect(isValidPhone('0700000000')).toBe(false)
    expect(isValidPhone('+254abc')).toBe(false)
  })
})
