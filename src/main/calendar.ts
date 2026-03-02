import { shell, dialog } from 'electron'
import { google } from 'googleapis'
import { getGoogleAuth, isGoogleConnected } from './auth/google'
import { ContactRole } from '../shared/types'

/**
 * Open Google Calendar in the default browser with a pre-filled event.
 *
 * @param data - Session data for the current contact
 * @param type - 'viewing' for property viewings, 'consultation' for general meetings
 */
export async function openCalendarBooking(
  data: { name: string; displayNumber: string; roles: ContactRole[] },
  type: 'viewing' | 'consultation'
): Promise<void> {
  const name = data.name || data.displayNumber
  const roleText = data.roles.length > 0 ? data.roles.join(', ') : 'Contact'

  const title = type === 'viewing'
    ? `Viewing - ${name}`
    : `Consultation - ${name}`

  const details = [
    `Phone: ${data.displayNumber}`,
    `Role: ${roleText}`,
    '',
    type === 'viewing'
      ? 'Property viewing appointment'
      : 'Consultation meeting'
  ].join('\n')

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
 * Create a follow-up calendar event via the Google Calendar API.
 *
 * Creates a 30-minute event at 9:00 AM Dubai time on the target date.
 *
 * @param contact - Contact data for the event description
 * @param daysFromNow - Number of days from today for the follow-up
 */
export async function createFollowUp(
  contact: { name: string; displayNumber: string; roles: string[]; e164: string },
  daysFromNow: number
): Promise<{ success: boolean; error?: string; eventDate?: string }> {
  if (!isGoogleConnected()) {
    return { success: false, error: 'Google not signed in — please sign in via Settings' }
  }

  try {
    const auth = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const start = new Date()
    start.setDate(start.getDate() + daysFromNow)
    start.setHours(9, 0, 0, 0)  // 9:00 AM on target day

    const end = new Date(start)
    end.setHours(9, 30, 0, 0)  // 30-minute event

    const contactName = contact.name || contact.displayNumber
    const roleText = contact.roles.length > 0 ? contact.roles.join(', ') : 'Contact'

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Follow-up: ${contactName}`,
        description: `Phone: ${contact.displayNumber}\nRole: ${roleText}\n\nAuto-created by Agent Kit`,
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Dubai' },
        end: { dateTime: end.toISOString(), timeZone: 'Asia/Dubai' },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 30 }]
        }
      }
    })

    // Format the event date for the confirmation message
    const eventDate = start.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })

    return { success: true, eventDate }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create calendar event'
    return { success: false, error: message }
  }
}
