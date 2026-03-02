# Phase 2: Notes and Calendar Integration - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up OneNote contact profiles via Microsoft Graph API and add a call workflow loop: outbound dial auto-opens OneNote, incoming call via Phone Link shows a button to pull up the caller's profile, and post-call hang-up prompts for a follow-up reminder in Google Calendar. Viewing bookings (ORG-02) are already built — this phase does NOT rebuild them.

</domain>

<decisions>
## Implementation Decisions

### OneNote profile management
- Switch from PowerShell COM automation to Microsoft Graph API (cross-platform)
- ONE page per contact, keyed by normalized phone number
- All role templates appear as sections on the same page (not separate sections per role)
- Page layout: Contact header (name, phone, roles) > Role-specific qualifying template tables
- When a second role is added: new role's qualifying template is appended as a new section (no page rebuild, no data loss)
- Auth flow (MSAL with Notes.ReadWrite, Notes.Create scopes) already built
- Create a "Real Estate" notebook with contacts as individual pages

### Auto-open OneNote on dial
- When agent clicks "Dial" from the contact card, OneNote page auto-opens alongside
- Creates the page if it doesn't exist, navigates to it if it does
- Same behavior whether triggered from panel or popup

### Incoming call detection
- Monitor Windows Phone Link for incoming call notifications
- When a call comes in: show a button to pull up the caller's number in OneNote
- If caller is in contacts, show their name; if unknown, show the number
- Windows only for v1 — feature disabled in settings on macOS
- Uses `phoneLinkEnabled` setting toggle (already exists in AppSettings)

### Post-call follow-up prompt
- Detect hang-up via Phone Link (call-ended notification)
- Prompt: "Set a follow-up?" with three presets: 7 days, 15 days, 30 days
- One tap creates a Google Calendar event with contact details via Calendar API
- Toggleable in settings (agent can turn off the post-call prompt)
- Requires Google sign-in (auth flow already built)

### What's NOT in this phase
- Quick notepad / mid-call note-taking (NOTE-04) — not needed, agents update OneNote directly
- Viewing bookings (ORG-02) — already built in Phase 1 (opens Google Calendar in browser)
- Rebuilding calendar to use API — current browser-redirect approach stays for viewings

### Claude's Discretion
- Phone Link notification monitoring implementation details
- How to handle Graph API failures gracefully (retry, offline message, etc.)
- Incoming call button UI design and positioning
- Follow-up prompt UI (toast, popup, inline)
- Toast confirmation style after follow-up creation

</decisions>

<specifics>
## Specific Ideas

- OneNote page should read like a contact profile — everything about a person in one place
- Incoming call flow is simple: call comes in, button appears, one click opens their OneNote profile
- Post-call follow-up prompt should be unobtrusive — easy to dismiss if not needed
- The whole point is speed: agents are on the phone all day, every extra click costs them

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main/onenote.ts`: Role templates (ROLE_TEMPLATES), page XML builder — templates reusable, execution needs rewrite for Graph API
- `src/main/calendar.ts`: Calendar booking function (browser-redirect) — stays as-is for viewings; new Calendar API code needed for follow-ups only
- `src/main/auth/microsoft.ts`: MSAL auth with `Notes.ReadWrite`, `Notes.Create` scopes — ready for Graph API calls
- `src/main/auth/google.ts`: OAuth2 with Calendar scope, token refresh — ready for Calendar API calls
- `src/main/contacts.ts`: Full CRUD, `upsertContact`, `addRole` — ready to use
- `src/shared/types.ts`: Contact type with `oneNotePageId`, `roles`, `notes` fields
- `src/main/ipc.ts`: IPC handlers for onenote:open, calendar:book, auth:* — extend for new operations
- `src/renderer/panel/components/ContactCard.tsx`: OneNote/Viewing/Consult buttons already wired

### Established Patterns
- IPC: one-way (`ipcMain.on`) for fire-and-forget actions, two-way (`ipcMain.handle`) for data operations
- Store: `electron-store` with typed schema, `onDidChange` for reactive updates
- Auth: Browser-based OAuth with loopback redirect, token persistence via encrypted storage
- UI: Tailwind CSS, small component files in renderer/{window}/components/

### Integration Points
- ContactCard: update Dial button to also trigger OneNote open
- Main index.ts: Phone Link notification listener startup
- IPC: new handlers for Graph API OneNote operations, follow-up creation via Calendar API
- Tray.ts: incoming call popup/button creation
- Settings: add follow-up prompt toggle to AppSettings and FeatureToggles UI

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-notes-calendar*
*Context gathered: 2026-03-02*
