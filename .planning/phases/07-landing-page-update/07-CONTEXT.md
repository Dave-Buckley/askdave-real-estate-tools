# Phase 7: Landing Page Update - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning
**Source:** Conversation with user

<domain>
## Phase Boundary

Update the landing page (landing/index.html) to accurately reflect the full v1.1 feature set. The landing page currently describes v1.0 features. Phase 7 adds General Notes and Form I descriptions, trims the area guides section to a brief mention, and ensures all feature descriptions match the shipped product.

</domain>

<decisions>
## Implementation Decisions

### General Notes Feature Section
- Add a section describing the General Notes feature (ephemeral notes pushed to OneNote)
- Emphasize the privacy angle: no local persistence, OneNote is single source of truth
- Mention one-click push workflow

### Form I / Agent Collaboration Section
- Mention agent-to-agent collaboration tools (Form I commission split agreement)
- Position as a professional workflow tool, not client-facing

### Area Guides Section
- TRIM the existing full area guides section (10 community profiles) to a brief feature mention
- The full area guide content belongs IN THE APP, not on the landing page
- Landing page should just callout "Built-in Dubai Area Guides" as a feature — not host the guide itself
- The detailed area guide data will be used in a future in-app feature (cross-comparison tool)

### Quick Calculators (mention only)
- If calculators are added to the app before landing page ships, mention them
- Otherwise skip — don't advertise features that don't exist yet

### Claude's Discretion
- Section ordering and layout within the existing page structure
- Copywriting tone (match existing page style)
- Whether to update screenshots (user needs to provide new ones)
- How to handle the trimmed area guides section (remove entirely vs. compact feature card)

</decisions>

<specifics>
## Specific Ideas

- Area guides should be mentioned as a feature but NOT include full community profiles on the landing page
- The app should look like "a pro made it" — landing page must match that quality bar
- landing/ and docs/ must stay in sync
- Email-gated downloads (not free distribution) — existing download flow should be preserved

</specifics>

<deferred>
## Deferred Ideas

- In-app Area Guides with cross-comparison (future milestone)
- Quick Calculators with effective date + source reference (future milestone)
- New screenshots for transcriber views (blocked on manual screenshot capture)

</deferred>

---

*Phase: 07-landing-page-update*
*Context gathered: 2026-03-06 via conversation*
