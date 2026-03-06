# Feature Landscape

**Domain:** Real estate agent productivity toolkit (UAE/Dubai market) -- v1.1 milestone features
**Researched:** 2026-03-06
**Scope:** General Notes notepad, Form I template rewrites, landing page v1.1 update
**Overall confidence:** HIGH -- Features are small, well-scoped, and build on existing v1.0 architecture

---

## Research Context

v1.0 shipped with 102 commits, 9,905 LOC, and a complete feature set including OneNote integration, 20 RERA forms with WhatsApp/email templates, contact cards, transcriber, flashcards, and news feed. This v1.1 research covers three narrowly scoped additions.

**Existing infrastructure these features build on:**
- OneNote COM API via PowerShell (`src/main/onenote.ts`) -- creates/finds pages, appends outlines
- Contact model with `notes: string` field already in `Contact` interface (`src/shared/types.ts`)
- Form template system with `FormEntry` + `FormTemplateOverride` for customizable WhatsApp/email messages (`src/shared/forms.ts`)
- ContactCard component with 10 collapsible sections (`src/renderer/panel/components/ContactCard.tsx`)
- Landing page as static HTML (`landing/AskDave-Overview.html`, `landing/index.html`)

---

## Table Stakes

Features that make General Notes and Form I templates feel complete. Missing = feels half-baked.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|-------------|
| **General Notes text area in contact card** | Agents take scratch notes during calls (property address, price mentioned, callback time). Without a visible text area in the contact card, they have to open a separate app or use paper. This was explicitly deferred from v1.0 (NOTE-04). | Low | Contact model already has `notes: string` field. ContactCard already has the prop structure for it. |
| **Push-to-OneNote for general notes** | The scratchpad is only half the feature. Agents need the notes to persist somewhere durable and searchable. OneNote is already the app's note system. Appending to the existing contact page is the natural behavior. | Low-Med | Existing `openContactPage()` in `onenote.ts` handles page creation/finding. Need a new `appendNotes()` function that appends free-text as an outline to an existing page. |
| **Clear after push** | Scratchpad semantics mean the text area empties after pushing to OneNote. This reinforces that OneNote is the permanent store and the text area is transient. Agents should not wonder "did it save?" or "is this the latest version?" | Low | Simple state reset after successful push. No persistence of notes needed locally beyond the current session. |
| **Form I template rewrite -- agent-to-agent language** | The 4 Form I variants currently use client-facing language ("Hi {name}, please find attached Form I -- the commission disclosure form as required by RERA"). Form I is an agent-to-agent (A2A) agreement used between cooperating brokers. The templates must address a fellow agent/broker, not a client. | Low | Text-only change in `src/shared/forms.ts`. No code logic changes needed. |
| **All 4 Form I variants covered** | Sales Buyer, Sales Seller, Leasing Landlord, Leasing Tenant -- all four must be rewritten. Missing one creates inconsistency. | Low | IDs: `form-i-seller`, `form-i-buyer`, `form-i-landlord`, `form-i-tenant` in `FORMS` array. |

---

## Differentiators

Features that elevate v1.1 beyond a bug-fix release.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|-------------|
| **Timestamped note push** | When notes are appended to OneNote, prefix with a timestamp (`2026-03-06 14:32`). Agents who push notes multiple times during a deal get a chronological log. This is how professional CRM note systems work. | Low | Simple `new Date().toLocaleString()` prefix in the OneNote outline XML. |
| **Push feedback toast** | After pushing notes to OneNote, show a brief success toast ("Notes pushed to OneNote") or error toast. Gives agents confidence the push worked without switching to OneNote to verify. | Low | Existing pattern in ContactCard: `followUpStatus` state with auto-dismiss `setTimeout`. Copy this pattern. |
| **Form I description update** | The `description` field for Form I entries currently says "RERA commission disclosure form for [role]." This should say "Agent-to-agent commission split agreement for [transaction type]" to match the rewritten templates. | Low | Text change in `forms.ts` alongside the template rewrite. |
| **Landing page v1.1 section** | Update the product overview and landing page to mention General Notes as a feature. Shows the product is actively developed and adds a selling point for download consideration. | Low-Med | HTML edit in `landing/AskDave-Overview.html` and possibly `landing/index.html`. |

---

## Anti-Features

Features to explicitly NOT build for General Notes or Form I in v1.1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Local persistence of general notes** | The `Contact.notes` field exists in the store, but using it creates a second source of truth alongside OneNote. The scratchpad should be transient -- type, push, clear. If agents want to keep notes, they push to OneNote. | Use React component state only. Do not persist to electron-store. The `notes` field in Contact can remain for future use but should not be the backing store for this scratchpad. |
| **Rich text / markdown editor** | Over-engineering the notepad. Agents are typing fast during calls. A plain textarea with monospace-friendly styling is all they need. Rich text adds complexity for zero value in a scratchpad. | Plain `<textarea>` element. No formatting toolbar. |
| **Two-way OneNote sync** | Pulling notes back from OneNote into the scratchpad creates sync conflicts, requires reading page content via COM (fragile), and violates the "scratchpad" mental model. | One-way push only. Agents who want to review notes open OneNote directly (the "Notes" button already does this). |
| **Form I auto-fill with agent details** | Tempting to auto-fill the cooperating agent's brokerage name, BRN, etc. But agents send Form I to agents they may have just met via co-broke platforms. The template should be generic. | Keep `{name}` placeholder for the cooperating agent's name. Let agents fill in details manually or use the form override system. |
| **Form I for off-plan category** | Form I Buyer currently appears under the `offplan` category tab. Agent-to-agent commission agreements for off-plan are less common (developer handles commission). Consider whether to keep it there. | Keep Form I Buyer under `offplan` -- it does apply when a buyer's agent brings a client to another agent's off-plan listing. No change needed. |

---

## Feature Dependencies

```
General Notes Text Area
  +-- ContactCard.tsx (add textarea + push button below existing inputs or as new collapsible section)
  +-- No new IPC channels needed for the textarea itself (component state only)

Push-to-OneNote
  +-- onenote.ts: new function to append free-text to existing page by pageId
  +-- Contact must have oneNotePageId (set when OneNote page was first created)
  +-- If no OneNote page exists yet, push should create one first, then append
  +-- New IPC handler: 'onenote:append-notes' (e164, notes text)
  +-- preload: expose appendNotesToOneNote() method

Clear After Push
  +-- Depends on successful push-to-OneNote response
  +-- setState('') on the textarea after success

Form I Template Rewrite
  +-- forms.ts: update whatsappMessage, emailSubject, emailBody for 4 entries
  +-- forms.ts: update description for 4 entries
  +-- No code changes -- pure content

Landing Page Update
  +-- Depends on General Notes being implemented (to describe accurately)
  +-- Can mention Form I improvements as "improved agent collaboration tools"
```

---

## General Notes -- Expected Behavior Analysis

### How scratchpad notes work in real estate agent tools

Based on domain research and analysis of CRM note-taking patterns:

**The scratchpad pattern (what agents expect):**
1. Agent receives/makes a call
2. Contact card pops up (already works via clipboard detection)
3. Agent types notes during the call in a text area -- budget, requirements, callback time, property details mentioned
4. After the call, agent clicks "Push to OneNote" (or similar)
5. Notes are appended to the contact's OneNote page with a timestamp
6. Text area clears, ready for next call
7. Agent moves to next contact

**Key design decisions:**
- **Placement in ContactCard:** The text area should appear between the Name/Email/Unit inputs and the Action buttons. Rationale: agents fill in contact details and notes before taking action (dial, WhatsApp, etc.). Alternatively, it could be a new collapsible section, but since it is a scratchpad used during every call, it should be always visible -- not hidden behind an accordion.
- **Size:** 3-4 rows minimum, resizable. Agents type varying amounts. Too small = frustrating during calls. Too large = pushes action buttons below the fold.
- **Push button:** Small button adjacent to or below the textarea, styled like existing action buttons. Label: "Push to OneNote" with the FileText icon. Disabled when textarea is empty.
- **Keyboard shortcut:** Consider Ctrl+Enter to push notes (power users will want this). Not required for v1.1 but low effort.

**What NOT to do:**
- Do not auto-save to OneNote on every keystroke (too many COM calls, performance killer)
- Do not require agents to select a role before pushing notes (notes are general, not role-specific)
- Do not add a "Save locally" button (creates two systems for notes)

### OneNote append behavior

The existing `buildAppendScript()` function in `onenote.ts` already demonstrates how to append outlines to an existing page via COM. The General Notes push should follow the same pattern:

1. Find the page by `oneNotePageId` (stored in contact record)
2. Build an outline with timestamp header and the notes text
3. Use `UpdatePageContent()` partial update to append
4. Return success/failure

If the contact has no `oneNotePageId` yet (never opened in OneNote), the push should first create the page (using existing `openContactPage` logic), then append the notes.

---

## Form I -- Agent-to-Agent Template Rewrite Analysis

### What Form I actually is

Form I is a **broker-to-broker agreement** (agent-to-agent, or A2A) used in Dubai real estate. It formalizes cooperation between two RERA-certified agents -- one representing the buyer/tenant and the other representing the seller/landlord. The form:

- Identifies both cooperating brokerages and their BRN (Broker Registration Number)
- Specifies the property under cooperation
- Defines the commission split (commonly 50/50)
- Protects both agents' clients and listings from poaching
- Is required by RERA when agents from different brokerages collaborate on a deal

**Current problem:** The 4 Form I templates in `forms.ts` address clients ("Hi {name}, please find attached Form I -- the commission disclosure form as required by RERA"). This is wrong. Form I is never sent to clients. It is sent between agents.

### Template rewrite requirements

**Audience change:** From client ({name} = client name) to cooperating agent ({name} = other agent's name)

**Tone change:** From formal client service ("Dear {name}, Please find attached...") to professional peer-to-peer ("Hi {name}, Please find attached Form I for our cooperation on {unit}...")

**Content change:**
- Remove "commission disclosure" language (that is what clients see)
- Add "commission split agreement" or "agent cooperation agreement" language
- Reference the property, not the client's transaction
- Mention that both parties should sign and retain copies
- WhatsApp messages should be concise (agents message each other casually)
- Email messages should be slightly more formal but still peer-level

**Four variants needed:**

| ID | Current Description | New Description | Key Difference |
|----|-------------------|-----------------|----------------|
| `form-i-seller` | Commission disclosure for seller | Agent-to-agent agreement -- listing agent side (sales) | Listing agent sends to buyer's agent |
| `form-i-buyer` | Commission disclosure for buyer | Agent-to-agent agreement -- buyer's agent side (sales) | Buyer's agent sends to listing agent |
| `form-i-landlord` | Commission disclosure for landlord | Agent-to-agent agreement -- listing agent side (leasing) | Listing agent sends to tenant's agent |
| `form-i-tenant` | Commission disclosure for tenant | Agent-to-agent agreement -- tenant's agent side (leasing) | Tenant's agent sends to listing agent |

**Typical commission splits (for template context):**
- Sales: 50/50 split of the total commission (2% of sale price is standard total)
- Leasing: 50/50 split of the total commission (5% of annual rent is standard total)
- Negotiable based on who brought the lead, who did the viewings, etc.

---

## Landing Page -- v1.1 Update Scope

### What needs to change

1. **Version number:** Update from v1.0 to v1.1 wherever displayed
2. **Feature mention:** Add "General Notes" to the feature list/grid -- a scratchpad for call notes that pushes directly to OneNote
3. **Agent tools mention:** Update or add mention of Form I agent-to-agent cooperation tools
4. **Screenshot:** Take a new screenshot showing the General Notes textarea in the contact card (deferred -- screenshot TODO already exists)

### What does NOT need to change

- Overall page structure and design
- Existing feature descriptions (transcriber, flashcards, forms, etc.)
- Download/setup flow
- Pricing or access model

---

## MVP Recommendation (v1.1 scope)

**Priority order for implementation:**

1. **Form I template rewrite** -- Pure text change, zero code risk, immediately shippable. Start here to get a quick win.
2. **General Notes textarea in ContactCard** -- Add the UI element with component state. No backend work needed for this step.
3. **Push-to-OneNote for general notes** -- New IPC handler + OneNote append function. Builds on existing COM API patterns.
4. **Clear-after-push + feedback toast** -- Polish that completes the scratchpad UX.
5. **Landing page update** -- Do last since it describes the finished features.

**Defer to v1.2 or later:**
- **Ctrl+Enter keyboard shortcut** for pushing notes (nice-to-have, low priority)
- **Note history** in the app (OneNote is the history; don't duplicate it)
- **Form I auto-fill** with agent/brokerage details from settings

---

## Complexity Assessment

| Feature | Estimated Effort | Risk Level | Notes |
|---------|-----------------|------------|-------|
| Form I template rewrite | ~30 min | None | Text-only change in forms.ts |
| General Notes textarea | ~1 hour | None | React state + textarea + styling |
| Push-to-OneNote | ~2-3 hours | Low | New COM script following existing pattern in onenote.ts |
| Clear + toast feedback | ~30 min | None | Copy existing followUpStatus pattern |
| Landing page update | ~1-2 hours | None | HTML edits in landing/ |
| **Total** | **~5-7 hours** | **Low** | Well within a single session |

---

## Sources

- **Codebase analysis** (HIGH confidence): Direct reading of `ContactCard.tsx` (694 lines), `onenote.ts` (344 lines), `forms.ts` (263 lines), `types.ts`, `contacts.ts`, `store.ts`, `preload/index.ts`
- **RERA Form I purpose**: [Sotheby's RERA Guide](https://sothebysrealty.ae/the-journal/a-guide-to-rera-forms-in-dubai/), [Bayut RERA Guide](https://www.bayut.com/mybayut/guide-rera-forms-dubai/), [Engel & Volkers RERA Guide](https://www.engelvoelkers.com/ae/en/resources/types-of-rera-forms-in-dubai-for-property-transactions), [Co-broke A2A Guide](https://co-broke.app/the-ultimate-guide-to-agent-to-agent-contract-form-i-in-dubai) (HIGH confidence -- multiple authoritative sources confirm Form I is agent-to-agent, not client-facing)
- **Commission split standards**: [Co-broke Commission Negotiation](https://co-broke.app/how-to-negotiate-agent-to-agent-commission-in-dubai), [ACASA Commission Guide](https://www.acasa.ae/blogs/real-estate-commissions-a-comprehensive-guide) (MEDIUM confidence -- standard market practice, varies by deal)
- **CRM note-taking patterns**: [iHomeFinder CRM Features 2026](https://www.ihomefinder.com/blog/agent-and-broker-resources/real-estate-crm-features-2026/), [OneNote CRM Integration](https://www.kizan.com/blog/onenotes-small-step-for-productivity-one-giant-leap-for-crm) (MEDIUM confidence -- general patterns, not specific to this tool's architecture)
- **PROJECT.md** (HIGH confidence): First-party validated requirements from David's experience at Allsopp & Allsopp and Paragon Properties
