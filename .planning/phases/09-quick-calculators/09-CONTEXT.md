# Phase 9: Quick Calculators - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Agent can run UAE-specific financial calculations (mortgage, commission split, ROI/yield, DLD costs) during or after client calls. Every calculator displays effective dates, source references, and an "estimates only" disclaimer. Agent can copy a formatted calculation summary for pasting into WhatsApp.

</domain>

<decisions>
## Implementation Decisions

### Calculator Navigation
- New Calculator icon in title bar, positioned after MapPin: Keyboard > BookOpen > MapPin > Calculator > Mic > Settings
- Opens a dedicated calculator view (new `View` type: `'calculators'`)
- Horizontal tab bar at top for 4 calculators: Mortgage | Commission | ROI/Yield | DLD Costs
- Each calculator is its own tab — DLD Costs is a standalone tab (not nested inside Mortgage)
- State retained across tab switches — switching tabs preserves all inputs
- Session-only calculation history at bottom of each tab (lost on app close, aligns with zero-data philosophy)

### Mortgage Calculator
- Text fields only (no sliders) — AED amounts, percentages, years
- Live calculation — results update instantly as agent types (no Calculate button)
- Pre-filled defaults: 4.99% interest rate (UAE bank average), 25-year term (UAE Central Bank max)
- Resident/Non-resident toggle with full UAE Central Bank LTV rules:
  - Resident 1st property <5M: 80% LTV (20% down)
  - Resident 1st property >5M: 70% LTV (30% down)
  - Resident 2nd+ property: 65% LTV (35% down)
  - Non-resident: 50% LTV (50% down)
- Down payment auto-adjusts when toggling resident/non-resident (agent can still override higher)
- Summary output only (monthly payment, total repayment, total interest, LTV applied) — no amortization schedule
- Claude's Discretion: whether to use a single resident/non-resident toggle or add a separate first/second property toggle

### Commission Split Calculator
- Agent-to-agent split model: property price, commission rate %, listing agent %, buyer's agent %
- Default commission rate: 2% (standard Dubai)
- VAT (5%) shown as separate line item below commission amounts — ex-VAT breakdown then total incl. VAT
- Shows AED amounts for total commission, each agent's share, and VAT

### ROI/Yield Calculator
- Inputs: purchase price, annual rental income, annual service charge, annual maintenance
- Outputs: gross yield, net yield, monthly net income
- All amounts in AED with live calculation

### DLD Cost Calculator
- Full fee breakdown: DLD transfer fee (4% total, no buyer/seller split), DLD admin fee, trustee fee, mortgage registration (if applicable), agency fee
- Property type toggle: Apartment / Land / Villa — affects admin fee (AED 580 apartments, AED 430 land)
- Mortgage toggle: shows/hides mortgage registration fee (0.25%) line
- Trustee fee auto-calculated based on price: AED 2,000 (<500K) or AED 4,000 (>500K) + VAT
- Agency fee editable, default 2%
- Shows total costs and total to close (property price + all costs)

### Rate Data & Attribution
- All rates hardcoded in `shared/calculator-rates.ts` with version bumps when rates change (no external API)
- Each rate entry includes: value, source name, effective date, verify URL
- Inline source attribution next to each rate in the UI: source name + effective date
- Color-coded freshness indicator: green (<6 months), amber (6-12 months), red (>12 months)
- External "Verify" link per rate opens official source website in browser
- When agent overrides an editable rate (interest rate, agency fee), source note changes to "Custom value (default: X%)"
- Interest rate source: "Average UAE variable mortgage rate" (no specific bank reference)

### Results & Copy Format
- "Copy to WhatsApp" button with editable preview (reuses AreaSharePreview pattern from Phase 8)
- Copy text is client-friendly: key numbers + "Estimate only" disclaimer — NO source references in copy text (sources are for agent's in-app reference only)
- Always-visible disclaimer footer on every calculator: "Estimates only. Rates effective [date]. Final terms subject to bank/DLD approval."
- Results update live as agent types

### Claude's Discretion
- Reset/clear button per tab (whether to include and placement)
- Exact tab styling and active tab indicator
- Session history UI (list placement, item format, max items)
- Number formatting details (thousand separators, decimal places)
- Input validation approach (min/max values, empty state handling)

</decisions>

<specifics>
## Specific Ideas

- Tab bar mockup: `[Mortgage] [Commission] [ROI/Yield] [DLD Costs]` — horizontal, same visual weight
- Mortgage copy text format: property price, down payment (% and AED), loan amount, rate + term, monthly payment, total repayment, then italic disclaimer
- DLD copy text should show the full cost breakdown as a clean list
- Commission copy should show both agents' shares clearly
- User emphasized: "make sure percentages etc are clear and where they have been pulled from and on which date" — every hardcoded rate must have visible attribution

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AreaSharePreview.tsx`: WhatsApp share with editable preview — reuse for calculator copy-to-WhatsApp
- `AreaGuidesView.tsx`: Closest pattern for a dedicated reference view with internal navigation
- `TitleBar` component in `App.tsx`: Icon button pattern for title bar nav (lucide-react icons)
- Dark theme tokens: `#0d0d0e` (bg), `#161617` (card), `#ededee` (text), `#a1a1aa` (muted), `#818cf8` (accent)

### Established Patterns
- View routing: `View` type union in App.tsx, each view renders inside `TitleBar` + scrollable container
- Views receive `onBack` prop for navigation
- Data bundled in `shared/` directory (e.g., `shared/area-guides.ts`) — calculator rates should follow same pattern
- No external API calls — all data local and bundled
- Frameless window with custom title bar

### Integration Points
- `App.tsx` line 18: Add `'calculators'` to `View` type union
- `App.tsx` line 718-719: Add Calculator icon button in title bar (after MapPin, before Mic)
- New view block in App.tsx (follows area-guides pattern at lines 655-664)
- New `shared/calculator-rates.ts` for rate data
- New `CalculatorsView.tsx` component with internal tab state

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-quick-calculators*
*Context gathered: 2026-03-07*
