# Technology Stack

**Project:** Real Estate Agent Toolkit v1.1 -- General Notes + Form I Fixes
**Researched:** 2026-03-06
**Confidence:** HIGH

---

## Executive Assessment

**No new dependencies are needed for v1.1.** Every capability required for General Notes (OneNote append) and Form I template rewrites already exists in the current stack. This is a UI + text-content milestone, not a technology change.

The v1.0 stack (below) is validated and shipped. This document focuses exclusively on how the existing stack serves the new features.

---

## Current Stack (Shipped in v1.0 -- DO NOT change)

### Core Framework
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Electron | ^34.0.0 | Desktop app shell | Shipped |
| electron-vite | ^5.0.0 | Build toolchain | Shipped |
| React | ^19.0.0 | UI framework | Shipped |
| TypeScript | ^5.7.0 | Type safety | Shipped |
| Tailwind CSS | ^4.0.0 | Styling | Shipped |

### Data & Storage
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| electron-store | ^9.0.0 | Persistent settings, contacts, form overrides | Shipped |

### OneNote Integration
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| PowerShell COM (`OneNote.Application`) | Built into Windows | OneNote read/write via local COM API | Shipped |
| `runPowerShell()` in `src/main/onenote.ts` | N/A | Executes PS1 scripts with error handling | Shipped |
| `buildAppendScript()` in `src/main/onenote.ts` | N/A | Appends Outline XML to existing page by pageId | Shipped |
| `openContactPage()` in `src/main/onenote.ts` | N/A | Creates or navigates to contact page, stores pageId | Shipped |

### Forms System
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| `src/shared/forms.ts` (FORMS array) | N/A | 20 static form definitions with WhatsApp/email templates | Shipped |
| `FormTemplateOverride` type | N/A | User-editable overrides stored in electron-store | Shipped |

---

## What v1.1 Needs (and Why No New Libraries)

### Feature 1: General Notes -- OneNote Append

**What it does:** A textarea in the ContactCard where the agent types free-form notes. A "Push to OneNote" button appends the text below existing page content. The textarea clears on success.

**Why the existing stack covers this completely:**

1. **UI (textarea + button):** Standard React + Tailwind. The ContactCard already contains 694 lines of similar UI patterns -- inputs, buttons, collapsible sections, status messages, loading states.

2. **Local state for draft text:** The `Contact` type in `shared/types.ts` already has a `notes: string` field (line 125). Draft notes can live in component state (cleared on push) or persist via `upsertContact()` if we want drafts to survive app restarts.

3. **OneNote append mechanism:** The `buildAppendScript()` function (line 222 of `onenote.ts`) already generates PowerShell that appends XML Outline elements to an existing page by `pageId`. General Notes needs a simplified variant that wraps arbitrary text in OneNote XML:
   ```xml
   <one:Page xmlns:one="..." ID="...">
     <one:Outline>
       <one:OEChildren>
         <one:OE>
           <one:T><![CDATA[--- General Notes (2026-03-06 14:30) ---]]></one:T>
         </one:OE>
         <one:OE>
           <one:T><![CDATA[Agent's free-form text here...]]></one:T>
         </one:OE>
       </one:OEChildren>
     </one:Outline>
   </one:Page>
   ```
   The `UpdatePageContent()` COM method performs a partial merge -- it adds new Outline elements without removing existing ones. This is already proven in `buildAppendScript()`.

4. **Page ID resolution:** The contact's `oneNotePageId` is stored when a page is created (line 317: `upsertContact(data.e164, { oneNotePageId: result.pageId })`). If no page exists yet, call `openContactPage()` first to create one, then append notes to the returned `pageId`.

5. **IPC channel:** Add one new handler (e.g., `onenote:append-notes`) in `ipc.ts` following the existing `onenote:open` pattern (line 172). Expose via preload following `openInOneNote` pattern (preload `index.ts` lines 57-58).

6. **Error handling:** The existing `runPowerShell()` function (line 25) already handles COM errors, timeouts, and missing OneNote gracefully. Reuse it directly.

**New code needed (all within existing files):**

| File | Change | Lines of Code (est.) |
|------|--------|---------------------|
| `src/main/onenote.ts` | Add `appendNotesToPage(pageId, text)` function | ~30 lines |
| `src/main/ipc.ts` | Add `onenote:append-notes` handler | ~15 lines |
| `src/preload/index.ts` | Add `appendNotesToOneNote()` method | ~3 lines |
| `src/renderer/env.d.ts` | Add type declaration for new preload method | ~2 lines |
| `src/renderer/panel/components/ContactCard.tsx` | Add textarea + "Push to OneNote" button section | ~60 lines |

**Total estimated new code: ~110 lines across 5 existing files.**

### Feature 2: Form I Template Rewrites

**What it does:** Change the 4 Form I WhatsApp and email messages from client-facing language to agent-to-agent commission split language. These forms are sent between cooperating agents, not to clients.

**Why no new dependencies:** Pure text edit in `src/shared/forms.ts`. The 4 Form I entries are:

| ID | Name | Line |
|----|------|------|
| `form-i-seller` | Form I -- Sales (Seller) | 74 |
| `form-i-buyer` | Form I -- Sales (Buyer) | 86 |
| `form-i-landlord` | Form I -- Leasing (Landlord) | 185 |
| `form-i-tenant` | Form I -- Leasing (Tenant) | 196 |

Each has `whatsappMessage`, `emailSubject`, and `emailBody` fields. Rewrite the text from "Hi {name}, please find attached Form I -- the commission disclosure form..." to agent-to-agent language about commission splits (e.g., "Hi {name}, please find attached Form I for the commission split on {unit}. Please review the agreed terms and return signed.").

**Important behavioral note:** Users who have already customized these templates via `formOverrides` in electron-store will NOT see the changes. Overrides take priority by design (see `ContactCard.tsx` line 191: `override?.whatsappMessage ?? form.whatsappMessage`). Only users on default templates see the new agent-to-agent wording. This is correct behavior -- do not reset overrides.

**Structural changes: None.** Same fields, same types, different text content.

### Feature 3: Landing Page Update

**What it does:** Update landing page to reflect the General Notes feature.

**Why no new dependencies:** The `landing/` directory is a static HTML/CSS page. Add a description and screenshot of the new feature. No build tooling involved.

---

## Alternatives Considered (and Rejected)

| What Was Considered | Why NOT |
|-------------------|---------|
| Microsoft Graph API for OneNote append | Already using COM API which works without auth tokens, no login required, faster, works offline. Switching to Graph would require OAuth2 setup -- a regression in UX and complexity. COM is the right choice for a Windows desktop app where OneNote is installed locally. |
| Rich text editor (TipTap, Slate, ProseMirror) | Overkill. Agents need to type quick free-text notes, not formatted documents. A plain `<textarea>` is faster to use and faster to build. OneNote itself handles formatting -- the agent can edit in OneNote after pushing. |
| Markdown parser for notes | OneNote does not render markdown. Plain text in CDATA is the correct approach for the COM API. Adding a markdown library that OneNote ignores would be misleading. |
| Local SQLite/IndexedDB for notes storage | Defeats the core value proposition. Notes must live in OneNote alongside qualifying questions and rapport notes so they are portable when agents change firms. Local-only storage is a dead end. |
| Debounced auto-push to OneNote | Too aggressive. OneNote COM calls take 1-3 seconds. Auto-push while typing would create lag and unpredictable behavior. An explicit "Push" button gives the agent clear control and immediate feedback. |
| New state management library (Redux, Zustand, Jotai) | The app uses React component state + electron-store successfully across 694 lines of ContactCard UI. Adding a state management library for one textarea is unnecessary complexity. |

---

## What NOT to Add

| Do NOT Add | Reason |
|-----------|--------|
| Any new npm packages | Everything needed is already installed or built into the platform |
| Rich text editor library | Plain text is intentional -- agents type quick notes, not documents |
| Markdown parser | OneNote does not render markdown; plain text in CDATA is correct |
| State management library | React state + electron-store is sufficient |
| Auto-sync/polling for OneNote | COM API is request-response; agent pushes when ready |
| New IPC patterns or frameworks | Existing `ipcMain.handle` / `ipcRenderer.invoke` pattern works |
| Database for notes | Notes belong in OneNote, not in a local database |

---

## Files to Modify (Complete List)

### General Notes
| File | Change Type | What |
|------|-------------|------|
| `src/main/onenote.ts` | Add function | `appendNotesToPage(pageId: string, notesText: string): Promise<void>` |
| `src/main/ipc.ts` | Add handler | `onenote:append-notes` IPC channel |
| `src/preload/index.ts` | Add method | `appendNotesToOneNote(e164, text)` exposed to renderer |
| `src/renderer/env.d.ts` | Add type | Type declaration for new preload method |
| `src/renderer/panel/components/ContactCard.tsx` | Add UI | "General Notes" collapsible section with textarea + "Push to OneNote" button |

### Form I Rewrites
| File | Change Type | What |
|------|-------------|------|
| `src/shared/forms.ts` | Text edit | Rewrite `whatsappMessage`, `emailSubject`, `emailBody` for 4 Form I entries |

### Landing Page
| File | Change Type | What |
|------|-------------|------|
| `landing/index.html` | Add content | General Notes feature description + screenshot |

---

## Installation

```bash
# No new packages to install for v1.1
# Verify existing setup works:
cd "C:/Users/David/AI Projects/GSD Sessions/Real Estate Ecosystem"
npm run dev
```

---

## Integration Notes

### General Notes -- Key Design Decisions

1. **Textarea placement in ContactCard:** Add as a new collapsible section (following the existing pattern of Templates, Forms, KYC, News). Place it after OneNote Templates and before Forms -- logically grouped with the OneNote features. Use the `StickyNote` or `NotebookPen` icon from lucide-react (already installed).

2. **Push behavior when no OneNote page exists:** If `contact.oneNotePageId` is undefined, the push should first call `openContactPage()` to create the page, then call `appendNotesToPage()` with the returned `pageId`. This handles the case where an agent types notes before ever opening OneNote for that contact.

3. **Timestamp in notes:** Each push should prepend a timestamp header (e.g., "--- General Notes (2026-03-06 14:30) ---") so the agent can see when each batch of notes was added in OneNote. This is free-text, not structured data.

4. **Multi-line notes:** The OneNote COM API handles multi-line text correctly in CDATA sections. However, each line should be a separate `<one:OE>` element for proper OneNote rendering. Split on newlines when building the XML.

5. **Clear on success only:** The textarea clears only after a successful COM call. On error, the text is preserved so the agent does not lose their notes.

### Form I -- Context for Rewrite

Form I is the RERA commission disclosure form. In practice, it is sent between cooperating agents to agree on commission splits, NOT to clients. The current templates address the contact as "Dear {name}" and talk about "your property" -- this makes sense for client-facing forms but is wrong for Form I.

The rewrite should:
- Address the receiving agent professionally
- Reference the property by unit/address
- State the commission split terms clearly
- Request signed return
- Keep the tone professional but direct (agent-to-agent, not formal client letter)

---

## Sources

- Direct codebase analysis of `src/main/onenote.ts` (343 lines, `buildAppendScript()` at line 222, `runPowerShell()` at line 25, `openContactPage()` at line 296) -- HIGH confidence
- Direct codebase analysis of `src/shared/forms.ts` (263 lines, 4 Form I entries at lines 74, 86, 185, 196) -- HIGH confidence
- Direct codebase analysis of `src/shared/types.ts` (`Contact.notes` field at line 125) -- HIGH confidence
- Direct codebase analysis of `src/renderer/panel/components/ContactCard.tsx` (694 lines, existing collapsible section pattern) -- HIGH confidence
- Direct codebase analysis of `src/main/ipc.ts` (OneNote IPC handlers at lines 170-179) -- HIGH confidence
- Direct codebase analysis of `src/preload/index.ts` (OneNote preload methods at lines 57-60) -- HIGH confidence
- Direct codebase analysis of `package.json` (current dependency list, 2 runtime deps + 20 dev deps) -- HIGH confidence
