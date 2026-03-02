import { shell } from 'electron'

/**
 * Open the OS phone dialler with the number pre-filled (does NOT auto-call).
 * Uses tel: URI scheme supported on both Windows and macOS.
 */
export async function openDialler(e164: string): Promise<void> {
  try {
    await shell.openExternal(`tel:${e164}`)
  } catch (err) {
    console.error('Failed to open dialler:', err)
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
 * Returns the URL string for use with shell.openExternal.
 */
export function buildWhatsAppURL(e164: string, message: string): string {
  const digits = e164.replace('+', '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
