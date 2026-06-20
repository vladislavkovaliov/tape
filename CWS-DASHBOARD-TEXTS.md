# Chrome Web Store — Texts for Dashboard

## Store Listing

### Short Description (≤132 chars)
Record and replay browser actions. Macro recorder for the web. No code, no config.

### Detailed Description
Tape records your clicks, inputs, and scrolls — then replays them automatically on any page. Think of it as a macro recorder for the browser.

**Use cases:**
• Automate repetitive tasks — form filling, multi-step flows, checkout testing
• Demo and onboarding — record a walkthrough, replay it for users
• QA regression testing — record a happy path once, replay after every deploy
• Data entry — replay the same sequence across different pages
• Personal automation — any browser task you do more than once

**Key features:**
• Works on any page — smart selectors with automatic fallback (data-testid → id → name → text → path)
• Multi-page flows — follows navigation and continues replay automatically
• Dead simple — one button to record, one button to replay
• Privacy first — all data stays in your browser. No servers, no accounts, no telemetry
• Lightweight — no heavy framework dependencies

### Category
Productivity

## Privacy

### Single Purpose Description
Record and replay browser actions to help users automate repetitive tasks, demonstrate workflows, and perform QA testing.

### Permission Justifications

**storage** — To save recorded scripts and extension preferences locally in your browser.

**activeTab** — To interact with the active tab for recording clicks, inputs, and scrolls, and for replaying actions.

**<all_urls>** — Required to record and replay actions on any website the user visits. The extension only activates when the user explicitly starts a recording or replay.

### Remote Code
No, I am not using remote code.

### Data Usage
Tape does not collect, transmit, or share any user data. All recordings and settings are stored locally via chrome.storage.local and never leave the device.

### Privacy Policy URL
https://raw.githubusercontent.com/anomalyco/tape-plasmo/main/PRIVACY.md

## Distribution

### Visibility
Public

### Countries
All countries

## Test Instructions

1. Install the extension via "Load unpacked" pointing to the `build/chrome-mv3-prod/` directory.
2. Open any website (e.g., google.com).
3. Click the Tape icon in the toolbar → popup opens with status "Idle".
4. Click "Record" → status changes to "Recording".
5. Perform actions: click a link, type in a search box, scroll the page.
6. Click "Stop Recording" → a new script appears in the list with a timestamp and duration.
7. Click the script name → rename it (e.g., "Test search").
8. Click the ▶ button → status changes to "Replaying" and actions are replayed automatically.
9. For multi-page testing: start recording on page A, navigate to page B (a link or form submit), stop recording. When replaying, Tape will follow the navigation automatically.
