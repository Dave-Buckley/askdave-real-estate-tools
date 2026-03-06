# Architecture Patterns — v1.1 Integration

**Domain:** General Notes + Form I template fixes in existing Electron desktop app
**Researched:** 2026-03-06
**Confidence:** HIGH (all integration points verified against source code)

## Current Architecture Summary

The app follows Electron's standard three-process model:

```
Main Process (Node.js)
  |-- ipc.ts         (IPC handler registry)
  |-- onenote.ts     (OneNote COM via PowerShell scripts)
  |-- contacts.ts    (CRUD on electron-store contacts map)
  |-- store.ts       (electron-store with typed AppSettings)
  |
Preload (index.ts)
  |-- contextBridge   (exposes electronAPI to renderer)
  |
Renderer (React)
  |-- App.tsx          (view router, state management, ContactCard host)
  |-- ContactCard.tsx  (693 lines, 10 expandable sections)
  |-- FormEditor.tsx   (form override editor)
```

### Key Data Flow Patterns

1. **Contact state** lives in App.tsx (`contactName`, `contactEmail`, `contactUnit`, `contactRoles`), passed down to ContactCard as props
2. **OneNote integration** uses PowerShell COM automation -- `buildOneNoteScript()` creates pages, `buildAppendScript()` appends role outlines to existing pages
3. **Forms** are statically defined in `shared/forms.ts` as a `FORMS: FormEntry[]` array. Users override templates via `formOverrides` in electron-store
4. **IPC pattern**: renderer calls `window.electronAPI.method()` -> preload bridge -> `ipcMain.handle('channel')` -> main process function -> returns result

## Feature 1: General Notes

### What Exists Today

The `Contact` type already has a `notes: string` field (types.ts:124), and `contacts.ts:29` persists it via `upsertContact()`. However, **no UI renders or writes to this field** -- it was scaffolded but never used in v1.0.

The OneNote module has `buildAppendScript()` which appends `<one:Outline>` XML blocks to an existing page by page ID. The contact's `oneNotePageId` is stored in electron-store when a page is first created.

### Integration Design

**New UI component location:** Inside ContactCard.tsx, as a new section between the "Action buttons" block (section 3) and the "Schedule" block (section 4). This positioning puts it where the agent naturally operates -- after they've identified the contact, before they schedule follow-ups.

```
ContactCard.tsx sections (current):
  1. Phone number
  2. Name/Email/Unit inputs
  3. Action buttons (Dial, WhatsApp, Notes, Gmail)
  -- NEW: General Notes textarea + Push to OneNote button --
  4. Schedule (Viewing, Consultation)
  5. Follow-up reminder
  6. WhatsApp Templates
  7. Gmail Templates
  8. OneNote Templates
  9. Forms
  9b. KYC Forms
  10. News feed
```

### Component Boundaries

| Component | Change Type | What Changes |
|-----------|-------------|--------------|
| `ContactCard.tsx` | MODIFY | Add General Notes section: `<textarea>` + "Push to OneNote" button + status feedback |
| `App.tsx` | MODIFY | Add `generalNotes` state, pass to ContactCard, handle clear-on-push |
| `onenote.ts` | MODIFY | Add `appendFreeformNote()` function using existing `buildAppendScript()` pattern |
| `ipc.ts` | MODIFY | Add `onenote:append-note` handler |
| `preload/index.ts` | MODIFY | Expose `appendNoteToOneNote()` bridge function |
| `shared/types.ts` | NO CHANGE | `Contact.notes` field already exists |
| `contacts.ts` | NO CHANGE | `upsertContact()` already persists `notes` field |

### Data Flow: Push Notes to OneNote

```
User types in General Notes textarea
  |
  v
[ContactCard] "Push to OneNote" button clicked
  |
  v
window.electronAPI.appendNoteToOneNote(e164, noteText)
  |
  v (preload bridge)
ipcMain.handle('onenote:append-note')
  |
  v
onenote.ts: appendFreeformNote(e164, noteText)
  |-- Look up contact's oneNotePageId from store
  |-- If no pageId: create page first (existing openContactPage flow)
  |-- Build PowerShell script: append <one:Outline> with note text + timestamp
  |-- runPowerShell(script)
  |
  v (on success)
Return { success: true } to renderer
  |
  v
ContactCard clears the textarea
App.tsx optionally persists notes to contact.notes via upsertContact
```

### New Main Process Function: appendFreeformNote

This follows the exact pattern of `buildAppendScript()` in onenote.ts. The key difference: instead of appending structured role outlines, it appends a single outline with timestamped free-text.

```typescript
// In onenote.ts — new export
export async function appendFreeformNote(
  e164: string,
  noteText: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Get contact's pageId from store
  const contact = store.get('contacts')[e164]
  const pageId = contact?.oneNotePageId

  if (!pageId) {
    return { success: false, error: 'No OneNote page found. Open notes first.' }
  }

  // 2. Build PowerShell append script (same pattern as buildAppendScript)
  const timestamp = new Date().toLocaleString()
  const escapedNote = psEscape(noteText)
  const script = `
    $onenote = New-Object -ComObject OneNote.Application
    $xml = ''
    $onenote.GetHierarchy('', 0, [ref]$xml)
    $doc = [xml]$xml
    $ns = $doc.DocumentElement.NamespaceURI

    $outlines = ''
    $outlines += '<one:Outline><one:OEChildren>'
    $outlines += '<one:OE><one:T><![CDATA[--- Note (${psEscape(timestamp)}) ---]]></one:T></one:OE>'
    $outlines += '<one:OE><one:T><![CDATA[${escapedNote}]]></one:T></one:OE>'
    $outlines += '</one:OEChildren></one:Outline>'

    $contentXml = '<one:Page xmlns:one="' + $ns + '" ID="${psEscape(pageId)}">'
    $contentXml += $outlines
    $contentXml += '</one:Page>'
    $onenote.UpdatePageContent($contentXml)
    Write-Output 'ok'
  `

  // 3. Execute
  await runPowerShell(script)
  return { success: true }
}
```

### UI in ContactCard

The General Notes section should:

- **Expand/collapse** like all other sections (chevron toggle pattern used throughout ContactCard)
- **Show only when OneNote is enabled** (`oneNoteEnabled` prop, same gate as the Notes button)
- **Textarea** with placeholder "Type notes to push to OneNote..."
- **Button row:** "Push to OneNote" (primary action) -- clears on success, shows brief status
- **No local persistence needed** -- the textarea is a staging area, not a notepad. Notes go to OneNote then clear. The `Contact.notes` field in store could optionally cache the last note for recovery, but the primary storage is OneNote.

### Props Changes to ContactCard

```typescript
// New props (added to ContactCardProps interface):
generalNotes: string
onGeneralNotesChange: (notes: string) => void
onPushNotes: () => Promise<void>  // returns when push completes
```

### State in App.tsx

```typescript
const [generalNotes, setGeneralNotes] = useState('')
const [notesPushing, setNotesPushing] = useState(false)

const handlePushNotes = useCallback(async () => {
  if (!activeContact || !generalNotes.trim()) return
  setNotesPushing(true)
  const result = await window.electronAPI.appendNoteToOneNote(activeContact.e164, generalNotes)
  setNotesPushing(false)
  if (result.success) {
    setGeneralNotes('')  // clear on success
  }
}, [activeContact, generalNotes])
```

## Feature 2: Form I Template Fixes

### What Exists Today

All four Form I entries are in `shared/forms.ts` as static entries in the `FORMS` array:

| ID | Name | Line | Category |
|----|------|------|----------|
| `form-i-seller` | Form I -- Sales (Seller) | 74-84 | sales |
| `form-i-buyer` | Form I -- Sales (Buyer) | 86-96 | sales, offplan |
| `form-i-landlord` | Form I -- Leasing (Landlord) | 184-195 | rentals |
| `form-i-tenant` | Form I -- Leasing (Tenant) | 197-207 | rentals |

Currently all four templates are written as **client-facing messages** ("Hi {name}, please find attached Form I..."). The requirement is to rewrite them as **agent-to-agent commission split language** because Form I is the commission disclosure form exchanged between cooperating agents, not sent to clients.

### Integration Design

**This is a pure data change** -- no component, IPC, or architecture changes needed.

Modify: `src/shared/forms.ts` -- rewrite `whatsappMessage`, `emailSubject`, and `emailBody` for all four Form I entries (IDs: `form-i-seller`, `form-i-buyer`, `form-i-landlord`, `form-i-tenant`).

### What Changes Per Entry (3 fields x 4 entries = 12 string edits)

For each of the 4 Form I entries:
- **whatsappMessage**: Change from "Hi {name}, please find attached Form I..." to agent-to-agent language about commission split agreement
- **emailSubject**: Change from "Form I -- Commission Disclosure ({Role})" to reflect agent-to-agent commission split
- **emailBody**: Change from "Dear {name}..." client letter to professional agent-to-agent commission agreement language

### Important: Override Interaction

Users who have previously customized Form I templates via the FormEditor will have overrides stored in `formOverrides` in electron-store. These overrides **take precedence** over the defaults in `shared/forms.ts` (see ContactCard.tsx:191-192):

```typescript
const override = formOverrides[form.id]
const message = fillPlaceholders(override?.whatsappMessage ?? form.whatsappMessage)
```

This means:
- The code change to `forms.ts` updates the **defaults** that new users and users without overrides will see
- Existing users who already customized Form I will continue seeing their customized versions
- The "Reset" button in FormEditor resets to defaults -- after this change, "Reset" will restore the new agent-to-agent language

**No migration needed.** The override system handles this gracefully.

### Placeholder Usage in Form I

The `{name}` placeholder in agent-to-agent context refers to the cooperating agent's name (the contact currently loaded in the card). The `{unit}` placeholder still refers to the property. This is a natural fit -- when an agent loads another agent's contact, `{name}` is that agent.

## Feature 3: Landing Page Updates

### What Exists

The landing page consists of 4 static HTML files:
- `landing/index.html` -- Main marketing page
- `landing/AskDave-Overview.html` -- Product overview (print-friendly A4 layout)
- `landing/AskDave-How-It-Works.html` -- How it works guide
- `landing/AskDave-Setup-Guide.html` -- Setup instructions

### Integration Design

**Modify:**
- `landing/index.html` -- Add "General Notes" to the feature list, update Form I description
- `landing/AskDave-Overview.html` -- Same updates for the overview document

**No structural changes.** These are text content updates in existing HTML sections.

## Component Dependencies

```
Feature 1 (General Notes) dependency chain:
  shared/types.ts       (NO CHANGE - Contact.notes exists)
  main/contacts.ts      (NO CHANGE - notes persistence exists)
  main/onenote.ts       (ADD appendFreeformNote function)
  main/ipc.ts           (ADD onenote:append-note handler)
  preload/index.ts      (ADD appendNoteToOneNote bridge)
  renderer/App.tsx      (ADD generalNotes state + handler)
  renderer/ContactCard  (ADD General Notes section UI)

Feature 2 (Form I) dependency chain:
  shared/forms.ts       (EDIT 4 entries, 12 string fields)
  (nothing else)

Feature 3 (Landing page) dependency chain:
  landing/index.html    (EDIT text content)
  landing/AskDave-Overview.html  (EDIT text content)
  (nothing else)
```

## Patterns to Follow

### Pattern 1: Expandable Section in ContactCard

Every section in ContactCard follows this pattern. General Notes must use the same pattern for UI consistency.

```tsx
const [notesExpanded, setNotesExpanded] = useState(false)

{oneNoteEnabled && (
  <div className="bg-[#1f1f21] border border-white/[0.07] rounded-lg p-3">
    <button onClick={() => setNotesExpanded(!notesExpanded)} className="flex items-center gap-1.5">
      {notesExpanded ? <ChevronDown .../> : <ChevronRight .../>}
      <StickyNote size={14} strokeWidth={1.5} className="text-[#a1a1aa]" />
      <h3 className="text-sm font-semibold text-[#ededee]">General Notes</h3>
    </button>
    {notesExpanded && (
      // textarea + push button
    )}
  </div>
)}
```

### Pattern 2: IPC Handler Registration

Follow the existing pattern in ipc.ts -- `ipcMain.handle()` with a namespaced channel.

```typescript
ipcMain.handle('onenote:append-note', async (_event, e164: string, noteText: string) => {
  return await appendFreeformNote(e164, noteText)
})
```

### Pattern 3: Status Feedback

ContactCard uses `useState` for status messages that auto-dismiss with `setTimeout`. Follow the `oneNoteError` pattern (lines 121, 218-221, 405).

```tsx
const [notesStatus, setNotesStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

// After push:
setNotesStatus({ type: 'success', message: 'Pushed to OneNote' })
setTimeout(() => setNotesStatus(null), 3000)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate View for General Notes

**What:** Creating a new `View` type and rendering General Notes as a full-screen editor (like TemplateEditor or FormEditor).

**Why bad:** General Notes is a quick-fire tool. The agent types a few lines and pushes. It should be inline in the ContactCard, not a navigation context switch. The existing section pattern (expand/collapse) is the right UX.

### Anti-Pattern 2: Auto-Saving Notes Locally

**What:** Persisting every keystroke to `Contact.notes` in electron-store.

**Why bad:** The textarea is a staging area, not persistent storage. The workflow is: type -> push to OneNote -> clear. Saving locally creates ambiguity about what's been pushed and what hasn't. If local persistence is wanted for crash recovery, save only on blur, not on every change.

### Anti-Pattern 3: Creating a New OneNote Page for Notes

**What:** Always creating a new page or section for general notes.

**Why bad:** Notes should append to the contact's existing OneNote page (identified by `oneNotePageId`). Creating separate pages fragments the contact's information. If no page exists yet, prompt the user to open OneNote for the contact first, or auto-create the page.

### Anti-Pattern 4: Touching FormEditor for Form I Changes

**What:** Modifying FormEditor.tsx or the override system to fix Form I templates.

**Why bad:** The Form I templates are wrong at the source (`shared/forms.ts`). Fix the defaults, not the override system. The override system correctly lets users customize on top of correct defaults.

## Suggested Build Order

Build order considers dependency chains and independent parallelism:

### Phase 1: Form I Templates (independent, no deps)

1. Edit `shared/forms.ts` -- rewrite all 4 Form I entries (12 fields)
2. Manual verification: run dev, check Forms section for each Form I entry

**Rationale:** Zero risk, zero architecture changes, can be done and tested immediately. Unblocks landing page updates.

### Phase 2: General Notes (sequential dependency chain)

1. `main/onenote.ts` -- add `appendFreeformNote()` export
2. `main/ipc.ts` -- add `onenote:append-note` handler
3. `preload/index.ts` -- expose `appendNoteToOneNote` bridge
4. `renderer/App.tsx` -- add `generalNotes` state + `handlePushNotes` callback
5. `renderer/ContactCard.tsx` -- add General Notes expandable section between actions and schedule
6. End-to-end test: type note, push, verify in OneNote

**Rationale:** Each step depends on the previous. The main process function must exist before the IPC handler, the IPC handler before the preload bridge, the bridge before the renderer can call it.

### Phase 3: Landing Page (independent after features complete)

1. `landing/index.html` -- add General Notes feature, update Form I description
2. `landing/AskDave-Overview.html` -- same updates

**Rationale:** Should reflect final shipped features. Do after Phase 1 and 2 are verified.

## Edge Cases to Handle

| Edge Case | How to Handle |
|-----------|---------------|
| No OneNote page exists for contact | Show error: "Open notes for this contact first" or auto-create page |
| OneNote desktop app not installed | Existing COM error handling catches 80040154 and shows install message |
| Empty textarea when push clicked | Disable push button when `generalNotes.trim() === ''` |
| Very long note text | OneNote handles large CDATA sections fine; no truncation needed |
| Contact has no phone number (email-only) | General Notes section should work for email-only contacts too -- but OneNote pages are keyed on E.164. Need to handle: either require phone number for notes, or key page by email |
| Multiline notes | PowerShell CDATA handles newlines. Split into multiple `<one:OE>` elements per line for proper OneNote rendering |
| User overrode Form I, then hits Reset | Reset restores new agent-to-agent defaults. Correct behavior. |

## Sources

- All findings verified by direct source code inspection of the repository
- OneNote COM API behavior verified from existing working implementation in `onenote.ts`
- Electron IPC patterns verified from existing `ipc.ts` and `preload/index.ts`
- No external research needed -- this is purely an integration architecture document
