import { Storage } from "@plasmohq/storage"
import type { Script, ScriptMeta } from "./lib/types"
import { STORAGE_KEYS, scriptKey, generateId } from "./lib/constants"
import { log } from "./lib/logger"

const storage = new Storage({ area: "local" })

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
        const script = await storage.get<Script>(scriptKey(msg.scriptId))
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
        await storage.remove(scriptKey(msg.scriptId))
        const index = (await storage.get<ScriptMeta[]>(STORAGE_KEYS.SCRIPTS_INDEX)) || []
        const filtered = index.filter((s) => s.id !== msg.scriptId)
        await storage.set(STORAGE_KEYS.SCRIPTS_INDEX, filtered)
        sendResponse({ success: true })
        break
      }

      case "rename-script": {
        const script = await storage.get<Script>(scriptKey(msg.scriptId))
        if (!script) {
          sendResponse({ error: "Script not found" })
          return
        }
        const updated = { ...script, name: msg.name, updatedAt: Date.now() }
        await storage.set(scriptKey(msg.scriptId), updated)
        const index = (await storage.get<ScriptMeta[]>(STORAGE_KEYS.SCRIPTS_INDEX)) || []
        const idx = index.findIndex((s) => s.id === msg.scriptId)
        if (idx !== -1) {
          index[idx] = { ...index[idx], name: msg.name, updatedAt: Date.now() }
          await storage.set(STORAGE_KEYS.SCRIPTS_INDEX, index)
        }
        sendResponse({ success: true })
        break
      }
    }
  } catch (e) {
    sendResponse({ error: String(e) })
  }
}

log.log("Tape background loaded")
