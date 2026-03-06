# Phase 6: General Notes - Research

**Researched:** 2026-03-06
**Domain:** Electron IPC + OneNote COM API integration + React component extraction
**Confidence:** HIGH

## Summary

Phase 6 adds a freeform text area ("General Notes") to the contact card that pushes notes to the contact's OneNote page with timestamps. The entire technical surface is already well-established in the codebase: the OneNote COM API integration (PowerShell via `runPowerShell()`) works reliably, the IPC channel pattern is repeated 20+ times, and component extraction has been done before (FormEditor, NewsFeed). This is a feature build on proven foundations, not greenfield.

The primary technical challenge is building the PowerShell script that appends timestamped freeform text to an existing OneNote page (or creates a new page with role template + notes). The existing `buildAppendScript()` function appends role-based outlines and provides the exact pattern to follow. The secondary challenge is handling the "no page exists yet" flow, which requires a role selection dropdown before creating the page.

**Primary recommendation:** Build a new `buildNotesAppendScript()` function in `onenote.ts` that mirrors `buildAppendScript()` but takes freeform text + timestamp instead of role templates, a new IPC channel `onenote:push-notes`, and a new `GeneralNotes.tsx` component that mounts between Follow-up and Templates in the ContactCard.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Extract as `GeneralNotes.tsx` component -- do NOT add to the 693-line ContactCard.tsx monolith
- Compact 2-3 lines by default, expands to 5-6 lines on focus
- Placeholder text: "Quick notes..." or similar
- No local persistence -- textarea is ephemeral, OneNote is the single source of truth
- Clear textarea ONLY after OneNote push confirms success (prevent data loss)
- Explicit "Push to OneNote" button (icon + text label) adjacent to textarea
- Button shows loading state during COM API call
- If contact has no OneNote page yet: show role dropdown (Tenant/Landlord/Buyer/Seller/Investor) before pushing -- always ask, even if contact has roles assigned, so agent can override
- If page exists: append notes directly below existing content
- After push, OneNote page is navigated to (COM API `NavigateTo`) so it's ready when user switches to OneNote -- app does NOT auto-switch focus
- Inline feedback below push button (matches existing app patterns: oneNoteError, followUpStatus)
- Success: green text with "Open in OneNote" clickable link, auto-clear after 5 seconds
- Error: red text with error message, textarea content preserved, auto-clear after 5 seconds
- No toast system -- keep consistent with existing inline feedback pattern
- Human-readable date format (not ISO), e.g., "06 Mar 2026, 2:35 PM"
- No agent name in notes (single-user app, no auth)
- Each push is a separate block with visual separation from previous notes
- When no OneNote page exists, role dropdown appears before push; creates page with full role template plus scratchpad notes appended below
- Uses existing `buildOneNoteScript()` and `buildAppendScript()` patterns from onenote.ts

### Claude's Discretion
- Exact textarea position in contact card (CRM convention: below Follow-up, above Templates)
- Push button icon choice (from lucide-react, consistent with existing icon usage)
- Note format in OneNote (separator style, timestamp placement, prepend vs append order)
- Whether to add Ctrl+Enter keyboard shortcut (noted as v2 requirement NOTE-10)
- Loading spinner/indicator implementation during push

### Deferred Ideas (OUT OF SCOPE)
- CRM Consolidate button -- format/summarize notes for easy paste into CRM. New capability, belongs in its own phase
- Ctrl+Enter keyboard shortcut for push -- already tracked as v2 requirement NOTE-10
- Rich text / markdown support in textarea -- tracked as v2 requirement NOTE-11
- Note pinning -- not needed for single ephemeral textarea
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTE-05 | User can type freeform notes in a text area within the contact card | GeneralNotes.tsx component with expanding textarea, mounts in ContactCard between Follow-up and Templates |
| NOTE-06 | User can push notes to OneNote with one click (appends below existing page content) | New IPC channel `onenote:push-notes`, new `buildNotesAppendScript()` in onenote.ts using existing `runPowerShell()` + `UpdatePageContent` pattern |
| NOTE-07 | Textarea clears only after OneNote push confirms success | Async handler pattern: await IPC result, clear only on `success: true`, preserve content on error |
| NOTE-08 | Each push includes a timestamp header in OneNote for chronological log | Timestamp formatted as "06 Mar 2026, 2:35 PM" in OneNote XML outline, with horizontal rule separator |
| NOTE-09 | User sees success/error feedback after push (toast or inline indicator) | Inline feedback pattern (matches followUpStatus): `{ type: 'success' | 'error'; message: string }` with 5-second auto-clear |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.0.0 | UI component (GeneralNotes.tsx) | Already in use, all renderer components are React |
| Electron IPC | ^34.0.0 | Main-renderer communication for push-notes channel | ipcMain.handle + ipcRenderer.invoke pattern used throughout |
| PowerShell COM API | N/A (Windows built-in) | OneNote page manipulation via COM interop | Established pattern in onenote.ts, no alternative for local OneNote |
| lucide-react | ^0.576.0 | Push button icon | Already in use for all icons in the app |
| Tailwind CSS | ^4.0.0 | Styling | Already in use, all components use Tailwind utility classes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| electron-store | ^9.0.0 | Contact data persistence (oneNotePageId) | Already stores contact.oneNotePageId, used to detect if page exists |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| COM API | Microsoft Graph API | Graph requires OAuth login, COM works locally without auth -- project decided COM in v1.0 |
| Inline feedback | Toast library | No toast system in app, inline feedback is the established pattern |

## Architecture Patterns

### Recommended Project Structure
```
src/
  main/
    onenote.ts            # Add buildNotesAppendScript() + pushNotesToOneNote() export
    ipc.ts                # Add onenote:push-notes handler
  preload/
    index.ts              # Add pushNotesToOneNote() bridge
  renderer/
    panel/
      components/
        GeneralNotes.tsx   # NEW -- extracted component
        ContactCard.tsx    # Mount GeneralNotes between Follow-up and Templates
  shared/
    types.ts              # Add PushNotesResult type (optional, can reuse existing pattern)
```

### Pattern 1: IPC Channel Registration
**What:** Standard invoke/handle pattern for async main process operations
**When to use:** Any renderer-to-main communication that returns a result
**Example:**
```typescript
// main/ipc.ts
ipcMain.handle('onenote:push-notes', async (_event, data: {
  e164: string;
  name: string;
  displayNumber: string;
  notes: string;
  role?: ContactRole;          // Only when creating new page
  unit?: string;
  email?: string;
}) => {
  return await pushNotesToOneNote(data)
})

// preload/index.ts
pushNotesToOneNote: (data: { e164: string; name: string; displayNumber: string; notes: string; role?: ContactRole; unit?: string; email?: string }) =>
  ipcRenderer.invoke('onenote:push-notes', data) as Promise<{ success: boolean; error?: string; pageId?: string; created?: boolean }>

// renderer -- GeneralNotes.tsx
const result = await window.electronAPI.pushNotesToOneNote({ ... })
if (result.success) {
  setNotes('')  // Clear only on success
  setFeedback({ type: 'success', message: 'Notes pushed to OneNote' })
}
```

### Pattern 2: Inline Feedback with Auto-Clear
**What:** Status message below action button that auto-dismisses after timeout
**When to use:** Any user action that needs success/error feedback
**Example (from existing ContactCard.tsx):**
```typescript
// State
const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

// After action
setFeedback({ type: 'success', message: 'Notes pushed to OneNote' })
setTimeout(() => setFeedback(null), 5000)

// Render
{feedback && (
  <p className={`text-xs ${feedback.type === 'success' ? 'text-[#4ade80]' : 'text-red-400'}`}>
    {feedback.message}
  </p>
)}
```

### Pattern 3: Component Extraction from ContactCard
**What:** Self-contained component that receives props from ContactCard and handles its own state
**When to use:** When a section of ContactCard has its own state and logic (like NewsFeed, FormEditor)
**Example:**
```typescript
// GeneralNotes.tsx
interface GeneralNotesProps {
  e164: string
  displayNumber: string
  contactName: string
  contactEmail: string
  contactUnit: string
  contactRoles: ContactRole[]
  oneNotePageId?: string  // From stored contact data
}

export default function GeneralNotes({ e164, displayNumber, contactName, contactEmail, contactUnit, contactRoles, oneNotePageId }: GeneralNotesProps) {
  const [notes, setNotes] = useState('')
  const [pushing, setPushing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const [selectedRole, setSelectedRole] = useState<ContactRole | null>(null)
  // ...
}
```

### Pattern 4: OneNote XML Outline Append
**What:** PowerShell script that appends a new `<one:Outline>` to an existing page via `UpdatePageContent`
**When to use:** Adding content to an existing OneNote page
**Example (from existing buildAppendScript):**
```powershell
$onenote = New-Object -ComObject OneNote.Application
$xml = ''
$onenote.GetHierarchy('', 0, [ref]$xml)
$doc = [xml]$xml
$ns = $doc.DocumentElement.NamespaceURI

$outlines = ''
# Build outline XML here
$contentXml = '<one:Page xmlns:one="' + $ns + '" ID="' + $pageId + '">'
$contentXml += $outlines
$contentXml += '</one:Page>'
$onenote.UpdatePageContent($contentXml)
$onenote.NavigateTo($pageId)
```

### Anti-Patterns to Avoid
- **Adding to ContactCard.tsx directly:** The file is already 693 lines. Extract GeneralNotes as a separate component.
- **Auto-saving notes locally:** No local persistence. The textarea is ephemeral, OneNote is the single source of truth.
- **Using Graph API:** COM API is the established pattern, no auth required, works offline.
- **Custom toast system:** Use inline feedback pattern consistent with existing oneNoteError and followUpStatus.
- **Auto-clearing on any event:** Textarea clears ONLY after confirmed push success. Never on blur, navigation, or other events.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OneNote page manipulation | Custom COM API wrapper | Existing `runPowerShell()` + `buildAppendScript()` pattern | Battle-tested error handling, temp file cleanup, timeout management |
| Contact data lookup | Direct electron-store access from renderer | Existing `getContact()` IPC channel | Already returns `oneNotePageId`, maintains data layer separation |
| Date formatting | Custom date formatter | `Date.toLocaleDateString('en-GB', opts)` + `toLocaleTimeString` | Built-in, locale-aware, matches "06 Mar 2026, 2:35 PM" format |
| XML escaping for PowerShell | Manual string escaping | Existing `psEscape()` function in onenote.ts | Handles single-quote escaping for PowerShell CDATA blocks |
| Page existence check | New COM API call to check | Stored `oneNotePageId` on Contact object | Already tracked per contact in electron-store, no round-trip needed |

**Key insight:** Almost every building block already exists. The new code is primarily glue: a new PowerShell script template, one IPC handler, one preload bridge, and one React component.

## Common Pitfalls

### Pitfall 1: PowerShell CDATA Injection
**What goes wrong:** User types notes containing `]]>` which breaks CDATA sections in OneNote XML
**Why it happens:** CDATA cannot contain the literal string `]]>` -- it terminates the section
**How to avoid:** Split the CDATA at any `]]>` boundary: replace `]]>` with `]]]]><![CDATA[>` in the notes text before embedding in the PowerShell script. Also apply `psEscape()` for PowerShell single-quote safety.
**Warning signs:** Notes with code snippets or XML-like content fail to push

### Pitfall 2: Race Condition on Clear
**What goes wrong:** User types more notes while push is in progress, then the textarea clears (losing new input)
**Why it happens:** Async push takes 2-5 seconds; user may keep typing during this time
**How to avoid:** Capture the notes value at push time, compare on completion. Or simpler: disable the textarea during push (loading state already planned).
**Warning signs:** User reports losing notes they typed while push was loading

### Pitfall 3: OneNote Not Running / COM Registration Missing
**What goes wrong:** COM API call fails with CLSID error 80040154
**Why it happens:** User has UWP OneNote (Windows Store version) instead of desktop OneNote, or OneNote is not installed
**How to avoid:** Already handled in `openContactPage()` -- catch the CLSID error and return a user-friendly message. Replicate the same error handling in the new push function.
**Warning signs:** Error message contains "80040154" or "CLSID" or "not registered"

### Pitfall 4: Stale oneNotePageId
**What goes wrong:** Contact has a stored `oneNotePageId` but the page was deleted in OneNote
**Why it happens:** User manually deleted the page in OneNote; stored ID is now stale
**How to avoid:** Catch `UpdatePageContent` errors (0x80042014 = object does not exist). On this error, clear the stored pageId and fall back to the "create new page" flow. Or show error with option to create new page.
**Warning signs:** Push fails with cryptic COM error on a contact that previously worked

### Pitfall 5: Textarea Height Transition
**What goes wrong:** Textarea expands/collapses jerkily or doesn't resize properly
**Why it happens:** CSS transitions on height require explicit values, not `auto`
**How to avoid:** Use `rows` attribute (rows=2 default, rows=5 on focus) instead of CSS height. Or use `min-h-[3rem]` / `min-h-[7rem]` with transition-all.
**Warning signs:** Layout jumps when textarea gains/loses focus

### Pitfall 6: Contact Has No Roles and No PageId
**What goes wrong:** Role dropdown shows but agent doesn't know which role to pick
**Why it happens:** Contact was created from clipboard detection without role assignment
**How to avoid:** Pre-select the first role in the dropdown (Tenant as default, since it's the most common). Context decision says "always ask, even if contact has roles" -- so always show the dropdown for new page creation.
**Warning signs:** User confusion about which role to pick

## Code Examples

### New PowerShell Script: Append Timestamped Notes
```typescript
// Source: Pattern derived from existing buildAppendScript() in onenote.ts
function buildNotesAppendScript(pageId: string, notes: string, timestamp: string): string {
  // Escape notes for CDATA safety
  const safeNotes = psEscape(notes.replace(/]]>/g, ']]]]><![CDATA[>'))
  const safeTimestamp = psEscape(timestamp)

  return `
  $onenote = New-Object -ComObject OneNote.Application

  $xml = ''
  $onenote.GetHierarchy('', 0, [ref]$xml)
  $doc = [xml]$xml
  $ns = $doc.DocumentElement.NamespaceURI

  $outlines = ''
  $outlines += '<one:Outline><one:OEChildren>'
  $outlines += '<one:OE><one:T><![CDATA[_______________________________________________]]></one:T></one:OE>'
  $outlines += '<one:OE><one:T><![CDATA[${safeTimestamp}]]></one:T></one:OE>'
  $outlines += '<one:OE><one:T><![CDATA[${safeNotes}]]></one:T></one:OE>'
  $outlines += '</one:OEChildren></one:Outline>'

  $contentXml = '<one:Page xmlns:one="' + $ns + '" ID="' + '${psEscape(pageId)}' + '">'
  $contentXml += $outlines
  $contentXml += '</one:Page>'
  $onenote.UpdatePageContent($contentXml)
  $onenote.NavigateTo('${psEscape(pageId)}')
  Write-Output 'ok'
`
}
```

### Multiline Notes in OneNote XML
```typescript
// Notes with newlines need to be split into separate OE elements
// Each line becomes its own <one:OE> element in the outline
function buildNoteLines(notes: string): string {
  return notes.split('\n').map(line => {
    const safeLine = psEscape(line.replace(/]]>/g, ']]]]><![CDATA[>'))
    return `$outlines += '<one:OE><one:T><![CDATA[${safeLine}]]></one:T></one:OE>'`
  }).join('\n  ')
}
```

### GeneralNotes Component Structure
```typescript
// Source: Pattern follows existing ContactCard sections
import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { ContactRole } from '../../../shared/types'

const ALL_ROLES: ContactRole[] = ['Tenant', 'Landlord', 'Buyer', 'Seller', 'Investor']

interface GeneralNotesProps {
  e164: string
  displayNumber: string
  contactName: string
  contactEmail: string
  contactUnit: string
  contactRoles: ContactRole[]
  oneNotePageId?: string
}

export default function GeneralNotes({
  e164, displayNumber, contactName, contactEmail, contactUnit,
  contactRoles, oneNotePageId
}: GeneralNotesProps) {
  const [notes, setNotes] = useState('')
  const [pushing, setPushing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedRole, setSelectedRole] = useState<ContactRole>(contactRoles[0] || 'Tenant')
  const [focused, setFocused] = useState(false)

  const handlePush = async () => {
    if (!notes.trim() || pushing) return
    setPushing(true)
    setFeedback(null)

    const result = await window.electronAPI.pushNotesToOneNote({
      e164, name: contactName, displayNumber,
      notes: notes.trim(),
      role: oneNotePageId ? undefined : selectedRole,
      unit: contactUnit, email: contactEmail
    })

    setPushing(false)
    if (result.success) {
      setNotes('')
      setFeedback({ type: 'success', message: 'Notes pushed to OneNote' })
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to push notes' })
    }
    setTimeout(() => setFeedback(null), 5000)
  }

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-[13px] text-[#a1a1aa] font-medium">General Notes</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Quick notes..."
        rows={focused ? 5 : 2}
        disabled={pushing}
        className="w-full px-3 py-2 text-sm bg-white/[0.06] text-[#ededee] placeholder-[#5a5a60] border border-white/[0.1] rounded-md resize-none transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent disabled:opacity-50"
      />
      {/* Role selector -- only when no page exists */}
      {!oneNotePageId && (
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as ContactRole)}
          className="w-full px-3 py-1.5 text-sm bg-[#1f1f21] text-[#ededee] border border-white/[0.1] rounded-md"
        >
          {ALL_ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      )}
      <button
        onClick={handlePush}
        disabled={!notes.trim() || pushing}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-sm font-medium text-[#c084fc] bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.25)] rounded-md hover:bg-[rgba(168,85,247,0.2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pushing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={1.5} />}
        <span>{pushing ? 'Pushing...' : 'Push to OneNote'}</span>
      </button>
      {feedback && (
        <p className={`text-xs ${feedback.type === 'success' ? 'text-[#4ade80]' : 'text-red-400'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
```

### Timestamp Formatting
```typescript
// Source: Built-in JavaScript Intl API
function formatNoteTimestamp(): string {
  const now = new Date()
  const date = now.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })
  return `${date}, ${time}`  // "06 Mar 2026, 2:35 PM"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OneNote Graph API | COM API via PowerShell | v1.0 design decision | No auth needed, works offline, single-user only |
| XML DOM parsing in PS | String concatenation | v1.0 bugfix | Avoids 0x80042014 encoding errors from `[xml]` casting |
| Monolithic ContactCard | Extracted components | v1.0 (FormEditor, NewsFeed) | GeneralNotes follows this established pattern |

**Deprecated/outdated:**
- Nothing deprecated in this domain. All patterns are current and working.

## Open Questions

1. **Multiline notes in OneNote XML**
   - What we know: Each `<one:OE>` element is a separate line in OneNote. A single `<one:T>` with newlines may or may not render as multiline.
   - What's unclear: Whether OneNote COM API preserves `\n` within a single CDATA block or requires split OE elements.
   - Recommendation: Split notes by newline into separate `<one:OE>` elements for reliability. This is the pattern used by `buildRolePsOutlines()` already.

2. **Prepend vs Append order for notes**
   - What we know: `UpdatePageContent` with new outlines appends them to the bottom of the page. Template content is at the top.
   - What's unclear: Whether agents prefer newest-first (prepend) or chronological (append) order.
   - Recommendation: Append (oldest first, chronological) -- matches natural reading order and keeps template content at the top. New notes appear at the bottom, which is where the cursor naturally goes in OneNote.

3. **oneNotePageId freshness after page creation**
   - What we know: When a new page is created, `openContactPage()` stores the pageId via `upsertContact()`.
   - What's unclear: Whether `pushNotesToOneNote()` should also store the pageId after creating a page.
   - Recommendation: Yes -- after creating a page via push, store the pageId on the contact so subsequent pushes go directly to append mode without the role selector.

## Sources

### Primary (HIGH confidence)
- `src/main/onenote.ts` -- existing COM API integration, `buildAppendScript()`, `runPowerShell()`, `psEscape()` patterns
- `src/main/ipc.ts` -- all 30+ IPC handler patterns, `ipcMain.handle` convention
- `src/preload/index.ts` -- all preload bridge patterns with TypeScript return types
- `src/renderer/panel/components/ContactCard.tsx` -- 693-line component, layout order, inline feedback pattern
- `src/renderer/panel/App.tsx` -- ContactCard props passing, state management, component mounting
- `src/shared/types.ts` -- Contact interface with `oneNotePageId` field, ContactRole type
- `src/main/contacts.ts` -- `upsertContact()` for storing pageId after creation
- `src/main/store.ts` -- electron-store schema, DEFAULT_ROLE_TEMPLATES

### Secondary (MEDIUM confidence)
- OneNote COM API `UpdatePageContent` behavior -- based on working code in production (v1.0), not official Microsoft docs

### Tertiary (LOW confidence)
- CDATA `]]>` injection edge case -- known XML limitation, prevention strategy is standard but untested in this codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies needed
- Architecture: HIGH -- follows exact patterns from 4 prior phases of this project
- Pitfalls: HIGH -- most pitfalls are derived from existing onenote.ts error handling patterns
- OneNote XML multiline: MEDIUM -- needs validation during implementation

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- no external API changes expected, all internal patterns)
