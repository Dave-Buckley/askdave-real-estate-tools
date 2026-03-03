import { shell, dialog } from 'electron'
import { ContactRole } from '../shared/types'

/**
 * Open Google Calendar in the default browser with a pre-filled event.
 *
 * @param data - Session data for the current contact
 * @param type - 'viewing' for property viewings, 'consultation' for general meetings
 */
export async function openCalendarBooking(
  data: { name: string; displayNumber: string; roles: ContactRole[]; unit?: string; email?: string },
  type: 'viewing' | 'consultation',
  templateBody?: string
): Promise<void> {
  const name = data.name || data.displayNumber
  const roleText = data.roles.length > 0 ? data.roles.join(', ') : 'Contact'

  const title = type === 'viewing'
    ? `Viewing - ${name}`
    : `Consultation - ${name}`

  let details: string
  if (templateBody) {
    // Substitute placeholders in the template body
    const filled = templateBody
      .replace(/\{name\}/gi, name)
      .replace(/\{number\}/gi, data.displayNumber)
      .replace(/\{email\}/gi, data.email || '')
      .replace(/\{unit\}/gi, data.unit || '')
    details = [
      `Phone: ${data.displayNumber}`,
      ...(data.email ? [`Email: ${data.email}`] : []),
      `Role: ${roleText}`,
      '',
      filled
    ].join('\n')
  } else {
    details = [
      `Phone: ${data.displayNumber}`,
      ...(data.email ? [`Email: ${data.email}`] : []),
      `Role: ${roleText}`,
      '',
      type === 'viewing'
        ? 'Property viewing appointment'
        : 'Consultation meeting'
    ].join('\n')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details
  })

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`

  try {
    await shell.openExternal(url)
  } catch {
    dialog.showMessageBox({
      type: 'error',
      title: 'Could Not Open Browser',
      message: 'Failed to open Google Calendar in your browser.',
      detail: 'Please check that you have a default browser configured.',
      buttons: ['OK']
    })
  }
}

/**
 * Create a follow-up calendar event by opening Google Calendar in the browser.
 *
 * @param contact - Contact data for the event description
 * @param daysFromNow - Number of days from today for the follow-up
 */
export async function createFollowUp(
  contact: { name: string; displayNumber: string; roles: string[]; e164: string; email?: string },
  daysFromNow: number
): Promise<{ success: boolean; error?: string; eventDate?: string }> {
  const start = new Date()
  start.setDate(start.getDate() + daysFromNow)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start)
  end.setHours(9, 30, 0, 0)

  const contactName = contact.name || contact.displayNumber
  const roleText = contact.roles.length > 0 ? contact.roles.join(', ') : 'Contact'
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const emailLine = contact.email ? `\nEmail: ${contact.email}` : ''
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Follow-up: ${contactName}`,
    details: `Phone: ${contact.displayNumber}${emailLine}\nRole: ${roleText}\n\nAuto-created by Ask Dave Real Estate Tools`,
    dates: `${fmt(start)}/${fmt(end)}`,
    ctz: 'Asia/Dubai'
  })

  const eventDate = start.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  await shell.openExternal(`https://calendar.google.com/calendar/render?${params.toString()}`)
  return { success: true, eventDate: `${eventDate} (opened in browser)` }
}
