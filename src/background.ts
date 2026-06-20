import { Storage } from "@plasmohq/storage"
import type { Script } from "./lib/types"
import { STORAGE_KEYS, generateId } from "./lib/constants"
import { log } from "./lib/logger"

const storage = new Storage()

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.source === "content") {
    handleContentMessage(msg, sendResponse)
    return
  }

  handlePopupMessage(msg, sendResponse)
  return true
})

async function handleContentMessage(msg: any, sendResponse: (resp: any) => void) {
  if (msg.action === "replay-progress" || msg.action === "replay-finished") {
    await storage.set(
      STORAGE_KEYS.STATUS,
      msg.action === "replay-finished" ? "idle" : "replaying",
    )
    sendResponse({ success: true })
  }
}

async function handlePopupMessage(msg: any, sendResponse: (resp: any) => void) {
  try {
    switch (msg.action) {
      case "start-record":
      case "stop-record": {
        const resp = await chrome.tabs.sendMessage(msg.tabId, {
          action: msg.action,
        })
        sendResponse(resp)
        break
      }

      case "stop-replay": {
        await storage.set(STORAGE_KEYS.PENDING_REPLAY, null)
        const resp2 = await chrome.tabs.sendMessage(msg.tabId, {
          action: "stop-replay",
        }).catch(() => ({ success: true }))
        sendResponse(resp2)
        break
      }

      case "start-replay": {
        const scripts = (await storage.get<Script[]>(STORAGE_KEYS.SCRIPTS)) || []
        const script = scripts.find((s: Script) => s.id === msg.scriptId)
        if (!script) {
          sendResponse({ error: "Script not found" })
          return
        }
        const resp = await chrome.tabs.sendMessage(msg.tabId, {
          action: "start-replay",
          actions: script.actions,
        })
        sendResponse(resp)
        break
      }

      case "delete-script": {
        const scripts = (await storage.get<Script[]>(STORAGE_KEYS.SCRIPTS)) || []
        const filtered = scripts.filter((s: Script) => s.id !== msg.scriptId)
        await storage.set(STORAGE_KEYS.SCRIPTS, filtered)
        sendResponse({ success: true })
        break
      }

      case "rename-script": {
        const scripts = (await storage.get<Script[]>(STORAGE_KEYS.SCRIPTS)) || []
        const idx = scripts.findIndex((s: Script) => s.id === msg.scriptId)
        if (idx === -1) {
          sendResponse({ error: "Script not found" })
          return
        }
        scripts[idx] = { ...scripts[idx], name: msg.name, updatedAt: Date.now() }
        await storage.set(STORAGE_KEYS.SCRIPTS, scripts)
        sendResponse({ success: true })
        break
      }
    }
  } catch (e) {
    sendResponse({ error: String(e) })
  }
}

log.log("Tape background loaded")
