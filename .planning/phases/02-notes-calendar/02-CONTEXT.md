# Phase 2: Notes and Calendar Integration - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the communicate-document-follow-up loop: agents document every call in a structured OneNote page and set follow-up reminders and viewing bookings in Google Calendar, all from within the app. Includes incoming call detection via Windows Phone Link that auto-loads the caller's context.

</domain>

<decisions>
## Implementation Decisions

### Quick notepad experience
- Floating mini-window (separate always-on-top window), NOT inside the panel or popup
- Auto-opens when the agent triggers Dial or WhatsApp from the contact card
- One-click "Push to OneNote" button at bottom of the notepad
- Pushed notes prefixed with timestamp only (no agent name)
- Notepad clears after successful push
- Can be dismissed manually if not needed

### Follow-up reminders
- Three preset buttons visible on the contact card: "3 days", "15 days", "30 days"
- Plus a "+ Custom" option that opens a mini date/time picker for any date
- Events created directly via Google Calendar API (in-app, no browser redirect)
- Agent gets a confirmation toast after event creation
- Requires Google sign-in (auth flow already built)

### Viewing & event booking
- Add an optional email field to the Contact model for calendar invites
- When booking a viewing: mini form with date picker, time slot, and property address field
- Calendar event title auto-fills as "Viewing - [Name] - [Address]"
- If client email exists on contact, Google Calendar invite is sent automatically
- No email = event created without invite (agent can forward manually)
- Events created via Google Calendar API (same as follow-ups)

### Incoming call detection
- Monitor Windows Phone Link toast notifications for incoming call events
- Extract phone number from notification content
- Show a notification-style popup with caller info (number + name if in contacts)
- Popup buttons: "Open OneNote", "Open Panel"; if unknown caller, offer "Add Contact"
- Floating notepad auto-opens alongside the popup (ready for note-taking)
- Windows only for v1 — feature disabled in settings on macOS
- Uses `phoneLinkEnabled` setting toggle (already exists in AppSettings)

### OneNote page structure
- ONE page per contact, keyed by normalized phone number
- All role templates appear as sections on the same page (not separate sections per role)
- Page layout: Contact header (name, phone, roles) > Role template tables > "Call Notes" section
- Dedicated "Call Notes" section at bottom of page for pushed notes (timestamped entries)
- When a second role is added: new role's qualifying template is appended as a new section (no page rebuild, no data loss)

### OneNote API approach
- Switch from PowerShell COM automation to Microsoft Graph API
- Cross-platform: works on both Windows and macOS
- Requires internet connection (Graph API is cloud-based)
- Auth flow (MSAL with Notes.ReadWrite, Notes.Create scopes) already built
- Create a "Real Estate" notebook with contacts as individual pages

### Claude's Discretion
- Floating notepad window size and positioning
- Exact toast notification style for calendar confirmations
- Phone Link notification monitoring implementation details
- How to handle Graph API failures gracefully (retry, offline message, etc.)
- Contact email field placement and validation in the UI
- Custom date picker component choice

</decisions>

<specifics>
## Specific Ideas

- Notepad should feel instant and lightweight — agents use it mid-call, so speed matters
- Follow-up presets (3/15/30 days) are the most common intervals UAE real estate agents use
- OneNote page should read like a contact dossier — everything about a person in one place
- Incoming call detection creates a "who's calling?" moment — the popup should load fast with whatever context exists

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main/onenote.ts`: Role templates (ROLE_TEMPLATES), page XML builder, PowerShell executor — templates reusable, execution needs rewrite for Graph API
- `src/main/calendar.ts`: Calendar booking function — needs rewrite from browser-redirect to API call
- `src/main/auth/microsoft.ts`: MSAL auth with `Notes.ReadWrite`, `Notes.Create` scopes — ready for Graph API calls
- `src/main/auth/google.ts`: OAuth2 with Calendar scope, token refresh — ready for Calendar API calls
- `src/main/contacts.ts`: Full CRUD, `upsertContact`, `addRole` — needs email field added
- `src/shared/types.ts`: Contact type with `oneNotePageId`, `roles`, `notes` fields — needs email field
- `src/main/ipc.ts`: IPC handlers for onenote:open, calendar:book, auth:* — extend for new operations
- `src/renderer/panel/components/ContactCard.tsx`: OneNote/Viewing/Consult buttons already wired — extend with follow-up presets and email field

### Established Patterns
- IPC: one-way (`ipcMain.on`) for fire-and-forget actions, two-way (`ipcMain.handle`) for data operations
- Store: `electron-store` with typed schema, `onDidChange` for reactive updates
- Auth: Browser-based OAuth with loopback redirect, token persistence via encrypted storage
- UI: Tailwind CSS, small component files in renderer/{window}/components/

### Integration Points
- ContactCard needs: follow-up preset buttons, email field, updated OneNote button behavior
- Panel App.tsx needs: floating notepad window management
- Main index.ts needs: Phone Link notification listener startup
- IPC needs: new handlers for Graph API operations, notepad push, follow-up creation
- Types needs: email field on Contact, calendar event types
- Tray.ts needs: floating notepad window creation (similar to popup window)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-notes-calendar*
*Context gathered: 2026-03-02*
