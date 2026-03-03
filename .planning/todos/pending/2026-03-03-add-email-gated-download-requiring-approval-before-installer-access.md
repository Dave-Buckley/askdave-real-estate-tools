---
created: "2026-03-03T09:30:00.000Z"
title: Add email-gated download requiring approval before installer access
area: ui
files:
  - landing/index.html
  - landing/AgentKit-Setup-Guide.html
---

## Problem

David does not want to distribute the app freely. Downloads should require the user to submit their email, and David manually approves before they receive a download link. Current landing page has direct GitHub Releases download buttons.

## Solution

Replace direct download buttons with an email submission form. Options:

1. **Simple approach:** Google Form or Typeform embedded — user submits email, David gets notification, manually sends download link
2. **Automated approach:** Small backend (e.g., Netlify Functions / Cloudflare Workers) — user submits email, stored in a list, David approves via admin page or email link, user receives download URL automatically
3. **Gumroad/Lemon Squeezy:** Use a $0 (or paid) product page that gates downloads behind email collection — built-in email delivery, no custom backend

Decision deferred until David is happy with the app and ready to distribute.
