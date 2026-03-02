import { parsePhoneNumber } from 'libphonenumber-js'

/**
 * Normalize a raw phone number string to UAE E.164 format (+971XXXXXXXXX).
 * Handles national (05x), international (+971), and double-zero (00971) formats.
 * Returns null if the number is not a valid UAE phone number.
 */
export function normalizeToUAE(raw: string): string | null {
  try {
    const phone = parsePhoneNumber(raw.trim(), 'AE')
    if (phone && phone.isValid()) {
      return phone.number as string // E.164: '+971XXXXXXXXX'
    }
    return null
  } catch {
    return null
  }
}

/**
 * Format an E.164 phone number for human-readable display.
 * e.g., "+971501234567" -> "+971 50 123 4567"
 */
export function formatForDisplay(e164: string): string {
  try {
    const phone = parsePhoneNumber(e164)
    if (phone) {
      return phone.formatInternational()
    }
    return e164
  } catch {
    return e164
  }
}
