# Pitfalls Research

**Domain:** Adding General Notes + Form I template rewrites to existing Electron desktop app (v1.1)
**Researched:** 2026-03-06
**Confidence:** HIGH (based on direct codebase analysis of onenote.ts, forms.ts, ContactCard.tsx, ipc.ts, store.ts, types.ts, preload/index.ts)

---

## Critical Pitfalls

### Pitfall 1: Milestone context says "Graph API PATCH" but the codebase uses COM API via PowerShell

**What goes wrong:**
The milestone context describes "OneNote pages already have role template content appended via Graph API PATCH." This is incorrect. The actual implementation in `src/main/onenote.ts` uses the OneNote COM API via PowerShell (`New-Object -ComObject OneNote.Application`) with `UpdatePageContent()`. If the General Notes feature is built targeting the Microsoft Graph API, it would require an entirely different code path: OAuth/MSAL authentication, internet connectivity, and HTML content format -- none of which exist in the current app. The app has zero authentication flows; OneNote integration piggybacks on the locally signed-in OneNote desktop application.

**Why it happens:**
Milestone planning was written without re-reading the implementation. COM API and Graph API are two completely different integration surfaces with different content formats (COM uses OneNote XML Schema with `<one:Page>` elements and CDATA; Graph API uses HTML).

**How to avoid:**
Build the General Notes push-to-OneNote feature using the same COM API pattern already in `onenote.ts`. The append operation should use `UpdatePageContent()` with a `<one:Page>` wrapper containing new `<one:Outline>` elements, exactly like `buildAppendScript()` already does for adding role sections to existing pages. Reuse `runPowerShell()` for execution. Do NOT introduce Graph API, OAuth, or any new authentication mechanism.

**Warning signs:**
- Any code that imports `@microsoft/microsoft-graph-client` or references `https://graph.microsoft.com`
- Any OAuth/MSAL authentication flow being added
- Any HTML content being sent to OneNote (COM API uses XML, not HTML)
- Any new npm dependencies related to Microsoft identity

**Phase to address:**
Phase 1 (General Notes implementation) -- use existing COM API pattern from day one

---

### Pitfall 2: ContactCard.tsx is already 693 lines -- adding General Notes inline creates an unmaintainable monolith

**What goes wrong:**
ContactCard.tsx currently has 10+ expandable sections (phone input, name/email/unit, action buttons, schedule, follow-up, WhatsApp templates, Gmail templates, OneNote templates, Forms, KYC, News) with 15+ `useState` hooks and 12+ handler functions. Adding a General Notes section with textarea state, push-to-OneNote handler, loading/disabled state, success/error feedback, and clear-after-push logic directly in this file pushes it past 800 lines. Every future modification becomes risky because unrelated sections share the same component scope.

**Why it happens:**
"Just add one more section" feels trivial when the collapsible-section pattern is already established. Each section is small individually, but the cumulative state management and handler count makes the component fragile and hard to reason about.

**How to avoid:**
Extract the General Notes section into its own component (`GeneralNotes.tsx` or `NotesSection.tsx`). It should accept `e164`, `contactName`, `oneNotePageId`, and a callback for pushing to OneNote as props, and manage its own textarea state, push handler, loading/success/error states internally. The parent ContactCard only renders `<GeneralNotes ... />` in the correct position. This is the same pattern the codebase already uses with `<NewsFeed />` (rendered at line 684 of ContactCard.tsx).

**Warning signs:**
- ContactCard.tsx growing past 750 lines
- More than 3 new `useState` hooks added to the ContactCard component body
- New IPC handler logic mixed into ContactCard's existing handlers
- Textarea `onChange` causing re-renders of the entire 10-section card

**Phase to address:**
Phase 1 (General Notes) -- extract as separate component from the start

---

### Pitfall 3: General Notes text clearing before push confirms, or not clearing after success

**What goes wrong:**
The spec says "clears after push." Two failure modes exist: (1) clearing the textarea before the COM API call succeeds, causing permanent data loss if the push fails, or (2) forgetting to clear after success, so the user pushes the same note twice. Both destroy user trust in the tool.

**Why it happens:**
Optimistic clearing (clear immediately, hope it works) is tempting for responsiveness. But the COM API call via PowerShell takes 2-5 seconds minimum (creating COM object, hierarchy lookup, UpdatePageContent). The existing `runPowerShell()` has a 30-second timeout. If the call fails (OneNote not installed, COM registration issue 80040154, OneNote syncing, timeout), the note text is gone with no recovery.

**How to avoid:**
Implement a defensive async pattern:
1. On push: `setPushing(true)` -- disable textarea + button, show spinner
2. `await` the IPC call to main process
3. On success: `setNoteText('')` + show brief success indicator (green checkmark, fade after 2s)
4. On error: show error message, keep textarea text intact, re-enable editing
5. Finally: `setPushing(false)`

Never call `setNoteText('')` before the await resolves.

**Warning signs:**
- `setNoteText('')` called before `await` completes
- No loading/disabled state during the push operation
- No error handling on the IPC call result
- User able to click push button multiple times during a pending operation

**Phase to address:**
Phase 1 (General Notes) -- implement defensive async pattern from the start

---

### Pitfall 4: Appending notes to a non-existent OneNote page (contact never opened in OneNote)

**What goes wrong:**
The existing COM API flow in `openContactPage()` either finds an existing page by E.164 in the title or creates a new one. It stores the page ID in `contact.oneNotePageId`. But the General Notes feature needs to append to a specific existing page. If the user has never clicked a OneNote role button for this contact, no page exists and no `oneNotePageId` is stored. The push will fail -- either with a cryptic COM error or by silently doing nothing.

**Why it happens:**
The existing OneNote integration was designed for "open/create and navigate" -- the user explicitly creates a page by clicking a role. General Notes assumes a page already exists to append to. These are different interaction patterns.

**How to avoid:**
1. Before pushing, check if the contact has a stored `oneNotePageId` (via `window.electronAPI.getContact(e164)`)
2. If no `oneNotePageId` exists: disable the push button and show a message like "Open this contact in OneNote first (click a role above)" or offer to create the page as part of the push
3. For the append operation, build a new function `appendGeneralNote(pageId: string, noteText: string)` in `onenote.ts` using the same pattern as `buildAppendScript()` -- construct a `<one:Page>` with new `<one:Outline>` containing the timestamped note
4. Always append to the single page stored in `contact.oneNotePageId`, not to all role pages
5. Add a new IPC handler `onenote:append-note` and corresponding preload exposure

**Warning signs:**
- Push button enabled when no `oneNotePageId` exists for the contact
- No check for `contact.oneNotePageId` before attempting append
- Attempting to create a page as a side effect of pushing notes (conflates two operations)
- No visual indication of whether a OneNote page exists for this contact

**Phase to address:**
Phase 1 (General Notes) -- handle the "no page yet" case explicitly in the UI

---

### Pitfall 5: Form I template rewrites accidentally break placeholder substitution

**What goes wrong:**
The 4 Form I entries in `shared/forms.ts` use `{name}`, `{unit}`, `{number}`, and `{email}` placeholders that get filled by `fillPlaceholders()` in ContactCard.tsx (line 162-169). When rewriting messages from client-facing ("Hi {name}, please find attached Form I...") to agent-to-agent commission split language, developers might: (a) forget to include placeholders entirely, (b) use different syntax (`{{name}}`, `%name%`, `$name`), or (c) use placeholders that don't apply in the agent-to-agent context.

**Why it happens:**
The agent-to-agent context changes who `{name}` refers to. In the current client-facing messages, `{name}` is the client. In agent-to-agent messages, the contact in the card might be the other agent, making `{name}` refer to that agent and `{unit}` refer to the property being discussed. This semantic shift is easy to get wrong.

**How to avoid:**
1. Establish explicitly what `{name}` means in agent-to-agent context: it should be the **other agent's name** (the person currently loaded in the contact card)
2. Keep using the exact same 4 placeholders (`{name}`, `{unit}`, `{number}`, `{email}`) -- do not invent new ones
3. Ensure `{unit}` is always referenced because commission split discussions need to identify the specific property/deal
4. Mentally run `fillPlaceholders()` on each rewritten message with test data (e.g., name="Ahmed", unit="507 Burj Vista") and verify it reads naturally as a message to another agent
5. Do NOT change the `fillPlaceholders()` function itself

**Warning signs:**
- New placeholder syntax appearing in the rewritten messages
- Messages that don't reference `{unit}` (commission splits are always per-deal)
- Messages that say "Dear {name}" but assume {name} is a client, not a fellow agent
- The `fillPlaceholders` function being modified to support new placeholders

**Phase to address:**
Phase 2 (Form I rewrites) -- verify placeholders work before committing

---

### Pitfall 6: Changing Form I defaults in shared/forms.ts while user overrides silently mask changes

**What goes wrong:**
The app has a `formOverrides` system (stored in electron-store, keyed by form `id` like `form-i-seller`). Users can customize any form's WhatsApp/email messages via the edit pencil icon. If the default messages in `shared/forms.ts` are rewritten but a user already has saved custom overrides for Form I entries, the user will still see their old custom versions, not the new agent-to-agent defaults. The `handleFormWhatsApp()` function (line 190) checks overrides first: `override?.whatsappMessage ?? form.whatsappMessage`.

**Why it happens:**
The override system was designed correctly for normal customization. But this is an unusual case: the defaults themselves are changing purpose (from client-facing to agent-to-agent). Existing overrides will mask the entire purpose change.

**How to avoid:**
For this specific case (David is the primary/only user), the simplest approach is correct:
1. Just change the defaults in `forms.ts`
2. If David has custom overrides for any Form I entry, he'll still see those -- which is probably fine since he'd update them manually anyway
3. "Reset to Default" in the edit modal will give the new agent-to-agent language
4. Optionally: add a one-time migration in the main process startup that clears `formOverrides` entries for the 4 Form I IDs, so the new defaults take effect immediately

Do NOT change the form IDs (`form-i-seller` -> `form-i-seller-agent`) -- this creates orphaned overrides and is unnecessary complexity for a single-user scenario.

**Warning signs:**
- Changing defaults without realizing overrides take precedence at runtime
- Testing only the defaults without checking if overrides exist in the store
- Changing form IDs, breaking override associations

**Phase to address:**
Phase 2 (Form I rewrites) -- decide on override handling before editing forms.ts

---

## Moderate Pitfalls

### Pitfall 7: OneNote COM API XML encoding issues in free-form user input

**What goes wrong:**
User-typed notes can contain characters that break XML: `<`, `>`, `&`, quotes, Unicode emoji, or the literal string `]]>` which terminates CDATA sections. The existing code wraps content in `<![CDATA[...]]>` sections (see `buildRolePsOutlines`, line 79-83), which handles most characters. But CDATA itself breaks if the note contains the literal string `]]>`. The existing `psEscape()` function (line 12) only handles PowerShell single-quote escaping (`'` -> `''`), not XML-unsafe content within CDATA.

**Why it happens:**
General Notes is the **first feature** where the user types arbitrary free-form text that flows into OneNote XML. All previous content (role template labels, questions, document checklist items) is developer-defined and controlled. A real estate agent's free-form notes might include: price ranges with `<` and `>`, company names with `&`, or property descriptions with special characters.

**How to avoid:**
1. Continue using CDATA sections (already the established pattern)
2. Before embedding in CDATA, replace the literal string `]]>` in user input with `]] >` (insert space) or split the CDATA section at that boundary
3. Test with these strings: `Price < 2M & > 1.5M`, `Company A & B`, `end ]]> test`, emoji like thumbs up
4. PowerShell string quoting also needs care: notes containing single quotes must go through `psEscape()` before embedding in the PowerShell script

**Warning signs:**
- OneNote COM API throwing `0x80042014` errors (malformed XML)
- Notes containing `&` or `<` silently not appearing in OneNote
- PowerShell script errors when notes contain single quotes

**Phase to address:**
Phase 1 (General Notes) -- add XML-safe content escaping

---

### Pitfall 8: No timestamp on appended notes making OneNote page a mess

**What goes wrong:**
If the General Notes feature appends plain text to the OneNote page without a timestamp, the agent ends up with a wall of text on the page with no way to know when each note was written. After 10+ pushes, the OneNote page becomes an unstructured dump that's harder to read than if the agent had just typed directly into OneNote.

**Why it happens:**
The spec says "push to OneNote, clears after push" but doesn't specify formatting. The temptation is to just append the text as a new `<one:Outline>` block. Without timestamps, the chronological context is lost.

**How to avoid:**
Each pushed note should be formatted as a timestamped outline:
```
--- General Note (06 Mar 2026, 14:30) ---
[Note text here]
```
Use a `<one:Outline>` with the timestamp as the first `<one:OE>` element (matching the pattern used for role sections which have headers like "Tenant Qualifying Questions"). The timestamp should be human-readable (not ISO 8601) since agents will read this in OneNote.

**Warning signs:**
- Notes appended without any identifying header
- Multiple notes appearing as one continuous text block
- No way to distinguish between notes pushed at different times

**Phase to address:**
Phase 1 (General Notes) -- include timestamp formatting in the append function

---

### Pitfall 9: Form I rewrite scope creep into other form entries

**What goes wrong:**
While editing the 4 Form I entries in `forms.ts`, it's tempting to also "improve" adjacent form messages, fix typos in Form A/B/F templates, update company names, or restructure the forms array. This creates a large diff that's hard to review and risks introducing bugs in templates that were working fine.

**Why it happens:**
The `forms.ts` file has 20+ form entries. The 4 Form I entries are scattered across the file (lines 74-96 for sales, lines 185-206 for rentals). While scrolling through to find them, other entries are visible and invite tweaking.

**How to avoid:**
1. Touch exactly 4 objects in `forms.ts`: `form-i-seller` (line 74), `form-i-buyer` (line 86), `form-i-landlord` (line 185), `form-i-tenant` (line 197)
2. Change only the `whatsappMessage`, `emailSubject`, and `emailBody` fields
3. Do NOT change: `id`, `name`, `fileName`, `subFolder`, `categories`, `description`, `signable`
4. If other improvements are noticed, note them for a separate commit/task

**Warning signs:**
- Git diff touching more than 4 form entries in forms.ts
- Changes to form metadata fields (name, fileName, categories)
- New form entries being added in the same change

**Phase to address:**
Phase 2 (Form I rewrites) -- discipline the scope strictly

---

### Pitfall 10: Landing page update forgetting the dual-location sync requirement

**What goes wrong:**
The project has content in two places: `docs/` and `landing/`. The MEMORY.md explicitly states "landing/ and docs/ must stay in sync." Updating the landing page to mention General Notes or show new screenshots but forgetting to update the corresponding `docs/` files creates drift that gets worse over time.

**Why it happens:**
The landing page is the visible deliverable; the docs folder feels like internal documentation. Easy to update one location and forget the other.

**How to avoid:**
1. After any landing page content change, check if a corresponding file exists in `docs/` and update it
2. Screenshots specifically: `docs/screenshots/` and `landing/screenshots/` should have the same set of images
3. Treat this as a checklist item at the end of the landing page phase, not during it

**Warning signs:**
- `landing/screenshots/` and `docs/screenshots/` having different file counts
- Landing page text mentioning "General Notes" but docs/ not reflecting it

**Phase to address:**
Phase 3 (Landing page update) -- verify sync as final step

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding General Notes state directly to ContactCard.tsx | Faster to implement, no new file | 800+ line component, harder to maintain, keystroke re-renders all sections | Never -- extract from the start (NewsFeed pattern exists) |
| Hardcoding note format as plain text only | No rich text complexity | Can't add formatting, bullet points, or styled headings later | Acceptable for v1.1 -- plain text with timestamps is sufficient |
| Not persisting draft notes locally before push | No electron-store schema change | User loses typed notes if panel is closed/minimized before push | Acceptable for v1.1 -- notes are typically short, push-then-forget |
| Skipping OneNote page existence check before push | Less code, fewer edge cases | Push fails with confusing COM error when no page exists | Never -- always check `oneNotePageId` |
| Reusing existing form IDs after purpose change | No migration needed, no orphaned overrides | "Reset to Default" gives unexpected language if user customized for old purpose | Acceptable -- David is the only user and understands the change |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OneNote COM API (append) | Sending full page XML (replaces all content) | Send partial `<one:Page>` with only new `<one:Outline>` elements -- `UpdatePageContent` merges new outlines, does not replace existing ones. Pattern: `buildAppendScript()` in onenote.ts |
| OneNote COM API (CDATA) | Assuming CDATA handles all input safely | Strip or escape `]]>` from user input before wrapping in CDATA; also run through `psEscape()` for PowerShell string safety |
| OneNote COM API (namespace) | Hardcoding the `xmlns:one="..."` URL | Detect namespace dynamically from hierarchy XML -- already done correctly in existing code (`$ns = $doc.DocumentElement.NamespaceURI`). Copy this pattern exactly. |
| OneNote COM API (timeout) | Reducing the PowerShell timeout for "faster" UX | COM calls take 2-10s depending on OneNote sync state. The existing 30s timeout in `runPowerShell()` is correct. Show a loading indicator instead of reducing the timeout. |
| electron-store (formOverrides) | Mutating the stored object directly instead of spreading | Always spread (`{ ...current, [key]: value }`) before `store.set()`. Existing code in ipc.ts does this correctly -- follow the pattern. |
| IPC (new handler) | Forgetting to expose in preload | Every new `ipcMain.handle()` in ipc.ts needs a corresponding `contextBridge.exposeInMainWorld()` entry in preload/index.ts, or the renderer can't call it. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Textarea onChange re-rendering entire ContactCard | Typing lag, stuttery input in notes field | Extract GeneralNotes as isolated component -- React re-renders are scoped to the component tree | Immediately noticeable with fast typing |
| Loading full contact record every render cycle | Slow panel open, unnecessary IPC round-trips | Load contact data once on mount or when e164 changes, cache in state with `useEffect` | With 100+ contacts and frequent panel opens |
| Pushing notes on every keystroke (auto-save) | OneNote COM API hammered, PowerShell processes pile up | Only push on explicit button click or Ctrl+Enter. Never on onChange or debounced auto-save. | Immediately -- COM API is not designed for rapid calls |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging note content to debug files | The existing error handler writes debug info to `askdave-onenote-error.txt` in tmpdir (onenote.ts line 340). If note content is included, client information sits in a temp file. | Log "note push failed" and the error message, but NOT the note content itself. |
| Caching note text in electron-store for draft persistence | Notes could contain sensitive client details (financials, personal info) that would persist on disk | Do NOT persist draft notes. Textarea state lives only in React component state. Cleared on unmount. |
| Form I commission amounts in WhatsApp URL previews | Commission percentages/amounts in WhatsApp message previews visible to anyone nearby | Keep commission language generic in defaults ("as per our agreement" / "as discussed") rather than specific amounts. Agent can customize with specifics per-deal if they choose. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback during OneNote push (2-5 second wait) | User clicks push, nothing happens, clicks again, gets duplicate notes | Show inline spinner + disable button during push. Success: brief green checkmark that fades. Error: red text with message. |
| Textarea too small for useful notes | Agent can't see what they've typed, constant scrolling | Start at 3-4 rows height with `resize: vertical` CSS. Match existing dark theme input styling (white bg would look jarring). |
| General Notes section always expanded by default | Takes vertical space from more-used sections; scrolling increases | Default collapsed with chevron, matching every other section in ContactCard (templates, forms, KYC, news all default collapsed) |
| Push button labeled just "Push" or "Save" | Ambiguous -- save where? Push to what? | Label: "Push to OneNote" with `FileText` icon (already used for OneNote in the codebase). Makes the destination explicit. |
| No indication whether a OneNote page exists for this contact | User clicks push, gets error, doesn't understand why | Show "Open in OneNote first" or conditional UI based on `oneNotePageId` existence |
| Form I messages still sounding client-facing after rewrite | Agent sends to another agent, message says "Dear {name}, please find attached..." which sounds wrong between agents | Use peer-appropriate tone: "Hi {name}," not "Dear {name},". Reference "commission split" and "deal" language. Drop formal closings like "Best regards" -- agents messaging each other on WhatsApp don't write like that. |

## "Looks Done But Isn't" Checklist

- [ ] **General Notes:** Verify note actually appears in the OneNote page (open OneNote and check) -- not just "success" returned from COM API
- [ ] **General Notes:** Verify textarea clears ONLY after confirmed success, retains text on error
- [ ] **General Notes:** Test with special characters: `<`, `>`, `&`, single quotes `'`, emoji, `]]>`, multi-line with blank lines
- [ ] **General Notes:** Test when OneNote desktop app is not running (COM should launch it, but verify)
- [ ] **General Notes:** Test when no OneNote page exists for the contact (graceful message, not crash)
- [ ] **General Notes:** Test when OneNote is installed but user is not signed in
- [ ] **General Notes:** Verify the note includes a timestamp header in OneNote
- [ ] **General Notes:** Verify the push button is disabled while a push is in progress (no double-push)
- [ ] **General Notes:** New IPC handler registered in ipc.ts AND exposed in preload/index.ts AND typed in the electronAPI interface
- [ ] **Form I rewrites:** All 4 entries still have correct `{name}` and `{unit}` placeholders
- [ ] **Form I rewrites:** WhatsApp message reads naturally as agent-to-agent (not agent-to-client)
- [ ] **Form I rewrites:** Email subject and body read naturally as agent-to-agent
- [ ] **Form I rewrites:** No other form entries were accidentally modified (git diff check)
- [ ] **Form I rewrites:** `formOverrides` in electron-store don't mask the new defaults (or this is intentionally accepted)
- [ ] **Landing page:** `docs/` and `landing/` are in sync after update
- [ ] **Landing page:** Screenshots show the General Notes section if it's being promoted as a feature

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Built with Graph API instead of COM API | HIGH (1-2 days wasted) | Rip out OAuth/Graph code entirely. Rewrite using COM API pattern from onenote.ts. Test with existing PowerShell approach. |
| ContactCard.tsx became a monolith (>800 lines) | MEDIUM (2-4 hours) | Extract GeneralNotes component after the fact. Move state and handlers out. Test that parent-child props work correctly. |
| Notes lost due to premature textarea clear | UNRECOVERABLE | User must retype notes from memory. No local backup exists. Prevention is the only strategy. |
| Form I placeholders broken | LOW (15 min) | Fix the template strings in forms.ts, test with `fillPlaceholders()` by previewing in the app. |
| User overrides masking new Form I defaults | LOW (30 min) | Either manually clear overrides in electron-store config file, or add a migration. |
| XML encoding breaks OneNote push | LOW (30 min) | Add CDATA content escaping in onenote.ts. Pattern: replace `]]>` with `]] >`. |
| Landing/docs out of sync | LOW (15 min) | Copy updated files from landing/ to docs/ (or vice versa). |
| New IPC handler not exposed in preload | LOW (10 min) | Add the missing `contextBridge.exposeInMainWorld()` entry in preload/index.ts. Common miss because there are 3 files to update (ipc.ts, preload/index.ts, and the renderer call site). |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| COM API vs Graph API confusion | Phase 1 (General Notes) | Code review: no Graph API imports, uses `runPowerShell()` + `UpdatePageContent()` pattern |
| ContactCard monolith | Phase 1 (General Notes) | ContactCard.tsx stays under 720 lines; GeneralNotes.tsx exists as separate component file |
| Clear-after-push race condition | Phase 1 (General Notes) | Manual test: interrupt push (close OneNote mid-operation), verify textarea retains text |
| No page exists for contact | Phase 1 (General Notes) | Test with a brand new phone number that has never been opened in OneNote |
| XML encoding in CDATA | Phase 1 (General Notes) | Test with `< > & ' ]]>` characters in note text |
| Note timestamps | Phase 1 (General Notes) | Open OneNote after push, verify timestamp header is present and readable |
| IPC handler registration | Phase 1 (General Notes) | Verify handler in ipc.ts, exposure in preload/index.ts, and call site in renderer all exist |
| Placeholder breakage | Phase 2 (Form I rewrites) | Run fillPlaceholders() on each new message with sample data in the app UI |
| Override masking | Phase 2 (Form I rewrites) | Check formOverrides in electron-store config after update |
| Scope creep in forms.ts | Phase 2 (Form I rewrites) | Git diff shows exactly 4 form entries changed, only whatsappMessage/emailSubject/emailBody fields |
| Agent-to-agent tone | Phase 2 (Form I rewrites) | Read each message aloud -- does it sound like one agent talking to another, or like a formal client letter? |
| Landing/docs sync | Phase 3 (Landing page) | Compare file lists and content between `docs/` and `landing/` directories |

## Sources

- Direct analysis: `src/main/onenote.ts` -- COM API via PowerShell, `UpdatePageContent`, `buildAppendScript()`, `psEscape()`, `runPowerShell()` with 30s timeout
- Direct analysis: `src/shared/forms.ts` -- 4 Form I entries: `form-i-seller` (ln 74), `form-i-buyer` (ln 86), `form-i-landlord` (ln 185), `form-i-tenant` (ln 197)
- Direct analysis: `src/renderer/panel/components/ContactCard.tsx` -- 693 lines, `fillPlaceholders()` at ln 162, `formOverrides` check at ln 190-191
- Direct analysis: `src/main/ipc.ts` -- IPC handler patterns, `store:saveFormOverride` handler, `onenote:open` handler
- Direct analysis: `src/preload/index.ts` -- `contextBridge.exposeInMainWorld` surface for all renderer-to-main calls
- Direct analysis: `src/shared/types.ts` -- `Contact` type has `oneNotePageId?: string` field, `FormTemplateOverride` type
- Direct analysis: `src/main/store.ts` -- `formOverrides` default is `{}`, electron-store schema
- Project MEMORY.md: "landing/ and docs/ must stay in sync", COM error codes (80040154) already handled

---
*Pitfalls research for: v1.1 General Notes + Form I template rewrites*
*Researched: 2026-03-06*
