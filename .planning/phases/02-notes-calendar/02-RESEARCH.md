# Phase 2: Notes and Calendar Integration - Research

**Researched:** 2026-03-02
**Domain:** Microsoft Graph OneNote API, Google Calendar API, Windows Phone Link notification detection
**Confidence:** MEDIUM-HIGH (Graph API well-documented; Phone Link detection is LOW confidence)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**OneNote profile management**
- Switch from PowerShell COM automation to Microsoft Graph API (cross-platform)
- ONE page per contact, keyed by normalized phone number
- All role templates appear as sections on the same page (not separate sections per role)
- Page layout: Contact header (name, phone, roles) > Role-specific qualifying template tables
- When a second role is added: new role's qualifying template is appended as a new section (no page rebuild, no data loss)
- Auth flow (MSAL with Notes.ReadWrite, Notes.Create scopes) already built
- Create a "Real Estate" notebook with contacts as individual pages

**Auto-open OneNote on dial**
- When agent clicks "Dial" from the contact card, OneNote page auto-opens alongside
- Creates the page if it doesn't exist, navigates to it if it does
- Same behavior whether triggered from panel or popup

**Incoming call detection**
- Monitor Windows Phone Link for incoming call notifications
- When a call comes in: show a button to pull up the caller's number in OneNote
- If caller is in contacts, show their name; if unknown, show the number
- Windows only for v1 — feature disabled in settings on macOS
- Uses `phoneLinkEnabled` setting toggle (already exists in AppSettings)

**Post-call follow-up prompt**
- Detect hang-up via Phone Link (call-ended notification)
- Prompt: "Set a follow-up?" with three presets: 7 days, 15 days, 30 days
- One tap creates a Google Calendar event with contact details via Calendar API
- Toggleable in settings (agent can turn off the post-call prompt)
- Requires Google sign-in (auth flow already built)

**What's NOT in this phase**
- Quick notepad / mid-call note-taking (NOTE-04) — not needed, agents update OneNote directly
- Viewing bookings (ORG-02) — already built in Phase 1 (opens Google Calendar in browser)
- Rebuilding calendar to use API — current browser-redirect approach stays for viewings

### Claude's Discretion
- Phone Link notification monitoring implementation details
- How to handle Graph API failures gracefully (retry, offline message, etc.)
- Incoming call button UI design and positioning
- Follow-up prompt UI (toast, popup, inline)
- Toast confirmation style after follow-up creation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTE-01 | Tool auto-creates a new OneNote page per contact (keyed on normalized phone number) or navigates to an existing one | Graph API: POST /me/onenote/pages in a named section; GET pages with $filter=title eq '{phone}' to find existing |
| NOTE-02 | OneNote pages are pre-filled with role-specific qualifying templates (tenant, landlord, buyer, seller, portfolio) | ROLE_TEMPLATES already defined in onenote.ts; convert to HTML table format for Graph API POST |
| NOTE-03 | A single contact can have multiple roles; templates adapt when a new role is added to an existing contact | Graph API PATCH /pages/{id}/content with append action to body target — adds new section without page rebuild |
| NOTE-04 | Agent can jot property details into a quick notepad mid-call and push them to the contact's OneNote page | CONTEXT.md explicitly removes this requirement — agents update OneNote directly |
| ORG-01 | Agent can set a follow-up reminder (3, 15, or 30 days) that auto-creates a Google Calendar event | googleapis calendar.events.insert() — already authenticated via existing google.ts; use date+N days as start |
| ORG-02 | Agent can create a viewing event from a contact and send a Google Calendar invite | Already implemented in Phase 1 via browser redirect (calendar.ts) — no work needed |
| APP-03 | App detects incoming call notifications via phone-link integration and offers to open the caller's OneNote page | Windows UserNotificationListener WinRT API via PowerShell polling or @xan105/nodert — LOW confidence on approach |
</phase_requirements>

---

## Summary

This phase has three distinct technical domains. Two are straightforward because the auth infrastructure is already built and verified: Microsoft Graph API for OneNote, and Google Calendar API for follow-up events. The third domain — detecting Windows Phone Link call notifications — is the highest-risk item and requires careful approach selection.

**Microsoft Graph OneNote** uses a simple REST/HTTP pattern over `https://graph.microsoft.com/v1.0/me/onenote/`. Pages are created with HTML content via POST and updated by PATCH with JSON change objects. The existing `@microsoft/microsoft-graph-client@3.0.7` package is already in `package.json`. The MSAL auth flow (`src/main/auth/microsoft.ts`) already handles token acquisition — the Graph client is initialized with a custom auth provider that calls `microsoftGetAccessToken()`. Page lookup uses OData `$filter=title eq '{e164}'` against a section's pages. The key data model insight: all role templates go on ONE page as separate HTML sections appended via PATCH, not separate pages.

**Google Calendar API** for follow-up events is straightforward: the `googleapis@171.4.0` package and OAuth client (`src/main/auth/google.ts`) are already wired and token-refreshing. Creating a follow-up event uses `calendar.events.insert()` with `calendarId: 'primary'`, a start date of today+N days, and an end date of start+1 hour. The existing `getGoogleAuth()` export gives the authenticated OAuth2 client directly to the Calendar API.

**Phone Link notification detection** is the risky domain. The WinRT `UserNotificationListener` API (Windows.UI.Notifications.Management) is the only documented way to receive real-time notifications from other applications. This requires either: (a) a PowerShell polling loop calling WinRT via .NET — works but is slow and fragile; or (b) `@xan105/nodert` with `windows.ui.notifications.management` precompiled bindings for real-time `NotificationChanged` events — better UX but requires native module, Electron compatibility must be verified. A third fallback is clipboard/accessibility-API polling, which is unreliable. The implementation approach for Phone Link is left to Claude's discretion per CONTEXT.md.

**Primary recommendation:** Build OneNote and Calendar first (Tasks 1-3). Treat Phone Link detection as a separate task with a defined fallback: if NodeRT approach fails, implement a PowerShell polling loop as v1 fallback and flag for future improvement.

---

## Standard Stack

### Core (Already Installed — No New Installs Required for OneNote + Calendar)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@microsoft/microsoft-graph-client` | 3.0.7 | REST client for Microsoft Graph API | Official Microsoft SDK; already in package.json |
| `@azure/msal-node` | 5.0.5 | Microsoft auth token acquisition | Already wired and working in microsoft.ts |
| `googleapis` | 171.4.0 | Google Calendar events.insert() | Official Google SDK; already in package.json; getGoogleAuth() ready |

### Supporting (Phone Link Detection — evaluate before installing)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@xan105/nodert` | latest | Precompiled WinRT bindings for Node.js/Electron | If UserNotificationListener approach chosen; requires Electron-compatible build |
| PowerShell child_process | built-in | Poll WinRT UserNotificationListener from PS script | Fallback if NodeRT Electron build fails; simpler but ~1s polling latency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@microsoft/microsoft-graph-client` | Raw `fetch` with Graph REST | fetch is simpler but loses auth middleware, retry handling |
| `@xan105/nodert` | Native C++ Node addon (custom) | Custom addon takes weeks; NodeRT is precompiled |
| PowerShell poll for Phone Link | Windows accessibility APIs | Accessibility APIs require UI Automation COM, more complex than PowerShell WinRT |

**Installation (only if Phone Link NodeRT approach chosen):**
```bash
npm install @xan105/nodert --modules="windows.ui.notifications.management, windows.ui.notifications"
```

No new packages needed for OneNote or Calendar work.

---

## Architecture Patterns

### Recommended Project Structure

```
src/main/
├── onenote.ts          # REWRITE: Graph API OneNote (keep ROLE_TEMPLATES, new HTTP logic)
├── calendar.ts         # EXTEND: add createFollowUp() alongside existing openCalendarBooking()
├── phone-link.ts       # NEW: Windows Phone Link notification monitoring
├── auth/
│   ├── microsoft.ts    # Existing — provides microsoftGetAccessToken()
│   └── google.ts       # Existing — provides getGoogleAuth()
src/renderer/
├── panel/components/
│   └── ContactCard.tsx # Update: Dial button also triggers onenote:open
├── popup/components/
│   └── IncomingCallBar.tsx  # NEW: shown when Phone Link detects incoming call
└── settings/components/
    └── FeatureToggles.tsx   # Update: add followUpPromptEnabled toggle
```

### Pattern 1: Graph API Client Initialization

The `@microsoft/microsoft-graph-client` v3 supports a custom auth provider. Since MSAL already handles token acquisition and refresh, wrap `microsoftGetAccessToken()` in a Graph auth provider:

```typescript
// Source: https://learn.microsoft.com/en-us/graph/sdks/create-client
import { Client, AuthenticationProvider } from '@microsoft/microsoft-graph-client'
import { microsoftGetAccessToken } from './auth/microsoft'

function getGraphClient(): Client {
  const authProvider: AuthenticationProvider = {
    getAccessToken: async () => {
      const token = await microsoftGetAccessToken()
      if (!token) throw new Error('Microsoft not signed in')
      return token
    }
  }
  return Client.initWithMiddleware({ authProvider })
}
```

### Pattern 2: OneNote Page Lifecycle (Find or Create)

The page key is the contact's E.164 phone number used as the page title. The lookup uses OData filter on the section's pages.

```typescript
// Source: https://learn.microsoft.com/en-us/graph/onenote-get-content
// Source: https://learn.microsoft.com/en-us/graph/api/onenote-post-pages

async function findOrCreatePage(client: Client, sectionId: string, e164: string): Promise<string> {
  // Find existing page by title (E.164 is the page title/key)
  const pages = await client
    .api(`/me/onenote/sections/${sectionId}/pages`)
    .filter(`title eq '${e164}'`)
    .select('id,title')
    .get()

  if (pages.value.length > 0) {
    return pages.value[0].id  // Existing page — return ID for navigation
  }

  // Create new page with HTML content
  const html = buildPageHTML(e164, name, roles)
  const response = await client
    .api(`/me/onenote/sections/${sectionId}/pages`)
    .header('Content-Type', 'text/html')
    .post(html)

  return response.id
}
```

### Pattern 3: Append New Role Section to Existing Page (NOTE-03)

When a contact gains a second role, PATCH the page to append the new template. Use `target: 'body'` with `action: 'append'` — this appends to the first div on the page.

```typescript
// Source: https://learn.microsoft.com/en-us/graph/onenote-update-page
async function appendRoleSection(client: Client, pageId: string, role: ContactRole): Promise<void> {
  const newSectionHTML = buildRoleSectionHTML(role)  // One role's table HTML
  const patchBody = [
    {
      target: 'body',
      action: 'append',
      content: newSectionHTML
    }
  ]

  await client
    .api(`/me/onenote/pages/${pageId}/content`)
    .header('Content-Type', 'application/json')
    .patch(JSON.stringify(patchBody))
}
```

### Pattern 4: Navigate to OneNote Page via oneNoteClientUrl

After creating or finding a page, navigate to it via `shell.openExternal(page.links.oneNoteClientUrl.href)`. This opens the OneNote desktop app at the specific page.

```typescript
// Source: https://learn.microsoft.com/en-us/graph/api/onenote-post-pages (response body)
// page.links.oneNoteClientUrl.href = "onenote:https://..." — opens OneNote desktop to that page
await shell.openExternal(page.links.oneNoteClientUrl.href)
```

To navigate to an existing page (found via filter), GET the page with `?select=links` to retrieve the client URL.

### Pattern 5: Find or Create Notebook + Section

The notebook "Real Estate" and section "Contacts" must be found or created on first use. Cache their IDs in `electron-store` to avoid repeated API calls.

```typescript
// Source: https://learn.microsoft.com/en-us/graph/api/onenote-list-notebooks
// Source: https://learn.microsoft.com/en-us/graph/api/onenote-post-notebooks

async function ensureNotebookAndSection(client: Client): Promise<{ notebookId: string; sectionId: string }> {
  // Check cache first
  const cached = store.get('oneNoteSection')
  if (cached?.sectionId) return cached

  // Find or create "Real Estate" notebook
  const notebooks = await client
    .api('/me/onenote/notebooks')
    .filter(`displayName eq 'Real Estate'`)
    .select('id,displayName')
    .get()

  let notebookId: string
  if (notebooks.value.length > 0) {
    notebookId = notebooks.value[0].id
  } else {
    const nb = await client.api('/me/onenote/notebooks').post({ displayName: 'Real Estate' })
    notebookId = nb.id
  }

  // Find or create "Contacts" section within notebook
  const sections = await client
    .api(`/me/onenote/notebooks/${notebookId}/sections`)
    .filter(`displayName eq 'Contacts'`)
    .select('id,displayName')
    .get()

  let sectionId: string
  if (sections.value.length > 0) {
    sectionId = sections.value[0].id
  } else {
    const sec = await client
      .api(`/me/onenote/notebooks/${notebookId}/sections`)
      .post({ displayName: 'Contacts' })
    sectionId = sec.id
  }

  // Cache for future calls
  store.set('oneNoteSection' as never, { notebookId, sectionId })
  return { notebookId, sectionId }
}
```

### Pattern 6: Google Calendar Follow-Up Event

Uses the existing `getGoogleAuth()` from `src/main/auth/google.ts`. No new auth setup needed.

```typescript
// Source: https://developers.google.com/workspace/calendar/api/guides/create-events
import { google } from 'googleapis'
import { getGoogleAuth } from './auth/google'

async function createFollowUpEvent(contact: Contact, daysFromNow: number): Promise<string> {
  const auth = getGoogleAuth()
  const calendar = google.calendar({ version: 'v3', auth })

  const startDate = new Date()
  startDate.setDate(startDate.getDate() + daysFromNow)
  startDate.setHours(9, 0, 0, 0)  // 9am on target day

  const endDate = new Date(startDate)
  endDate.setHours(9, 30, 0, 0)  // 30-min slot

  const event = {
    summary: `Follow-up: ${contact.name || contact.displayNumber}`,
    description: `Phone: ${contact.displayNumber}\nRoles: ${contact.roles.join(', ')}`,
    start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Dubai' },
    end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Dubai' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 }
      ]
    }
  }

  const response = await calendar.events.insert({ calendarId: 'primary', requestBody: event })
  return response.data.htmlLink ?? ''
}
```

### Pattern 7: Phone Link Notification Detection (LOW confidence — choose approach)

**Option A: PowerShell polling (recommended for v1, no native module)**

Poll WinRT `UserNotificationListener` from a PowerShell child process on an interval (every 1-2 seconds). Parse notification text for Phone Link app ID and call-related keywords.

```typescript
// Run in main process; Phone Link app identifier: "Microsoft.YourPhone_8wekyb3d8bbwe"
// Poll for notifications, filter by app, check for call-related text
const script = `
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $listener = [Windows.UI.Notifications.Management.UserNotificationListener,
    Windows.UI.Notifications.Management, ContentType=WindowsRuntime]::Current
  $status = $listener.GetAccessStatus()
  if ($status -eq 'Allowed') {
    $notifs = $listener.GetNotificationsAsync(
      [Windows.UI.Notifications.NotificationKinds, Windows.UI.Notifications, ContentType=WindowsRuntime]::Toast
    ).GetAwaiter().GetResult()
    $phoneLink = $notifs | Where-Object { $_.AppInfo.PackageFamilyName -like '*YourPhone*' }
    $phoneLink | ForEach-Object {
      $binding = $_.Notification.Visual.GetBinding(
        [Windows.UI.Notifications.KnownNotificationBindings, Windows.UI.Notifications, ContentType=WindowsRuntime]::ToastGeneric
      )
      if ($binding) { $binding.GetTextElements() | ForEach-Object { Write-Output $_.Text } }
    }
  }
`
```

**Option B: @xan105/nodert real-time events (better UX, more complexity)**

Subscribe to `UserNotificationListener.Current.NotificationChanged` event for instant detection. Requires `--modules="windows.ui.notifications.management"` during npm install and Electron compatibility verification.

**Recommended approach:** Start with PowerShell polling (Option A) for v1 reliability. The polling approach uses the same pattern as the existing `onenote.ts` PowerShell execution, avoiding new native module dependencies.

### Anti-Patterns to Avoid

- **Separate OneNote pages per role:** The decision is ONE page per contact. Do not create separate pages per role — templates are sections within one page.
- **Rebuilding the entire page on role-add:** Use PATCH append action. Never DELETE and recreate a page when adding roles — this destroys existing notes.
- **Using `?sectionName=` URL parameter for page creation:** This creates pages in the DEFAULT notebook, not in the "Real Estate" notebook. Always use the explicit section ID endpoint: `POST /me/onenote/sections/{id}/pages`.
- **Hardcoding notebook/section IDs:** IDs are environment-specific. Always find or create dynamically, then cache.
- **Using `replace` action for adding role sections:** `replace` on `body` is not supported. Use `append` to `body` (targets first div).
- **Skipping null check on Google auth:** `getGoogleAuth().credentials?.access_token` can be empty if user hasn't signed in. Always check `isGoogleConnected()` before calling Calendar API.
- **Calendar `calendar.events.insert` vs legacy pattern:** Use `requestBody` parameter (current googleapis v4+), not `resource` (deprecated in older docs).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph API HTTP calls | Custom fetch wrapper | `@microsoft/microsoft-graph-client` | Handles auth retry, throttling, 429 backoff automatically |
| Token refresh for Graph | Manual MSAL token management | MSAL's `acquireTokenSilent` via existing `microsoftGetAccessToken()` | Already wired; handles refresh transparently |
| Google Calendar OAuth | Manual token handling | Existing `getGoogleAuth()` + `googleapis` | OAuth2 client already configured and token-refreshing |
| OData filter escaping | Custom URL building | SDK's `.filter()` method | Handles URL encoding, quote escaping |
| Notebook/section lookup | Always-fresh API calls | Cache in `electron-store` after first lookup | OneNote API rate limits and latency — cache section IDs |

**Key insight:** Both auth flows are fully built. The only new code is the Graph client wrapper and the OneNote/Calendar business logic on top of already-authenticated clients.

---

## Common Pitfalls

### Pitfall 1: Wrong Endpoint for "Real Estate" Notebook Pages

**What goes wrong:** Using `POST /me/onenote/pages?sectionName=Contacts` creates a page in the user's **default notebook**, not in "Real Estate".
**Why it happens:** The `sectionName` URL parameter only applies to the default notebook endpoint `../notes/pages`.
**How to avoid:** Always use the explicit section endpoint: `POST /me/onenote/sections/{sectionId}/pages`. Store the section ID in `electron-store` after first lookup.
**Warning signs:** Pages appear in OneNote under a different notebook than "Real Estate".

### Pitfall 2: Page Find Returns False Negative Due to Title Case

**What goes wrong:** OData `filter=title eq '+971501234567'` returns empty even though the page exists.
**Why it happens:** OData string comparisons are case-sensitive. Phone numbers stored with different formatting, or the filter value not URL-encoded.
**How to avoid:** Use `filter=title eq '${encodeURIComponent(e164)}'` and use `tolower()` if needed. Phone numbers are E.164 so case isn't an issue, but URL encoding of the `+` sign is (it becomes `%2B`).
**Warning signs:** Every call creates a new page instead of finding the existing one.

### Pitfall 3: PATCH Append to Body Corrupts Existing Content

**What goes wrong:** Appending a new role section overwrites existing role notes or leaves duplicate sections.
**Why it happens:** Using the wrong target or action combination. `action: 'replace'` on `body` is not supported and silently fails. Using `action: 'append'` without a `data-id` on the sections makes it impossible to detect if a section already exists.
**How to avoid:** Before appending, check if the page already has this role's section by reading the page's existing roles from `contact.roles` in the store — if the contact already has this role, the section is already there. Only append when `addRole()` adds a NEW role not previously on the contact.
**Warning signs:** Multiple identical qualifying tables appear on the same OneNote page.

### Pitfall 4: Phone Link App Package Name Varies

**What goes wrong:** Filtering notifications by Phone Link package family name fails because the name changed between Windows versions or devices.
**Why it happens:** Phone Link was previously called "Your Phone" (`Microsoft.YourPhone_8wekyb3d8bbwe`). Microsoft rebranded it. The package name may differ.
**How to avoid:** Filter by partial match (`-like '*YourPhone*' -or -like '*PhoneLink*'`) rather than exact match. Log unmatched notification app names during development for debugging.
**Warning signs:** Incoming calls are never detected despite Phone Link notifications appearing on-screen.

### Pitfall 5: Graph API Rate Limiting on First Run

**What goes wrong:** App makes multiple Graph API calls in rapid succession (list notebooks → find section → list pages → create page) and hits throttling.
**Why it happens:** Graph API throttles at `429 Too Many Requests`. First run hits multiple endpoints quickly.
**How to avoid:** Cache notebook ID and section ID in `electron-store` immediately after first discovery. On subsequent `onenote:open` calls, only make one API call (find page by title). Use `client.api().get()` with `select` to minimize response payload.
**Warning signs:** `429` errors in logs on first use; second calls succeed.

### Pitfall 6: Google Calendar Timezone

**What goes wrong:** Follow-up events appear at wrong time (midnight UTC instead of 9am Dubai).
**Why it happens:** `dateTime` without `timeZone` defaults to UTC.
**How to avoid:** Always include `timeZone: 'Asia/Dubai'` in the event's `start` and `end` objects.
**Warning signs:** Calendar events show at wrong hours, or agent gets reminders at 3am.

### Pitfall 7: UserNotificationListener Requires User Permission Grant

**What goes wrong:** Notification listener silently returns empty results even when Phone Link is sending notifications.
**Why it happens:** `UserNotificationListener` requires the user to grant "notification access" in Windows Settings → Privacy → Notifications. Without this, `GetAccessStatus()` returns `Denied` and `GetNotificationsAsync()` returns empty silently.
**How to avoid:** Check access status before polling. If `Denied`, show a one-time message guiding the user to Settings → Privacy & security → Notifications → Allow apps to access notifications. Surface this in the settings panel.
**Warning signs:** Phone Link detection feature enabled but no incoming call prompts appear.

---

## Code Examples

Verified patterns from official sources:

### Create a OneNote Page with HTML Content

```typescript
// Source: https://learn.microsoft.com/en-us/graph/onenote-create-page
// POST /me/onenote/sections/{id}/pages with text/html body
const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${e164}</title>
    <meta name="created" content="${new Date().toISOString()}" />
  </head>
  <body>
    <h1>${contactName || e164}</h1>
    <p><b>Phone:</b> ${displayNumber}</p>
    <p><b>Roles:</b> ${roles.join(', ')}</p>
    <h2>${ROLE_TEMPLATES[role].label}</h2>
    <table border="1">
      <tr><th>Question</th><th>Answer</th></tr>
      ${ROLE_TEMPLATES[role].questions.map(q => `<tr><td>${q}</td><td></td></tr>`).join('\n')}
    </table>
  </body>
</html>`

const page = await client
  .api(`/me/onenote/sections/${sectionId}/pages`)
  .header('Content-Type', 'text/html')
  .post(html)

// Navigate: page.links.oneNoteClientUrl.href opens OneNote desktop at this page
await shell.openExternal(page.links.oneNoteClientUrl.href)
```

### Append Role Section to Existing Page

```typescript
// Source: https://learn.microsoft.com/en-us/graph/onenote-update-page
const newRoleHTML = `
  <h2>${ROLE_TEMPLATES[newRole].label}</h2>
  <table border="1">
    <tr><th>Question</th><th>Answer</th></tr>
    ${ROLE_TEMPLATES[newRole].questions.map(q => `<tr><td>${q}</td><td></td></tr>`).join('\n')}
  </table>`

await client
  .api(`/me/onenote/pages/${pageId}/content`)
  .header('Content-Type', 'application/json')
  .patch(JSON.stringify([{ target: 'body', action: 'append', content: newRoleHTML }]))
```

### Navigate to Existing OneNote Page

```typescript
// Source: https://learn.microsoft.com/en-us/graph/onenote-get-content
// After finding the page ID via filter, fetch its links
const page = await client
  .api(`/me/onenote/pages/${pageId}`)
  .select('links')
  .get()
await shell.openExternal(page.links.oneNoteClientUrl.href)
```

### Create Google Calendar Follow-Up Event

```typescript
// Source: https://developers.google.com/workspace/calendar/api/guides/create-events
import { google } from 'googleapis'
import { getGoogleAuth } from './auth/google'

const auth = getGoogleAuth()
const calendar = google.calendar({ version: 'v3', auth })

const start = new Date()
start.setDate(start.getDate() + daysFromNow)
start.setHours(9, 0, 0, 0)

const end = new Date(start)
end.setHours(9, 30, 0, 0)

const response = await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: `Follow-up: ${contact.name || contact.displayNumber}`,
    description: `Phone: ${contact.displayNumber}\nRole: ${contact.roles.join(', ')}`,
    start: { dateTime: start.toISOString(), timeZone: 'Asia/Dubai' },
    end: { dateTime: end.toISOString(), timeZone: 'Asia/Dubai' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] }
  }
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PowerShell COM OneNote automation | Microsoft Graph API REST | Existing code uses COM; this phase switches | Graph API is cross-platform, no OneNote desktop required |
| Separate notebooks/sections per role | One page per contact, all roles on same page | Phase 2 decision | Simpler data model; all contact info in one place |
| `resource:` param in googleapis events.insert | `requestBody:` param | googleapis v4+ | Old `resource` param still works but deprecated in newer SDK |
| App-only auth for Graph OneNote | Delegated auth only | Effective March 31, 2025 | Already using delegated auth via MSAL — no impact |

**Deprecated/outdated:**
- `UserNotificationListener` foreground event had CPU loop bug in Windows builds before 17763 (October 2018 Update). All modern Windows 10/11 systems are unaffected — safe to use.
- PowerShell COM `OneNote.Application` (current onenote.ts): replaced by Graph API in this phase.

---

## Open Questions

1. **UserNotificationListener permission grant flow**
   - What we know: Windows requires user to grant notification access at `Settings → Privacy → Notifications`. The app must guide users through this.
   - What's unclear: Whether a non-UWP Electron app can request this permission programmatically, or if it can only prompt the user to go to Settings manually.
   - Recommendation: On `phoneLinkEnabled` first toggle, show a dialog explaining how to grant access. Add a "Check status" button that runs a quick PowerShell check. If denied, disable the feature gracefully.

2. **Phone Link notification text format for call detection**
   - What we know: Phone Link surfaces incoming calls as toast notifications. The notification text contains caller name/number.
   - What's unclear: Exact text format of Phone Link call notifications (e.g., "Incoming call from +971..." vs "John Smith is calling"). Format may vary by Android version and Phone Link version.
   - Recommendation: During development, log all Phone Link notification text elements. Use substring matching for "calling" and "call" keywords rather than exact format. Extract phone number from notification text using existing `normalizePhone()` utility.

3. **Graph API fetch polyfill in Electron main process**
   - What we know: `@microsoft/microsoft-graph-client` v3 requires a `fetch` implementation. Node.js 18+ has built-in fetch. Electron 34 uses Node.js 22.x (ships with Node 22 as of Electron 34).
   - What's unclear: Whether Electron's bundled Node fetch is compatible with the Graph client's requirements, or if `isomorphic-fetch` needs to be added.
   - Recommendation: Try without a polyfill first (Node 22 has stable fetch). If Graph client throws fetch-related errors, add `node-fetch` or `cross-fetch` as a dependency.

4. **Store schema extension for oneNoteSection IDs**
   - What we know: `electron-store` schema is typed via `AppSettings`. Caching `notebookId` and `sectionId` requires extending the store schema.
   - What's unclear: Whether to extend `AppSettings` type or use a separate store key pattern.
   - Recommendation: Add `oneNoteNotebookId?: string` and `oneNoteSectionId?: string` to `AppSettings` in `shared/types.ts`. The `store.get()` pattern already supports optional fields.

---

## Validation Architecture

`nyquist_validation` is not set in `.planning/config.json` — Validation Architecture section skipped.

---

## Sources

### Primary (HIGH confidence)
- [Microsoft Graph OneNote create-page docs](https://learn.microsoft.com/en-us/graph/onenote-create-page) — POST endpoint, HTML format, multipart, response shape
- [Microsoft Graph OneNote update-page docs](https://learn.microsoft.com/en-us/graph/onenote-update-page) — PATCH format, append/insert/replace actions, body target
- [Microsoft Graph OneNote get-content docs](https://learn.microsoft.com/en-us/graph/onenote-get-content) — OData filter syntax, page listing, section listing
- [Microsoft Graph create notebook API](https://learn.microsoft.com/en-us/graph/api/onenote-post-notebooks) — POST /me/onenote/notebooks, displayName field, response with id
- [Microsoft Graph create client docs](https://learn.microsoft.com/en-us/graph/sdks/create-client) — Custom auth provider pattern, Client.initWithMiddleware
- [Google Calendar create events docs](https://developers.google.com/workspace/calendar/api/guides/create-events) — events.insert(), requestBody, reminders, dateTime+timeZone fields
- [Windows Notification Listener docs](https://learn.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/notification-listener) — UserNotificationListener API, access status, GetNotificationsAsync, NotificationChanged event

### Secondary (MEDIUM confidence)
- [xan105/node-nodeRT GitHub](https://github.com/xan105/node-nodeRT) — Precompiled NodeRT, Electron support, `--modules` install flag
- `package.json` — Verified `@microsoft/microsoft-graph-client@3.0.7`, `googleapis@171.4.0`, `@azure/msal-node@5.0.5` all present
- `src/main/auth/google.ts` — Verified `getGoogleAuth()` export returns authenticated OAuth2 client
- `src/main/auth/microsoft.ts` — Verified `microsoftGetAccessToken()` export with silent refresh
- `src/main/onenote.ts` — Verified `ROLE_TEMPLATES` structure (reusable), current COM approach to replace

### Tertiary (LOW confidence)
- Phone Link package family name (`Microsoft.YourPhone_8wekyb3d8bbwe`) — from community sources, exact name needs verification on developer's machine
- PowerShell WinRT `UserNotificationListener` polling pattern — conceptually verified via Windows docs but no Node.js-specific implementation confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; Graph and Calendar APIs confirmed in official docs
- Architecture: HIGH for OneNote and Calendar patterns; LOW for Phone Link approach
- Pitfalls: MEDIUM — derived from official API docs + known WinRT permission requirements
- Phone Link detection: LOW — implementation approach unverified end-to-end in this stack

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (Graph and Calendar APIs are stable; Phone Link may need re-verification if Windows updates change notification format)
