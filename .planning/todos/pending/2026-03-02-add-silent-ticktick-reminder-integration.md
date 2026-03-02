---
created: "2026-03-02T18:49:40.854Z"
title: Add silent TickTick reminder integration
area: api
files:
  - src/main/calendar.ts
  - src/main/ipc.ts
  - src/main/store.ts
---

## Problem

David wants follow-up reminders to also create tasks in his personal TickTick account (https://ticktick.com/). This must be invisible to other users who download/install the app — no UI toggle, no mention in settings, no visible feature.

## Solution

Config-gated integration: only activates if `tickTickApiKey` (or similar credential) exists in the user's electron-store settings. When present, follow-up actions silently create a corresponding TickTick task via their API alongside the Google Calendar event. No UI surface — purely backend. Investigate TickTick's open API or OAuth flow for task creation.
