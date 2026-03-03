import { clipboard } from 'electron'
import { normalizePhone, formatForDisplay } from './phone'

/**
 * Broad regex to detect phone numbers in clipboard text.
 * Matches sequences of digits (with optional +, spaces, dashes, parens) that are 7-15 digits long.
 */
const PHONE_LOOSE_REGEX = /(?:\+?\d[\d\s\-()]{6,18}\d)/g

/**
 * Regex to detect email addresses in clipboard text.
 */
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

/**
 * Strip invisible Unicode characters that apps like WhatsApp Desktop inject.
 */
function stripInvisibleChars(text: string): string {
  return text.replace(
    /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF\u00AD\u034F\u061C\u180E]/g,
    ''
  )
}

/**
 * Extract and return the first valid phone number from text, or null.
 */
export function extractPhoneNumber(text: string): string | null {
  const cleaned = stripInvisibleChars(text)
  const matches = cleaned.match(PHONE_LOOSE_REGEX)
  if (!matches) return null

  for (const raw of matches) {
    const e164 = normalizePhone(raw)
    if (e164) return e164
  }
  return null
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let lastClipboardText: string = ''
let suppressUntil = 0

/**
 * Flag to skip the next clipboard change detection.
 * Set this before programmatically writing to the clipboard (e.g. dial-copy)
 * to prevent the watcher from re-triggering the popup.
 */
let skipNextChange = false

export function setSkipNextClipboardChange(): void {
  skipNextChange = true
}

/**
 * Suppress clipboard phone detection for a period.
 * After the period, resets lastClipboardText so the same number CAN
 * re-trigger if the user copies it again.
 *
 * - panel:action-done calls with 60s (task completed, user moved on)
 * - panel:close / panel:minimize call with 15s (user dismissed, but may re-copy soon)
 */
export function suppressDetection(ms = 60000): void {
  suppressUntil = Date.now() + ms
  // Reset so that after suppression expires, ANY clipboard phone number triggers
  lastClipboardText = ''
}

/**
 * Start polling the clipboard for phone numbers and email addresses.
 * When new text containing a phone number is copied, calls onPhoneDetected.
 * When an email address is copied, calls onEmailDetected.
 */
export function startClipboardWatcher(
  onPhoneDetected: (e164: string, displayNumber: string) => void,
  onEmailDetected?: (email: string) => void
): void {
  // Snapshot current clipboard so we don't trigger on pre-existing content
  lastClipboardText = clipboard.readText()

  pollTimer = setInterval(() => {
    // Suppressed after an action completed — don't detect anything
    if (Date.now() < suppressUntil) return

    const text = clipboard.readText()

    if (skipNextChange) {
      if (text !== lastClipboardText) {
        lastClipboardText = text
        skipNextChange = false
      }
      return
    }

    // Same text — skip (clipboard hasn't changed)
    if (text === lastClipboardText) return
    lastClipboardText = text

    const trimmed = text.trim()
    if (!trimmed) return

    // Reject long text (paragraphs, articles) — phones ≤25 chars, emails ≤80 chars
    if (trimmed.length > 80) return

    // Try phone detection first (short text only)
    if (trimmed.length <= 25) {
      const e164 = extractPhoneNumber(text)
      if (e164) {
        const displayNumber = formatForDisplay(e164)
        onPhoneDetected(e164, displayNumber)
        return
      }
    }

    // Try email detection
    if (onEmailDetected && EMAIL_REGEX.test(trimmed)) {
      onEmailDetected(trimmed)
    }
  }, 500)
}

/**
 * Stop the clipboard polling watcher.
 */
export function stopClipboardWatcher(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}
