# Feature Landscape

**Domain:** Real estate agent productivity toolkit (UAE/Dubai market, lettings + sales)
**Researched:** 2026-03-01
**Confidence note:** External research tools unavailable this session. Analysis draws from deep domain knowledge of UAE real estate workflows, the competitive productivity tool landscape, and the validated pain points documented in PROJECT.md. Confidence is MEDIUM-HIGH for table stakes (well-established patterns), MEDIUM for differentiators (market-specific, less externally verified).

---

## Research Context

This tool sits **alongside** a CRM — it does not replace it. The CRM handles pipeline management, activity logging, and deal tracking. This tool handles the repetitive micro-tasks agents do hundreds of times per week: dialling, messaging, note-taking, reminders, and viewing logistics.

**Dubai-specific context that shapes feature prioritization:**
- WhatsApp is the primary communication channel, not email or phone alone
- RERA (Real Estate Regulatory Agency) mandates specific forms (Form A, B, F) before any deal can proceed
- Agents work with a highly international client base — Arabic, Russian, Mandarin, English are common
- Cheque-based rent payments create document-heavy tenancy workflows
- Emirates ID is mandatory for all transactions
- Agents use personal phones (Samsung/iPhone), Windows PCs, and typically access multiple systems simultaneously

---

## Table Stakes

Features users expect. Missing = product feels incomplete or agents abandon it within days.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Click-to-dial | Manual dialling is the single most repeated friction point. Any productivity tool for agents that doesn't eliminate this fails immediately. | Low | Requires phone mirroring app (e.g., Samsung Link to Windows, Phone Link) or VoIP. The actual trigger is simple; the phone integration is the complexity. |
| Click-to-WhatsApp | Dubai agents live in WhatsApp. Opening a chat manually (copy number, open app, paste) adds 20–30 seconds per message. Multiply by 50 contacts/day. | Low | `https://wa.me/[number]` deep-link handles this. Desktop WhatsApp or phone — both work via this URL. |
| Message templates | Agents send near-identical messages constantly (viewing confirmations, follow-up after call, renewal reminders). Without templates, this is a daily time sink. | Low–Med | Templates need variable substitution (name, property, date). Must be easy for non-technical agents to edit. |
| Contact notes | Agents need a place to record qualifying info (budget, requirements, timeline) immediately after a call. Without this they rely on memory or scattered notepad files. | Med | OneNote integration is the chosen approach. Auto-create/find page per contact is the key behavior. |
| Follow-up reminders | The most common complaint from agents: "I forgot to call back." A 3-day/15-day/30-day system covers 90% of follow-up cadences in UAE real estate cycles. | Low–Med | Google Calendar integration. The value is in the one-click creation, not the calendar feature itself. |
| Days-since-last-call indicator | Without this, agents have no passive awareness of which contacts are going cold. It's a lightweight accountability mechanism. | Low | Calculated from last interaction timestamp. Needs a local store of call events or manual log. |
| Desktop widget / callback panel | Agents need their day's callbacks visible without opening another full application. A persistent panel is the "home base" for the tool. | Med | Always-on-top window. Must not obscure other work. Shows today's reminders and follow-ups. |
| Inbound caller recognition | When the phone rings, agents shouldn't have to search for who it is. This triggers the most immediate value moment. | Med | Requires phone mirroring integration to detect incoming calls and surface OneNote page. |
| Quick viewing booking | Creating a Google Calendar event and sending an invite is a routine task. Doing it from a contact card removes context switching. | Low–Med | Google Calendar API. Select contact, enter time and address, send invite. |
| Document checklist | Every transaction in UAE real estate has a mandatory document list (Emirates ID, tenancy contract, NOC, etc.). Agents forget items without a structured checklist. | Low | Configurable per transaction type (tenancy, sale, renewal). No backend needed — local state is fine. |

---

## Differentiators

Features that set this product apart. Not universally expected in productivity tools, but high value in this specific market.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Signable RERA forms (Form A, B, F) | RERA mandates signed forms before listings or offers can proceed. Agents currently print, scan, or use third-party tools (DocuSign etc. at cost). A built-in, correctly formatted version eliminates a workflow bottleneck unique to Dubai. | High | Web-based so clients can sign on any device. Must match RERA format exactly. Digital signatures need to be legally acceptable (UAE Electronic Transactions Law No. 1 of 2006 supports e-signatures). |
| OneNote integration with qualifying templates | Most note tools are generic. Templates pre-structured for tenant/landlord/buyer/seller/portfolio qualification turn a blank note into a structured briefing. Agents capture the right information every time. | Med | Auto-create OneNote page with template content populated. Five role types require five template variants. |
| Multi-role contact support | A contact can be both a landlord and a buyer. Generic CRMs force separate records. This tool treats one person's multiple roles as a unified view with adapted notes and templates. | Med | Tag-based role system. Determines which qualifying template is shown. Affects which message templates are available. |
| Route planner for viewings | UAE traffic is brutal. Agents booking multiple viewings in a day without optimizing order waste significant time. A route optimizer built into the booking flow is directly tied to daily productivity. | Med | Google Maps Directions API with waypoint optimization. Input: list of addresses. Output: optimal order + estimated time. |
| Email with WhatsApp follow-up | Sending an email and then WhatsApping the client "I just sent you an email — check your inbox" is standard Dubai agent behavior (clients miss emails). Automating this two-step in one click is a real time-saver. | Low–Med | Email send (SMTP/Gmail API) + WhatsApp deep-link triggered together. Simple workflow but uniquely valuable in this market. |
| Translation before sending | Dubai's client base is highly international. Agents who can draft in English and auto-translate to Arabic or Russian before sending serve their clients better. | Med | Integration with a translation API (DeepL or Google Translate). Applied to composed email/message content before send. |
| Real estate news feed | Curated UAE/Dubai property news gives agents talking points with clients and situational awareness about market conditions. Most tools don't include this. | Low–Med | RSS aggregation from Property Finder blog, Gulf News property, Khaleej Times real estate, DLD news. No scraping of portal listings — just editorial content. |
| Quick property notepad with OneNote push | Mid-call, agents need to capture property details fast (beds, price, location, condition). A structured notepad that formats and pushes to OneNote prevents lost information. | Low–Med | Local form with fields, one-click push to a designated OneNote section. |

---

## Anti-Features

Features to explicitly NOT build, with rationale.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| CRM replacement (pipeline, deals, leads) | Agents already have CRMs mandated by their agency. Competing with it creates IT approval friction, security reviews, and data migration headaches. It also enlarges scope massively. | Stay a satellite tool. Integrate with calendar and notes only — both are personal, not agency-controlled. |
| Call logging / activity tracking | This is exactly what CRMs do. Duplicating it creates two sources of truth, confusion, and double-entry. Agencies have compliance reasons for tracking in the CRM. | The days-since-call indicator is a lightweight proxy. Let CRM own the official log. |
| Data scraping from CRM or property portals | Portals (Property Finder, Bayut) prohibit scraping in ToS. CRM scraping creates security liability for agencies. This would make the tool un-deployable at real companies. | Agents manually input what they need. The tool doesn't pull data — it helps agents use data they already have. |
| Market data / area insights | This data would need portal APIs (restricted) or scraping (prohibited). It's also available natively in the portals agents already use. | Link out to DLD's official transaction data or Property Finder's area stats if needed. Don't build it. |
| Team dashboards / leaderboards | Requires multi-user data sharing, backend infrastructure, and agency-level administration. This is a v1 solo agent tool, not a team management platform. | Possible v2+ feature once the core tool has adoption and the team management need is validated. |
| Cheque / currency calculators | Simple arithmetic. Agents use their phone's calculator. Adding this adds complexity for zero differentiation. | Direct agents to existing calculator apps. |
| AI-generated listing descriptions | Tempting but out of scope. Agents have their own voice, listings go into portal systems this tool doesn't touch, and it increases complexity significantly. | Agents can use ChatGPT independently for this. |
| Built-in dialler (VoIP) | Building or integrating a full VoIP stack is a major infrastructure commitment. Dubai agents primarily use their personal mobile numbers — a VoIP call from a desktop is a step backward. | Click-to-dial triggers the agent's phone via phone mirroring (Samsung Link to Windows, Phone Link). The phone makes the call; the tool just initiates. |
| Client portal / self-service | A portal where clients upload documents or sign off on tasks is a separate product with its own user management, auth, and UX. | Keep signing to specific RERA forms via shared link. Don't build a general client portal. |
| Internal agency messaging / team chat | Agencies already use WhatsApp groups, Teams, or Slack internally. Another chat tool adds nothing. | This tool's messaging features are for agent-to-client communication only. |

---

## Feature Dependencies

```
Click-to-dial
  └── Phone mirroring app installed (Samsung Link to Windows or Phone Link) [external dependency]

Click-to-WhatsApp
  └── WhatsApp Desktop or phone accessible [external dependency, almost always true]

Inbound caller recognition
  └── Phone mirroring app installed (same dependency as click-to-dial)
  └── Contact notes (needs a contact to surface)

Contact notes (OneNote integration)
  └── OneNote account (personal Microsoft account or work M365)
  └── Multi-role contact support (roles determine which template is loaded)

Follow-up reminders
  └── Google Calendar account
  └── Desktop widget (reminders surface in the widget)

Desktop widget
  └── Follow-up reminders (data source)
  └── Days-since-last-call indicator (data source)

Quick viewing booking
  └── Google Calendar account (same as reminders)
  └── Route planner (natural pairing — book then plan route)

Route planner
  └── Google Maps API key [external dependency]
  └── Quick viewing booking (logical predecessor, though can work standalone)

Signable RERA forms
  └── Web hosting for form platform [separate from desktop app]
  └── E-signature mechanism (drawn signature or typed — not DocuSign dependency)

Email with WhatsApp follow-up
  └── Click-to-WhatsApp (reuses the same mechanism)
  └── Email configuration (SMTP or Gmail API)

Translation option
  └── Translation API key (DeepL or Google Translate) [external dependency]
  └── Email composing flow (translation applies pre-send)

Message templates
  └── Contact notes (name/role data feeds into template variable substitution)

Quick property notepad
  └── Contact notes / OneNote integration (pushes to same OneNote structure)

Document checklist
  └── Multi-role contact support (checklist varies by transaction type)

Real estate news feed
  └── RSS sources (DLD, Property Finder blog, Gulf News property) [external, editorial not scraped]

Days-since-last-call indicator
  └── Local event store (lightweight — could be a simple JSON log of call timestamps)
```

---

## MVP Recommendation

**Core loop that proves value in week one:**

1. **Click-to-dial** — Immediate daily value. Proves the tool in the first hour of use.
2. **Click-to-WhatsApp** — Equally immediate. Used more than dialling in Dubai.
3. **Message templates** — First compound value: calling + messaging with templates is a full communication workflow.
4. **Contact notes with OneNote integration** — Qualifies leads, stores information, works with multi-role.
5. **Follow-up reminders (3/15/30 day)** — Closes the loop: contact, message, follow up.
6. **Desktop widget** — Makes the above visible and accessible without opening separate apps.

**Second tier (high value, slightly more build):**

7. **Inbound caller recognition** — Reactive companion to click-to-dial.
8. **Multi-role contact support** — Enables the templates and notes to adapt properly.
9. **Quick viewing booking** — Rounds out the daily workflow.
10. **Document checklist** — Low complexity, high perceived professionalism.

**Defer to v2 or later:**

- **Signable RERA forms** — High complexity, separate web platform needed, legal verification required. Validate core tool first.
- **Route planner** — Google Maps API integration adds setup cost. Valuable but not day-one critical.
- **Translation** — API key management, polished UX needed. Nice to have.
- **Real estate news feed** — Low complexity but adds surface area. Fine for early release, not MVP.
- **Email with WhatsApp follow-up** — Email integration (OAuth, SMTP config) adds onboarding friction. WhatsApp alone covers most Dubai communication.
- **Quick property notepad** — Useful but overlaps with contact notes. Defer until note-taking workflow is proven.

---

## Sources

- Domain knowledge: UAE/Dubai real estate workflows, RERA regulatory context, WhatsApp communication norms in the Gulf market (MEDIUM confidence — well-established market patterns, unverified externally this session)
- Project context: PROJECT.md pain points validated from Allsopp & Allsopp experience (HIGH confidence — first-party validated)
- UAE Electronic Transactions and Commerce Law No. 1 of 2006 — e-signature legal basis (MEDIUM confidence — well-established, recommend legal verification before shipping signable forms)
- Google Maps Waypoint Optimization API — available and supports address ordering (HIGH confidence — stable Google API, widely documented)
- WhatsApp deep-link format (wa.me) — stable, documented by Meta (HIGH confidence)
- External research tools unavailable this session; G2, Capterra, and competitor feature lists not consulted. Recommend verifying table stakes assumptions against Property Finder, Bayut, and agency-specific tools in a follow-up research pass.
