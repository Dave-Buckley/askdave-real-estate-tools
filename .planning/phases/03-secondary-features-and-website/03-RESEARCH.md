# Phase 3: Secondary Features and Website - Research

**Researched:** 2026-03-03
**Domain:** Electron app features (document checklists, RSS news feed) + static website hosting + GitHub Releases distribution
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Tick behavior:** Tick + timestamp — record when each document was received (ISO timestamp), not just boolean
- **Website scope:** Polish + download links only — existing 4 HTML pages (index, overview, how-it-works, setup-guide) are fine
- **Custom domain:** Deferred — set up hosting now, custom domain added later

### Claude's Discretion
- UAE transaction document lists (research standard sets) — RESEARCHED BELOW
- RSS feed source selection — RESEARCHED BELOW
- News feed UI location and interaction pattern — RESEARCHED BELOW
- Checklist UI placement (ContactCard section vs separate panel) — RESEARCHED BELOW
- Checklist customizability (fixed vs editable) — RESEARCHED BELOW
- News refresh interval and notification approach — RESEARCHED BELOW
- Hosting platform selection (site + installers) — RESEARCHED BELOW

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORG-03 | Agent can view and tick off a document checklist per client, configured by transaction type (tenancy, sale, renewal) | UAE document sets researched; Contact type extension, electron-store persistence, ContactCard UI integration patterns identified |
| NEWS-01 | App displays a curated feed of UAE real estate news aggregated from key industry RSS sources | Verified live RSS feeds found; main-process fetch + rss-parser pattern identified; UI placement and refresh strategy defined |
| WEB-01 | A simple instruction/marketing website explains the tool's features, shows how to install it, and provides download links | GitHub Pages for site hosting, GitHub Releases for installer hosting — both verified; exact URL patterns documented |
</phase_requirements>

---

## Summary

Phase 3 delivers three independent deliverables that share no dependencies with each other: a document checklist for client transactions (ORG-03), a UAE real estate news feed (NEWS-01), and the public website with download links (WEB-01). All three are straightforward to implement given the existing app architecture.

The document checklist extends the `Contact` interface with per-contact checklist state (keyed by transaction type), persisted via the existing `electron-store`. UAE standard document sets have been researched and are well-defined by RERA and DLD — the data model can be defined statically in code. Checklist UI lives inside ContactCard as a collapsible section, gated by a `checklistEnabled` feature toggle.

The news feed fetches RSS XML in the Electron main process (using Node 20's built-in `fetch` + `rss-parser`) on a background timer, caches parsed items in memory, and exposes them via IPC. Three confirmed, publicly accessible UAE real estate RSS feeds exist. The panel gets a tab or secondary view with a simple article list; clicking opens articles in the system browser.

The website needs minimal changes: add working download button URLs pointing to GitHub Releases assets, and deploy the existing 4 HTML files to GitHub Pages. GitHub Releases hosts the .exe and .dmg binary installers — this is the industry-standard approach and integrates directly with `electron-builder`'s existing publish configuration.

**Primary recommendation:** Use GitHub Releases for installer hosting and GitHub Pages for the static site. Use `rss-parser` in the main process with a 30-minute background refresh. Fixed (non-editable) document checklists per transaction type, stored as per-contact state in electron-store.

---

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| rss-parser | 3.13.0 | Parse RSS/Atom XML feeds into JS objects | Lightweight (no native deps), works in Node.js main process, handles malformed XML gracefully, 439+ projects use it |

### No New Infrastructure

| Feature | Approach | Why |
|---------|---------|-----|
| HTTP fetch for RSS | Node 20 built-in `fetch` (global) | Electron 34 ships Node 20.18.1 which has stable global fetch — no extra dependency needed |
| Checklist persistence | Existing `electron-store` | Already in place; just extend Contact interface with checklist fields |
| Website hosting | GitHub Pages (free) | Simplest free static hosting; push HTML to gh-pages branch and it's live |
| Installer hosting | GitHub Releases (free) | Industry standard for distributing .exe and .dmg; integrates with electron-builder; no file size restrictions for binaries |
| XML parsing | rss-parser wraps xml2js | Purpose-built for RSS; handles Atom + RSS 2.0; returns clean JS objects |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rss-parser | fast-xml-parser + manual RSS shaping | fast-xml-parser has no deps and is smaller, but you'd need to write RSS-specific normalization; rss-parser is purpose-built |
| GitHub Pages | Netlify | Netlify adds CI/CD complexity not needed for 4 static HTML files; GitHub Pages is simpler when code already lives on GitHub |
| GitHub Releases | S3 / Cloudflare R2 | Releases is free, integrated with electron-builder's publish system, no extra accounts needed |

**Installation:**
```bash
npm install rss-parser
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── main/
│   ├── news.ts           # RSS fetch, parse, cache, timer — new file
│   ├── ipc.ts            # Add: news:fetch, checklist:save handlers
│   └── store.ts          # Add: checklistEnabled, newsEnabled defaults; checklist data in contacts
├── shared/
│   └── types.ts          # Add: ChecklistItem, ChecklistState, TransactionChecklist
└── renderer/
    └── panel/
        └── components/
            ├── ContactCard.tsx   # Add: checklist section (collapsible)
            └── NewsFeed.tsx      # New component: article list view
```

```
landing/          # Existing 4 HTML files — no restructure needed
```

### Pattern 1: RSS Fetch in Main Process via IPC

**What:** Main process polls RSS feeds on a background timer, stores parsed items in memory, responds to renderer fetch requests via `ipcMain.handle`.
**When to use:** Any network request in Electron — keeps renderer isolated from network, avoids CORS, follows Electron security model.

```typescript
// src/main/news.ts
import Parser from 'rss-parser'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

const parser = new Parser()
let cachedItems: NewsItem[] = []
let lastFetched: number = 0

const FEEDS = [
  { url: 'https://propertynews.ae/feed/', source: 'PropertyNews.ae' },
  { url: 'http://www.arabianbusiness.com/feed', source: 'Arabian Business' },
  { url: 'https://www.zawya.com/rss/real-estate', source: 'Zawya' }
]

export async function fetchNews(): Promise<NewsItem[]> {
  const results: NewsItem[] = []
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 10)) {
        results.push({
          title: item.title ?? '',
          link: item.link ?? '',
          pubDate: item.pubDate ?? '',
          source: feed.source
        })
      }
    } catch (err) {
      console.error(`Failed to fetch ${feed.source}:`, err)
      // Continue with other feeds — partial results are OK
    }
  }
  cachedItems = results.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  )
  lastFetched = Date.now()
  return cachedItems
}

export function getCachedNews(): NewsItem[] { return cachedItems }
export function getLastFetched(): number { return lastFetched }
```

### Pattern 2: Background Timer with setInterval

**What:** Start a timer on app launch to refresh news in background.
**When to use:** Periodic background tasks in Electron main process.

```typescript
// In src/main/index.ts (app.whenReady callback)
import { fetchNews } from './news'

const NEWS_REFRESH_INTERVAL_MS = 30 * 60 * 1000  // 30 minutes

app.whenReady().then(async () => {
  // ... existing setup ...

  if (store.get('newsEnabled')) {
    fetchNews().catch(console.error)  // initial fetch
    setInterval(() => {
      if (store.get('newsEnabled')) fetchNews().catch(console.error)
    }, NEWS_REFRESH_INTERVAL_MS)
  }
})
```

### Pattern 3: Document Checklist Data Model

**What:** Extend Contact with per-transaction checklist state; define static checklists in shared data file.
**When to use:** Feature that needs per-contact persistence without a separate DB.

```typescript
// In src/shared/types.ts additions

export type TransactionType = 'tenancy' | 'sale' | 'renewal' | 'off-plan'

export interface ChecklistItem {
  id: string          // e.g., 'tenant-emirates-id'
  label: string       // e.g., 'Emirates ID (tenant)'
  receivedAt?: string // ISO timestamp when ticked, undefined = not ticked
}

export interface ContactChecklist {
  transactionType: TransactionType
  items: ChecklistItem[]
  updatedAt: string
}

// Extend Contact interface:
// checklist?: ContactChecklist
```

```typescript
// src/shared/checklists.ts — static definition of UAE document sets
export const TRANSACTION_CHECKLISTS: Record<TransactionType, { id: string; label: string }[]> = {
  tenancy: [
    { id: 'tenant-passport', label: 'Tenant passport copy' },
    { id: 'tenant-emirates-id', label: 'Tenant Emirates ID' },
    { id: 'tenant-visa', label: 'Tenant UAE residence visa' },
    { id: 'landlord-passport', label: 'Landlord passport copy' },
    { id: 'landlord-emirates-id', label: 'Landlord Emirates ID' },
    { id: 'title-deed', label: 'Title deed' },
    { id: 'dewa-number', label: 'DEWA premise number' },
    { id: 'signed-contract', label: 'Signed tenancy contract' },
    { id: 'form-a', label: 'Form A (listing agreement)' },
  ],
  renewal: [
    { id: 'renewed-contract', label: 'Renewed tenancy contract' },
    { id: 'prev-ejari', label: 'Previous Ejari certificate' },
    { id: 'tenant-emirates-id', label: 'Tenant Emirates ID' },
    { id: 'landlord-passport', label: 'Landlord passport copy' },
    { id: 'dewa-number', label: 'DEWA premise number' },
  ],
  sale: [
    { id: 'seller-passport', label: 'Seller passport copy' },
    { id: 'seller-emirates-id', label: 'Seller Emirates ID' },
    { id: 'buyer-passport', label: 'Buyer passport copy' },
    { id: 'buyer-emirates-id', label: 'Buyer Emirates ID' },
    { id: 'title-deed', label: 'Title deed (original)' },
    { id: 'form-a', label: 'Form A (listing agreement)' },
    { id: 'form-b', label: 'Form B (buyer agreement)' },
    { id: 'form-f', label: 'Form F / MOU (signed)' },
    { id: 'noc-developer', label: 'NOC from developer' },
    { id: 'no-liability', label: 'Mortgage liability letter (if applicable)' },
  ],
  'off-plan': [
    { id: 'buyer-passport', label: 'Buyer passport copy' },
    { id: 'buyer-emirates-id', label: 'Buyer Emirates ID' },
    { id: 'spa', label: 'Sales and Purchase Agreement (SPA)' },
    { id: 'payment-receipts', label: 'Payment receipts to escrow' },
    { id: 'oqood', label: 'Oqood certificate' },
    { id: 'noc-developer', label: 'NOC from developer (resale)' },
    { id: 'poa', label: 'Power of Attorney (if representative)' },
  ]
}
```

### Pattern 4: GitHub Pages Deployment

**What:** Host static HTML directly from a GitHub repository branch.
**When to use:** Simple marketing/documentation sites with no build step.

Steps:
1. Create a GitHub repository (or use the existing project repo)
2. Push the `landing/` directory contents to a `gh-pages` branch (or set source to `landing/` folder on main)
3. Enable GitHub Pages in repo Settings → Pages → Source: Deploy from branch
4. Site is live at `https://USERNAME.github.io/REPO` within ~1 minute

### Pattern 5: GitHub Releases Installer Hosting

**What:** Upload .exe and .dmg binaries as release assets on GitHub.
**When to use:** Distributing Electron app installers — the standard approach.

```js
// electron-builder.config.js — enable publish
module.exports = {
  // ... existing config ...
  publish: {
    provider: 'github',
    owner: 'GITHUB_USERNAME',
    repo: 'REPO_NAME',
    releaseType: 'release'   // 'draft' during testing, 'release' for production
  }
}
```

Download URLs after publish follow the pattern:
```
https://github.com/OWNER/REPO/releases/download/v1.0.0/Agent-Kit-Setup-1.0.0.exe
https://github.com/OWNER/REPO/releases/download/v1.0.0/Agent-Kit-1.0.0.dmg
```

These URLs go directly into the landing page download buttons.

### Anti-Patterns to Avoid

- **Fetching RSS in the renderer process:** CORS restrictions will block cross-origin RSS feeds. Always fetch in main process and pass data via IPC.
- **Storing news items in electron-store:** News is ephemeral — cached in memory only. Persisting to disk wastes space and slows startup.
- **Using GitHub Pages to host installer binaries:** GitHub Pages has a 1 GB repository limit and 100 MB per-file limit; installer files can be 80-200 MB and must go to GitHub Releases instead.
- **Fixed transaction type at contact creation:** Agents switch transaction types during a deal. The UI must allow selecting/changing transaction type after initial setup.
- **Rebuilding checklists on every render:** Generate the checklist items array once when type is set; merge with saved timestamps from Contact state.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RSS XML parsing | Custom XML parser | `rss-parser` npm package | RSS has many quirks (CDATA, Atom vs RSS 2.0, date formats); rss-parser handles all of them |
| HTTP fetch for news | electron-fetch or node-fetch | Node 20 built-in `global.fetch` | Already available in Electron 34's Node 20.18.1 runtime; no extra dependency |
| Installer hosting | Custom file server, Netlify Large Files, S3 | GitHub Releases | Already integrated with electron-builder; free; CDN-backed download URLs |
| Static site hosting | Custom VPS, paid hosting | GitHub Pages | Free, zero config, deploys on git push |

**Key insight:** All the infrastructure needed already exists — the app already uses electron-store, IPC, and electron-builder. Phase 3 is plumbing and UI work, not infrastructure.

---

## Common Pitfalls

### Pitfall 1: RSS Feed CORS in Renderer
**What goes wrong:** Attempting to fetch RSS URLs directly from a renderer `fetch()` call fails silently or with CORS error.
**Why it happens:** Renderer runs in a browser-like context with CORS enforcement; external RSS servers don't send `Access-Control-Allow-Origin: *`.
**How to avoid:** All RSS fetching goes in `src/main/news.ts` and is exposed via `ipcMain.handle('news:fetch')`. Never call RSS URLs from renderer code.
**Warning signs:** Network errors or empty responses when testing news feature.

### Pitfall 2: rss-parser Feed URL Variance
**What goes wrong:** Some feeds return HTTP 301/302 redirects, others use HTTPS, some require User-Agent headers.
**Why it happens:** News sites rotate URLs and occasionally require identity headers to prevent scraping.
**How to avoid:** Configure rss-parser with a custom User-Agent: `new Parser({ headers: { 'User-Agent': 'AgentKit/1.0' } })`. Wrap each feed fetch in try/catch — failure of one feed shouldn't break others.
**Warning signs:** One feed works but others timeout or return 403.

### Pitfall 3: Checklist State Divergence
**What goes wrong:** Checklist definition changes in code (e.g., new document added to tenancy list) but existing contact's saved checklist is missing the new item.
**Why it happens:** Saved checklist items in electron-store are snapshots of a prior version of `TRANSACTION_CHECKLISTS`.
**How to avoid:** At render time, merge the static list with saved state — use static list as the source of truth for IDs and labels, look up timestamps from saved state by ID. New items appear unchecked; removed items are silently dropped.
**Warning signs:** Missing checklist items after app update.

### Pitfall 4: GitHub Pages Deploying Wrong Folder
**What goes wrong:** Site deploys but shows README.md or a file listing instead of the landing page.
**Why it happens:** GitHub Pages source is set to repo root but `index.html` is inside `landing/` subfolder.
**How to avoid:** Either set Pages source to the `landing/` directory (GitHub supports this on the `main` branch), or copy landing files to repo root. If the project repo isn't suitable for a public GH Pages site, create a separate `agentkit-site` repository.
**Warning signs:** Site URL shows a directory listing or 404.

### Pitfall 5: Installer URLs Break After Version Bump
**What goes wrong:** Download buttons on landing page point to `v1.0.0` assets; after releasing `v1.1.0`, buttons still link to the old version.
**Why it happens:** Hardcoded version numbers in HTML.
**How to avoid:** GitHub Releases supports a "latest release" redirect pattern. Download links should point to `releases/latest/download/FILENAME` which always serves the latest release's matching asset. Use the `/releases/latest/download/` URL pattern in landing page buttons.
**Warning signs:** Download buttons serve old installer after a new release.

Correct URL pattern:
```
https://github.com/OWNER/REPO/releases/latest/download/Agent-Kit-Setup-1.0.0.exe
```
Note: the filename in the URL must match the asset name exactly, which includes the version. Use a generic asset naming convention in electron-builder so the filename is predictable.

### Pitfall 6: News Panel Layout Overflow
**What goes wrong:** News feed renders as a long list, pushing the contact card and templates off screen in the panel.
**Why it happens:** Panel is a fixed-size window (~300px wide, ~500px tall); adding a long list without scroll containment breaks layout.
**How to avoid:** News view is a separate `view` state (like `hotkeys` view) — it replaces the main view, not stacks on top of it. The news list scrolls internally within a `flex-1 overflow-y-auto` container.
**Warning signs:** Panel extends beyond screen edges or contact card is not visible.

---

## Code Examples

### Registering News IPC Handler

```typescript
// In src/main/ipc.ts — add to registerIPCHandlers()
import { fetchNews, getCachedNews, getLastFetched } from './news'

ipcMain.handle('news:get', async () => {
  // Return cached if fresh (< 30 min old); else fetch
  const STALE_MS = 30 * 60 * 1000
  if (Date.now() - getLastFetched() < STALE_MS && getCachedNews().length > 0) {
    return { items: getCachedNews(), lastFetched: getLastFetched() }
  }
  const items = await fetchNews()
  return { items, lastFetched: getLastFetched() }
})
```

### Checklist IPC Handler

```typescript
// In src/main/ipc.ts — add to registerIPCHandlers()
ipcMain.handle('checklist:save', (_event, e164: string, checklist: ContactChecklist) => {
  upsertContact(e164, { checklist })
})

ipcMain.handle('checklist:get', (_event, e164: string) => {
  const contact = getContact(e164)
  return contact?.checklist ?? null
})
```

### Extending Contact Type

```typescript
// src/shared/types.ts additions
export type TransactionType = 'tenancy' | 'sale' | 'renewal' | 'off-plan'

export interface ChecklistItem {
  id: string
  label: string
  receivedAt?: string  // ISO timestamp when ticked; undefined = not yet received
}

export interface ContactChecklist {
  transactionType: TransactionType
  items: ChecklistItem[]
  updatedAt: string
}

// Add to Contact interface:
// checklist?: ContactChecklist
```

### Ticking a Document

```typescript
// In ChecklistSection component — tick handler
const handleTick = (itemId: string, currentlyTicked: boolean) => {
  const now = new Date().toISOString()
  const updated = items.map(item =>
    item.id === itemId
      ? { ...item, receivedAt: currentlyTicked ? undefined : now }
      : item
  )
  setItems(updated)
  window.electronAPI.saveChecklist(e164, {
    transactionType,
    items: updated,
    updatedAt: now
  })
}
```

### GitHub Pages Download Button (Latest Release)

```html
<!-- In landing/index.html — download buttons -->
<a href="https://github.com/OWNER/REPO/releases/latest/download/Agent-Kit-Setup.exe"
   class="btn-download btn-windows">
  Download for Windows
</a>
<a href="https://github.com/OWNER/REPO/releases/latest/download/Agent-Kit.dmg"
   class="btn-download btn-mac">
  Download for macOS
</a>
```

Note: The `/releases/latest/download/FILENAME` pattern works only when the asset filename is consistent across releases. Configure electron-builder's `artifactName` to use a fixed name without version number, or accept that the URL must be updated with each release.

---

## UAE Real Estate Document Sets (Research Findings)

These document lists are the output of research into RERA, DLD, and Ejari requirements. They define the static checklist data.

### Tenancy (New Ejari Registration)

Sources: Ejari.ae, aaronz.co 2026 guide, bayut.com Ejari guide

**Tenant must provide:**
- Passport copy
- UAE residence visa copy
- Emirates ID (front and back)
- Signed tenancy contract

**Landlord must provide:**
- Passport copy
- Emirates ID (if UAE resident)
- Title deed

**Agent collects:**
- DEWA premise number / Ejari number
- Signed tenancy contract (both parties)
- Form A (listing agreement, for RERA compliance)

### Renewal

Sources: Ejari.ae, betterhomes renewal guide 2024

- Renewed tenancy contract (signed by both parties)
- Previous Ejari certificate
- Tenant Emirates ID + passport
- Landlord passport
- DEWA premise number (must match original registration)

### Sale / Transfer (DLD Trustee)

Sources: DLD official, dda-realestate.com RERA forms guide, sellpropertyfast.ae

- Seller passport + Emirates ID
- Buyer passport + Emirates ID
- Title deed (original, or bank release if mortgaged)
- Form A (listing agreement, signed by seller)
- Form B (buyer agreement, signed by buyer)
- Form F / MOU (Contract of Sale, signed by both)
- NOC from developer (confirms no outstanding service charges)
- Mortgage liability letter + clearance (if property is mortgaged)
- Power of Attorney (if representative attending, notarized and attested)

### Off-Plan Purchase

Sources: egsh.ae Oqood guide, danubeproperties.com documents guide, DLD

- Buyer passport + Emirates ID
- Sales and Purchase Agreement (SPA)
- Payment receipts to developer escrow account
- Oqood registration certificate
- NOC from developer (for resale; requires ~30-40% payment made)
- Power of Attorney (if representative)

**Confidence:** MEDIUM — sourced from multiple real estate brokerage and legal guides, cross-referenced. Requirements can vary slightly by developer and specific transaction circumstances. The lists above represent the most common requirements.

---

## UAE RSS Feed Sources (Research Findings)

Verified live RSS feeds — tested directly:

| Source | Feed URL | Coverage | Status |
|--------|----------|----------|--------|
| PropertyNews.ae | `https://propertynews.ae/feed/` | Dubai, Abu Dhabi, UAE property news | VERIFIED LIVE — RSS 2.0, updated Mar 2, 2026 |
| Arabian Business | `http://www.arabianbusiness.com/feed` | Middle East business + real estate | VERIFIED LIVE — RSS 2.0, includes property news |

Unverified (need live testing):

| Source | Possible Feed URL | Notes |
|--------|------------------|-------|
| Zawya | `https://www.zawya.com/rss/real-estate` | Business news, known RSS provider — needs verification |
| Gulf News Property | `https://gulfnews.com/rss/property` | No RSS found in page source — needs testing |
| Khaleej Times Property | `https://www.khaleejtimes.com/rss` | General KT feed exists; property-specific URL unverified |

**Recommendation:** Start with the 2 verified feeds (PropertyNews.ae + Arabian Business). Add Zawya after verifying it returns real estate content. Three feeds providing 30 articles total gives sufficient news variety without overwhelming the UI.

**Refresh interval recommendation:** 30 minutes — sufficient freshness for industry news that publishes 5-10 articles per day. Respects the news sites' servers without hammering them.

**Notification recommendation:** No unread badges or notification count. News is ambient/passive — agents glance at it when they have a moment. Adding unread counts adds complexity for marginal value.

---

## Hosting Decisions

### Website: GitHub Pages

**Verdict:** GitHub Pages is the correct choice.

- Project already on GitHub (confirmed from git history)
- Zero configuration: push HTML to `gh-pages` branch → live within 1 minute
- Free tier: 1 GB site size, 100 GB/month bandwidth — far more than needed for 4 HTML pages
- URL format: `https://USERNAME.github.io/REPO` (custom domain deferred per user decision)
- No build step needed: the existing `landing/` HTML files work as-is

**Deployment process:**
1. Create `gh-pages` branch in project repo
2. Copy `landing/` contents to branch root (or configure Pages to serve from `landing/` on main)
3. Enable GitHub Pages in repo Settings
4. Update download button `href` values to GitHub Releases URLs

### Installer Files: GitHub Releases

**Verdict:** GitHub Releases is the correct choice.

- electron-builder already has GitHub Releases publish support (`publish.provider: 'github'`)
- Existing `electron-builder.config.js` already has `publish: null` — just update to `provider: 'github'`
- `.exe` and `.dmg` installers are 80-200 MB — GitHub Releases handles large files, GitHub Pages does not
- Download URLs follow a predictable, stable pattern
- `GH_TOKEN` environment variable is the only prerequisite (personal access token with `repo` scope)

**For v1.0.0 release:**
1. Set `publish` in `electron-builder.config.js` to GitHub provider
2. Run `GH_TOKEN=xxx npm run build:win` and `GH_TOKEN=xxx npm run build:mac`
3. electron-builder creates the GitHub release and uploads assets automatically
4. Copy resulting asset URLs into landing page download buttons

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| node-fetch for HTTP in Electron | Node 20 built-in `global.fetch` | No extra dependency; fetch is available globally in Electron 34 |
| XML2JS manual RSS parsing | rss-parser (wraps xml2js with RSS normalization) | Handles Atom + RSS 2.0, dates, CDATA automatically |
| FTP / manual upload for installer hosting | GitHub Releases via electron-builder CI | One command publishes + uploads + generates update metadata |
| Netlify for simple static sites | GitHub Pages (when repo is already on GitHub) | No new account or service needed |

---

## Open Questions

1. **GitHub repository visibility — public or private?**
   - What we know: GitHub Pages on free accounts requires the repository to be public (or a Pro plan for private repo Pages)
   - What's unclear: Is the project repo currently public or private? If private, either make public or use a separate `agentkit-site` public repo for the landing pages
   - Recommendation: Decide before starting website task. If the main repo contains anything sensitive (auth credentials in history, etc.), use a separate public repo for the site.

2. **electron-builder artifact naming convention**
   - What we know: Default artifact names include the version (e.g., `Agent-Kit-Setup-1.0.0.exe`), which means the download URL changes with each release
   - What's unclear: Does David want to use the `/releases/latest/download/` URL pattern (requires consistent artifact name) or accept updating download button URLs with each release?
   - Recommendation: Configure `artifactName` in electron-builder to a consistent name like `Agent-Kit-Setup.exe` / `Agent-Kit.dmg`. Set download buttons to point to `/releases/latest/download/` URLs so they auto-update.

3. **Zawya RSS feed — real estate category coverage**
   - What we know: Zawya is a major UAE business news source with known RSS support
   - What's unclear: Does `https://www.zawya.com/rss/real-estate` serve a real estate-specific feed, or only general business? Direct verification not possible without testing the URL at runtime
   - Recommendation: Include it in the feed list but wrap in try/catch; if it fails or returns off-topic content, remove it.

4. **ContactCard panel sizing with checklist**
   - What we know: ContactCard already has several sections (phone, roles, OneNote, calendar, follow-up). Adding a checklist section makes it significantly taller
   - What's unclear: Will the panel scroll adequately, or does the ContactCard need to be refactored to use a tabbed or collapsed layout?
   - Recommendation: Implement checklist as a fully collapsed section by default, expandable on click. The section header shows transaction type and tick progress ("3/9 documents"). Only expands when agent actively needs to review documents.

---

## Sources

### Primary (HIGH confidence)
- Direct RSS feed verification (WebFetch) — `https://propertynews.ae/feed/` confirmed live, RSS 2.0, updated 2026-03-02
- Direct RSS feed verification (WebFetch) — `http://www.arabianbusiness.com/feed` confirmed live, RSS 2.0, includes property content
- Node.js official docs — global `fetch` stable since Node 18; Electron 34 ships Node 20.18.1 (confirmed from Electron release blog)
- GitHub Pages official docs — https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- electron-builder publish docs — https://www.electron.build/publish.html

### Secondary (MEDIUM confidence)
- UAE tenancy document requirements — Ejari/RERA guides cross-referenced across: aaronz.co (2026 guide), bayut.com, hausandhaus.com
- UAE property sale documents — DLD official + dda-realestate.com RERA forms guide + sellpropertyfast.ae trustee guide
- UAE off-plan documents — egsh.ae Oqood guide + danubeproperties.com + DLD official
- rss-parser package — GitHub README (rbren/rss-parser), npm page. Version 3.13.0, last published 3 years ago but widely used and stable

### Tertiary (LOW confidence)
- Zawya real estate RSS feed URL — inferred from site structure; needs runtime verification
- Gulf News property RSS — not found in page source; possibly exists at non-standard path
- `/releases/latest/download/` URL pattern with fixed artifact name — verified pattern but requires testing artifact naming config in electron-builder

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — rss-parser is an established package; built-in fetch confirmed in Node 20; electron-builder GitHub publish is documented
- Architecture: HIGH — extends proven existing patterns (IPC handlers, electron-store, Contact interface, panel view system)
- UAE document sets: MEDIUM — sourced from multiple brokerage/legal guides; may have minor regional/developer-specific variations
- RSS feed sources: MEDIUM — 2 feeds verified live; others need runtime testing
- Pitfalls: HIGH — derived from Electron architecture and known electron-builder behaviors

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — stable ecosystem; RSS feed URLs should be re-verified before implementation)
