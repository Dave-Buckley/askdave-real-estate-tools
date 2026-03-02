import { clipboard } from 'electron'
import { normalizeToUAE, formatForDisplay } from './phone'

/** Loose regex to detect UAE phone numbers in clipboard text */
const UAE_LOOSE_REGEX = /(?:(?:\+|00)971|0)(?:5[0-9]|[2-9])\d{7}/g

let lastClipboardText = ''
let pollingInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start polling the clipboard every 500ms for UAE phone numbers.
 * When a valid UAE number is detected, calls the callback with E.164 and display format.
 */
export function startClipboardPolling(
  onPhoneDetected: (e164: string, displayNumber: string) => void
): void {
  pollingInterval = setInterval(() => {
    const text = clipboard.readText()
    if (text === lastClipboardText) return
    lastClipboardText = text

    const matches = text.match(UAE_LOOSE_REGEX)
    if (!matches) return

    // Normalize the first match using libphonenumber-js
    const rawNumber = matches[0]
    const e164 = normalizeToUAE(rawNumber)
    if (e164) {
      const displayNumber = formatForDisplay(e164)
      onPhoneDetected(e164, displayNumber)
    }
  }, 500)
}

/**
 * Stop clipboard polling and clear the interval.
 */
export function stopClipboardPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}
