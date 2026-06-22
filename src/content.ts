import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { Recorder } from "./lib/recorder"
import { Player } from "./lib/player"
import type { Action, PendingReplay, RecorderStatus, Script, ScriptMeta } from "./lib/types"
import { STORAGE_KEYS, scriptKey, generateId } from "./lib/constants"
import { log } from "./lib/logger"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
}

const storage = new Storage({ area: "local" })
const recorder = new Recorder()
const player = new Player()

function formatDateTime(): string {
  return new Date().toLocaleString("ru-RU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

async function saveScript(actions: Action[]): Promise<void> {
  const durationMs =
    actions.length > 0
      ? actions[actions.length - 1].timestamp - actions[0].timestamp
      : 0

  const script: Script = {
    id: generateId(),
    name: formatDateTime(),
    url: location.href,
    actions,
    durationMs,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const meta: ScriptMeta = {
    id: script.id,
    name: script.name,
    url: script.url,
    actionCount: script.actions.length,
    durationMs: script.durationMs,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
  }

  await storage.set(scriptKey(script.id), script)
  const index = (await storage.get<ScriptMeta[]>(STORAGE_KEYS.SCRIPTS_INDEX)) || []
  index.push(meta)
  await storage.set(STORAGE_KEYS.SCRIPTS_INDEX, index)
}

function setStatus(status: RecorderStatus): void {
  storage.set(STORAGE_KEYS.STATUS, status)
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.action) {
    case "start-record":
      recorder.start()
      setStatus("recording")
      log.log("Record started from popup")
      sendResponse({ success: true })
      break

    case "stop-record":
      if (!recorder.isRecording) {
        sendResponse({ success: true })
        break
      }
      ;(async () => {
        const actions = recorder.stop()
        setStatus("idle")
        await saveScript(actions)
        log.log(`Saved ${actions.length} actions`)
        sendResponse({ success: true })
      })()
      return true

    case "start-replay":
      if (!msg.actions || msg.actions.length === 0) {
        sendResponse({ error: "no actions" })
        break
      }
      setStatus("replaying")
      sendResponse({ success: true })
      player.run(msg.actions, (i, total) => {
        chrome.runtime.sendMessage({
          source: "content",
          action: "replay-progress",
          index: i,
          total,
        })
      }).then(() => {
        setStatus("idle")
        chrome.runtime.sendMessage({
          source: "content",
          action: "replay-finished",
        })
      })
      break

    case "stop-replay":
      player.stop()
      setStatus("idle")
      sendResponse({ success: true })
      break

    case "get-status":
      sendResponse({ status: recorder.isRecording ? "recording" : player.isPlaying ? "replaying" : "idle" })
      break
  }
})

async function resumePendingReplay(): Promise<void> {
  const pending = await storage.get<PendingReplay | null>(
    STORAGE_KEYS.PENDING_REPLAY,
  )
  if (!pending || pending.actions.length === 0) return

  log.log(`Resuming replay with ${pending.actions.length} actions`)
  await storage.set(STORAGE_KEYS.PENDING_REPLAY, null)

  setStatus("replaying")

  player.run(pending.actions, (i, total) => {
    chrome.runtime.sendMessage({
      source: "content",
      action: "replay-progress",
      index: i,
      total,
    })
  }).then(() => {
    setStatus("idle")
    chrome.runtime.sendMessage({
      source: "content",
      action: "replay-finished",
    })
  })
}

setTimeout(resumePendingReplay, 300)

log.log("Tape content script loaded")
