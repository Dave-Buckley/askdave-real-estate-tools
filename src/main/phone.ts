import { parsePhoneNumber } from 'libphonenumber-js'

/**
 * Normalize a raw phone number string to E.164 format.
 * Tries UAE (AE) as default country for local numbers (05x, 04x, etc.)
 * but accepts any valid international number.
 * Returns null if the number is not a valid phone number.
 */
export function normalizePhone(raw: string): string | null {
  // Strip common non-digit noise but keep + at the start
  const cleaned = raw.trim()

  try {
    // Try parsing with AE as default country (handles local UAE formats)
    const phone = parsePhoneNumber(cleaned, 'AE')
    if (phone && phone.isValid()) {
      return phone.number as string
    }
  } catch {
    // fall through
  }

  try {
    // Try parsing without a default country (handles full international numbers)
    const phone = parsePhoneNumber(cleaned)
    if (phone && phone.isValid()) {
      return phone.number as string
    }
  } catch {
    // fall through
  }

  // Try prepending + if the string starts with digits that look like a country code
  if (/^\d{10,15}$/.test(cleaned.replace(/[\s\-()]/g, ''))) {
    try {
      const phone = parsePhoneNumber('+' + cleaned.replace(/[\s\-()]/g, ''))
      if (phone && phone.isValid()) {
        return phone.number as string
      }
    } catch {
      // fall through
    }
  }

  return null
}

/** @deprecated Use normalizePhone instead */
export const normalizeToUAE = normalizePhone

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
