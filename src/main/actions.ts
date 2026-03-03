import { clipboard, shell } from 'electron'
import { setSkipNextClipboardChange } from './clipboard'

/**
 * Copy the phone number to clipboard and open Phone Link dialler.
 * Sets the skip flag so the clipboard watcher doesn't re-trigger.
 */
export async function openDialler(e164: string): Promise<void> {
  try {
    setSkipNextClipboardChange()
    clipboard.writeText(e164)
    await shell.openExternal(`tel:${e164}`)
  } catch (err) {
    console.error('Failed to dial:', err)
  }
}

/**
 * Open a WhatsApp chat with the given phone number.
 * 'web' mode: opens https://wa.me/ in the default browser (always works).
 * 'desktop' mode: opens whatsapp:// protocol (requires WhatsApp desktop installed).
 */
export async function openWhatsApp(
  e164: string,
  mode: 'web' | 'desktop'
): Promise<void> {
  const digits = e164.replace('+', '')
  try {
    if (mode === 'web') {
      await shell.openExternal(`https://wa.me/${digits}`)
    } else {
      await shell.openExternal(`whatsapp://send?phone=${digits}`)
    }
  } catch (err) {
    console.error('Failed to open WhatsApp:', err)
  }
}

/**
 * Build a WhatsApp URL with a pre-filled message for template sending.
 * 'web' mode: wa.me link (opens in browser).
 * 'desktop' mode: whatsapp:// protocol (opens desktop app).
 */
export function buildWhatsAppURL(e164: string, message: string, mode: 'web' | 'desktop' = 'web'): string {
  const digits = e164.replace('+', '')
  if (mode === 'desktop') {
    return `whatsapp://send?phone=${digits}&text=${encodeURIComponent(message)}`
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
