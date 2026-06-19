# Tape

**Record anything. Replay anywhere.**

Tape is a browser extension that records your clicks, inputs, and scrolls — then replays them automatically. Think of it as a macro recorder for the web. No code, no config, no AI. Just press record, do your thing, and play it back whenever you need.

## What can you do with it?

- **Automate repetitive tasks** — filling forms, navigating multi-step flows, testing checkout processes
- **Demo and onboarding** — record a walkthrough and replay it to show how a feature works
- **QA and regression testing** — record a happy path once, replay it after every deploy to catch breakage
- **Data entry** — replay the same sequence of inputs across different pages or sessions
- **Personal automation** — any browser task you do more than once

## Why Tape?

- **Works on any page** — smart element selectors with automatic fallback (`data-testid` → `id` → `name` → text → path). Even works on SPAs and dynamic content
- **Multi-page flows** — record actions across page navigations. Tape follows the navigation and continues replay automatically
- **Dead simple** — one button to record, one button to replay. No scripting, no selectors to write, no YAML to edit
- **Built for real use** — command-stack pattern for clean replay, colored logging for debugging, lightweight (no heavy framework deps)
- **Privacy first** — all data stays in your browser. No servers, no accounts, no telemetry

## How it works

1. Open any page and click **Record**
2. Perform your actions — click buttons, fill inputs, scroll, navigate between pages
3. Click **Stop** — Tape saves the script with a timestamp and duration
4. Click **Play** — Tape replays everything, navigating between pages as needed

Scripts persist in your browser storage. Rename them, replay them, delete them.

## Install

Load the unpacked extension from `build/chrome-mv3-prod/`:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `build/chrome-mv3-prod/` directory

## Build

```bash
npm install
npm run build
```

## Stack

Built with [Plasmo](https://plasmo.com) — React popup, content script in isolated world, MV3 service worker. Uses `wi-command-stack` for replay execution, `wi-console-logger` for structured logging.
