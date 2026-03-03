---
created: "2026-03-03T09:13:38.247Z"
title: Add email clipboard detection with Gmail compose action
area: ui
files:
  - src/main/clipboard.ts
  - src/renderer/popup/components/ActionBar.tsx
  - src/shared/types.ts
---

## Problem

The app currently only detects phone numbers on the clipboard. Real estate agents frequently copy email addresses from CRMs, property portals, and contact lists. When an email is copied, nothing happens — the agent has to manually open Gmail and paste the address. This breaks the "copy → act" flow that makes the phone number detection so useful.

## Solution

Extend clipboard detection in `src/main/clipboard.ts` to recognize email addresses (regex alongside existing phone regex). When an email is detected:

1. Show the popup with an "Email in Gmail" action button
2. Button opens Gmail compose in the browser: `https://mail.google.com/mail/?view=cm&to={email}`
3. Optionally pre-fill subject/body from a template (like existing WhatsApp templates)
4. ActionBar gets an email-specific layout (Gmail button as primary, copy email as secondary)

Follows the same pattern as phone number detection → popup → action buttons. May also want to support selection hotkey detecting emails (not just clipboard).
