# Phase 1: Core App + Communication - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Cross-platform Electron desktop app that lives in the system tray (Windows) or menu bar (macOS). Detects phone numbers on clipboard and offers one-click dial and WhatsApp actions. Includes message templates with contact name substitution. Ships with installer, auto-updates, global hotkeys, and feature toggles. All phone numbers normalized to UAE E.164 format (+971). This is the demo-able first product — agents install it and are immediately productive.

</domain>

<decisions>
## Implementation Decisions

### Clipboard Popup
- Floating action bar style — compact horizontal bar with phone number + action buttons (Dial, WhatsApp)
- Appears near system tray / menu bar area — consistent position every time
- Stays visible until the agent clicks an action or explicitly dismisses it
- If a new phone number is copied while popup is showing, it replaces the current popup (one popup at a time)

### Main Panel Layout
- Dropdown panel from tray icon (not a separate window) — like Discord/Slack tray menus
- Default view is a quick actions hub: phone number input field at top + template list below — always useful whether a number is active or not
- Contact card shows the formatted number with action buttons immediately available. A small "Add name" link expands an optional name field for template substitution. Name is not required for actions.
- WhatsApp button uses a saved default preference (desktop or phone). A dropdown arrow or secondary action reveals the alternative option. One click for the common case.

### Template System
- Ships with 5-8 pre-loaded UAE real estate template examples (listing intro, follow-up, viewing confirmation, etc.). Agents can edit or delete them.
- Simple `{name}` style placeholders for variables. When the agent enters a name, it fills in automatically. If no name entered, placeholder stays visible as a reminder.
- When a template is selected with a number active: show a preview of the filled-in message. Agent can review, edit, then click "Send via WhatsApp" or "Copy". Safe and gives control.
- WhatsApp is the primary send channel. "Send via WhatsApp" is the main action, "Copy text" is a secondary action for pasting elsewhere.

### Setup & Preferences
- No first-run wizard. App launches with everything enabled and sensible defaults. Settings accessible from tray menu for customization.
- Simple on/off toggle list for features in settings (clipboard detection, hotkeys, etc.)
- Pre-set default hotkeys (e.g., Ctrl+Shift+D for dial, Ctrl+Shift+W for WhatsApp). Agents can customize by recording a new key combo in settings.
- Settings panel opens as a separate window (not inside the tray dropdown). Keeps the dropdown focused on daily actions.

### Claude's Discretion
- Exact hotkey defaults and modifier keys
- Loading states and transitions in the panel
- Error state handling (invalid numbers, WhatsApp not installed, etc.)
- Template editor UI design and editing flow
- Auto-update mechanism and notification behavior
- Phone number normalization implementation details
- Installer build tooling and signing approach

</decisions>

<specifics>
## Specific Ideas

- Clipboard popup should feel like a lightweight floating toolbar — not a modal or a notification
- The tray dropdown should feel like a quick-access tool, not a full application window
- Pre-loaded templates should be UAE real estate specific — agents should recognize them as relevant to their daily work
- Template preview gives agents confidence they're sending the right message — no accidental sends

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing code. All components, hooks, and utilities will be created fresh in this phase.

### Established Patterns
- No established patterns yet. This phase sets the foundation for the entire application architecture.

### Integration Points
- System tray / menu bar (OS-level integration)
- Clipboard monitoring (OS-level)
- Global hotkey registration (OS-level)
- tel: URI scheme for phone dialler
- WhatsApp Web/Desktop deep links (wa.me or whatsapp:// protocol)
- Electron auto-updater for silent updates
- Platform-specific installers (.exe Windows, .dmg macOS)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-app-communication*
*Context gathered: 2026-03-02*
