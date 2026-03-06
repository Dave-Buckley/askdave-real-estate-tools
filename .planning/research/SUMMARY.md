# Project Research Summary

**Project:** Real Estate Agent Toolkit v1.1 -- General Notes + Form I Fixes
**Domain:** Electron desktop app feature iteration (UAE real estate productivity tool)
**Researched:** 2026-03-06
**Confidence:** HIGH

## Executive Summary

v1.1 is a small, well-scoped iteration on a shipped v1.0 product (102 commits, 9,905 LOC, 6-day build). The three deliverables -- General Notes with push-to-OneNote, Form I agent-to-agent template rewrites, and a landing page update -- require zero new dependencies and build entirely on proven patterns already in the codebase. The existing OneNote COM API integration, form template system, and ContactCard UI all have clear extension points for these features. Total estimated effort is 5-7 hours of implementation across approximately 120 new lines of code plus text content changes.

The recommended approach is to treat this as a three-phase sequence ordered by risk and dependency: Form I template rewrites first (zero-risk text change, immediate value), then General Notes (new IPC handler and UI following existing patterns), then landing page updates (must reflect finished features). The architecture research confirms that every integration point -- `onenote.ts` for COM API appends, `ipc.ts` for handler registration, `preload/index.ts` for bridge exposure, and `ContactCard.tsx` for UI sections -- follows well-documented internal patterns that can be replicated directly.

The primary risks are all preventable with discipline: (1) accidentally building against Microsoft Graph API instead of the existing COM API (the milestone context had an incorrect reference to "Graph API PATCH"), (2) growing ContactCard.tsx into an unmaintainable monolith instead of extracting a GeneralNotes component, and (3) clearing the textarea before the OneNote push confirms, which would cause unrecoverable data loss. All three have clear prevention strategies documented in the pitfalls research. The Form I rewrite carries minimal risk but requires attention to placeholder syntax (`{name}`, `{unit}`) and awareness that existing user overrides will mask the new defaults by design.

## Key Findings

### Recommended Stack

No stack changes. The v1.0 stack is validated, shipped, and covers every capability needed for v1.1. See [STACK.md](./STACK.md) for the full rationale and alternatives considered.

**Core technologies (all shipped, all retained):**
- **Electron ^34 + electron-vite ^5:** Desktop app shell and build toolchain -- no changes needed
- **React ^19 + TypeScript ^5.7:** UI and type safety -- General Notes is standard React state + textarea
- **OneNote COM API via PowerShell:** `buildAppendScript()` already appends outlines to existing pages by pageId -- General Notes reuses this exact pattern with `UpdatePageContent()` partial merge
- **electron-store ^9:** Contacts, settings, form overrides already persisted -- no schema changes needed

**Critical constraint:** Do not add any npm packages. Do not introduce Microsoft Graph API, OAuth, rich text editors, markdown parsers, or state management libraries. Every alternative was evaluated and rejected with clear rationale in STACK.md.

### Expected Features

See [FEATURES.md](./FEATURES.md) for the complete landscape with dependency graphs.

**Must have (table stakes for v1.1 to feel complete):**
- General Notes textarea in the contact card -- agents take scratch notes during calls
- Push-to-OneNote for general notes -- notes must land in OneNote alongside qualifying data
- Clear-after-push -- reinforces that OneNote is permanent storage, textarea is transient
- All 4 Form I templates rewritten to agent-to-agent commission split language
- All 4 Form I descriptions updated to match new purpose

**Should have (differentiators that elevate beyond a bug fix):**
- Timestamped note push -- chronological log in OneNote, professional CRM pattern
- Push feedback toast -- success/error indicator so agents trust the tool without verifying in OneNote
- Form I description update -- consistency between template text and form metadata
- Landing page v1.1 section -- shows active development, adds selling point

**Defer (v1.2+):**
- Ctrl+Enter keyboard shortcut for pushing notes
- Note history in-app (OneNote is the history)
- Form I auto-fill with agent/brokerage details from settings
- Rich text or markdown in notes
- Two-way OneNote sync
- Local draft persistence for notes

### Architecture Approach

The app follows Electron's three-process model (main/preload/renderer) with a strict IPC pattern: renderer calls `window.electronAPI.method()` through contextBridge to `ipcMain.handle()` in the main process. General Notes integrates by adding one new function in `onenote.ts`, one IPC handler in `ipc.ts`, one preload bridge method, and one extracted UI component. Form I is a pure data change in `shared/forms.ts`. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed integration designs with code examples.

**Major components touched by v1.1:**
1. **onenote.ts** -- Add `appendFreeformNote()` using existing `buildAppendScript()` pattern (~30 lines)
2. **ipc.ts + preload/index.ts** -- Add `onenote:append-note` handler and bridge (~18 lines)
3. **GeneralNotes.tsx (new file)** -- Extracted component with textarea, push button, loading/success/error states (~60 lines)
4. **ContactCard.tsx** -- Render `<GeneralNotes />` between action buttons and schedule section (minimal change)
5. **shared/forms.ts** -- Rewrite 12 string fields across 4 Form I entries (text-only, no logic changes)

**Key architectural decision:** Extract General Notes into its own component rather than adding state and handlers directly to the 693-line ContactCard.tsx. This follows the established pattern of `<NewsFeed />` which is rendered by ContactCard but manages its own state.

### Critical Pitfalls

See [PITFALLS.md](./PITFALLS.md) for the full list of 10 pitfalls with prevention strategies and recovery costs.

1. **COM API vs Graph API confusion** -- The milestone context incorrectly referenced "Graph API PATCH." The codebase uses OneNote COM API via PowerShell. Build General Notes using `runPowerShell()` and `UpdatePageContent()` only. Any Graph API code is wrong. Recovery cost: HIGH (1-2 days wasted).
2. **ContactCard monolith growth** -- At 693 lines with 15+ useState hooks, adding General Notes inline will create an unmaintainable file. Extract a `GeneralNotes.tsx` component from the start. Recovery cost: MEDIUM (2-4 hours).
3. **Premature textarea clearing** -- If the textarea clears before the COM API call confirms success (2-5 seconds), failed pushes cause unrecoverable data loss. Never call `setNoteText('')` before the await resolves. Recovery cost: UNRECOVERABLE.
4. **Missing OneNote page for contact** -- General Notes appends to an existing page by `oneNotePageId`. If no page exists yet, the push must either auto-create one or show a clear message. Failing silently with a COM error is unacceptable.
5. **Form I placeholder breakage** -- Rewriting templates must preserve `{name}`, `{unit}`, `{number}`, `{email}` placeholders exactly. Do not invent new syntax. In the agent-to-agent context, `{name}` is the cooperating agent and `{unit}` is the property under cooperation.

## Implications for Roadmap

Based on combined research, the v1.1 milestone should be structured as three phases in strict dependency order.

### Phase 1: Form I Template Rewrites

**Rationale:** Zero risk, zero code logic changes, zero dependencies on other features. Pure text editing in one file. Delivers immediate value and provides a quick confidence-building win before tackling the General Notes feature.

**Delivers:** Corrected agent-to-agent language for all 4 Form I WhatsApp messages, email subjects, and email bodies. Updated Form I descriptions to reflect agent-to-agent purpose.

**Addresses features:** All 4 Form I variants rewritten (table stakes), Form I description updates (differentiator)

**Avoids pitfalls:** Scope creep into other form entries (touch exactly 4 objects, 12 string fields). Placeholder breakage (verify `{name}` and `{unit}` are preserved and read naturally in agent-to-agent context). Override masking (accepted for single-user scenario; Reset button restores new defaults).

**Estimated effort:** ~30 minutes

### Phase 2: General Notes Feature

**Rationale:** This is the core feature of v1.1 and the only phase with meaningful technical work. It has a strict dependency chain (main process function -> IPC handler -> preload bridge -> renderer component). Must be built bottom-up. This phase contains all the technical risk in the milestone.

**Delivers:** General Notes textarea in ContactCard, push-to-OneNote with timestamped append, clear-on-success with feedback toast, extracted GeneralNotes.tsx component.

**Addresses features:** General Notes textarea (table stakes), push-to-OneNote (table stakes), clear-after-push (table stakes), timestamped push (differentiator), push feedback toast (differentiator)

**Avoids pitfalls:** Uses COM API only -- not Graph API. Extracts GeneralNotes.tsx component -- avoids monolith. Implements defensive async pattern -- no premature clear. Handles missing OneNote page gracefully. Escapes XML-unsafe characters in CDATA sections (`]]>` splitting, `psEscape()` for PowerShell strings).

**Build order within phase:**
1. `main/onenote.ts` -- add `appendFreeformNote()` with timestamp formatting and CDATA escaping
2. `main/ipc.ts` -- add `onenote:append-note` handler
3. `preload/index.ts` -- expose `appendNoteToOneNote` bridge + type declaration in `env.d.ts`
4. `renderer/GeneralNotes.tsx` -- new extracted component with textarea, push button, loading/error/success states
5. `renderer/ContactCard.tsx` -- render `<GeneralNotes />` between action buttons and schedule section
6. End-to-end testing: special characters, missing page, success/error flows, textarea clear behavior

**Estimated effort:** 3-5 hours

### Phase 3: Landing Page Update

**Rationale:** Must come last because it describes finished features. Cannot accurately represent General Notes or Form I changes until they are implemented and verified. Also depends on screenshots that should be taken after Phase 2 is complete.

**Delivers:** Updated `landing/index.html` and `landing/AskDave-Overview.html` with General Notes feature description and Form I agent collaboration tools mention.

**Addresses features:** Landing page v1.1 section (differentiator)

**Avoids pitfalls:** Landing/docs sync requirement -- verify both `docs/` and `landing/` directories after update. Screenshot accuracy -- only promote features that are built and tested.

**Estimated effort:** 1-2 hours

### Phase Ordering Rationale

- **Form I first** because it is completely independent, risk-free, and takes 30 minutes. Gets a commit on the board immediately and validates the development environment.
- **General Notes second** because it has a sequential dependency chain that cannot be parallelized (main -> IPC -> preload -> renderer). It contains all the technical risk and needs focused, uninterrupted attention.
- **Landing page last** because it must describe accurate, finished features. Writing marketing copy for unbuilt features creates rework.
- **No parallelism between phases** because the landing page depends on both prior phases, and Form I should be committed separately for a clean, reviewable diff.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (General Notes):** One product decision needed before implementation -- when a contact has no OneNote page yet and the agent pushes notes, should the system auto-create the page (recommended) or require the agent to open OneNote first? The XML escaping edge case (`]]>` in CDATA) should be tested early in the phase.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Form I):** Pure text editing with no code changes. The RERA Form I purpose is well-documented across multiple authoritative sources.
- **Phase 3 (Landing page):** Static HTML content updates with no technical complexity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct codebase analysis with line numbers. Zero new dependencies. Every integration point verified against source code. |
| Features | HIGH | Features are narrowly scoped. Table stakes vs differentiators vs anti-features clearly delineated. RERA Form I purpose confirmed across 4 authoritative external sources. |
| Architecture | HIGH | Integration design verified against existing patterns in onenote.ts, ipc.ts, preload/index.ts, and ContactCard.tsx. Build order follows proven dependency chains. Code examples provided. |
| Pitfalls | HIGH | 10 pitfalls identified from direct code analysis with line references. Critical pitfalls have concrete prevention strategies, warning signs, and recovery cost assessments. |

**Overall confidence:** HIGH

### Gaps to Address

- **"No page exists" UX decision:** When a contact has never been opened in OneNote and the agent tries to push notes, should the system auto-create the page or require a separate step? Recommendation: auto-create (call `openContactPage()` first, then append) because requiring a separate step adds friction to the core workflow. Decide during Phase 2 planning.
- **Form I override handling:** David may have existing `formOverrides` for Form I entries in his electron-store. The research recommends accepting that overrides mask new defaults (correct behavior by design). The "Reset to Default" button in the edit modal will restore the new agent-to-agent language. No migration needed, but David should be aware.
- **Screenshots:** Landing page updates ideally include screenshots of the General Notes feature. Screenshot TODOs already exist from v1.0. Plan to take screenshots after Phase 2 is verified, before Phase 3 begins.
- **Email-only contacts and General Notes:** OneNote pages are keyed on E.164 phone numbers. If a contact has only an email (no phone), the General Notes push will not have a page key. This edge case needs handling -- either require a phone number or support email-keyed pages. Low priority given the phone-centric nature of the tool.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/main/onenote.ts` (343 lines), `src/shared/forms.ts` (263 lines), `src/renderer/panel/components/ContactCard.tsx` (693 lines), `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/types.ts`, `src/main/contacts.ts`, `src/main/store.ts`
- PROJECT.md validated requirements and constraints
- MEMORY.md project state and user preferences

### Secondary (MEDIUM confidence)
- RERA Form I purpose: [Sotheby's](https://sothebysrealty.ae/the-journal/a-guide-to-rera-forms-in-dubai/), [Bayut](https://www.bayut.com/mybayut/guide-rera-forms-dubai/), [Engel & Volkers](https://www.engelvoelkers.com/ae/en/resources/types-of-rera-forms-in-dubai-for-property-transactions), [Co-broke](https://co-broke.app/the-ultimate-guide-to-agent-to-agent-contract-form-i-in-dubai)
- Commission split standards: [Co-broke](https://co-broke.app/how-to-negotiate-agent-to-agent-commission-in-dubai), [ACASA](https://www.acasa.ae/blogs/real-estate-commissions-a-comprehensive-guide)
- CRM note-taking patterns: [iHomeFinder](https://www.ihomefinder.com/blog/agent-and-broker-resources/real-estate-crm-features-2026/), [OneNote CRM Integration](https://www.kizan.com/blog/onenotes-small-step-for-productivity-one-giant-leap-for-crm)

### Tertiary (LOW confidence)
- None -- all findings are backed by primary or secondary sources

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*
