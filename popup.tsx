import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import type { Script, RecorderStatus } from "./src/lib/types"
import { STORAGE_KEYS } from "./src/lib/constants"

function sendToBg(msg: Record<string, unknown>): Promise<any> {
  return chrome.runtime.sendMessage(msg)
}

function getTabId(): Promise<number | null> {
  return new Promise((resolve) => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.id ?? null)
    })
  })
}

function getContentStatus(tabId: number): Promise<RecorderStatus> {
  return chrome.tabs
    .sendMessage(tabId, { action: "get-status" })
    .then((resp) => resp?.status ?? "idle")
    .catch(() => "idle" as RecorderStatus)
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function IndexPopup() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [scripts, setScripts] = useStorage<Script[]>(STORAGE_KEYS.SCRIPTS, [])
  const [status, setStatus] = useStorage<RecorderStatus>(
    STORAGE_KEYS.STATUS,
    "idle",
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    getTabId().then((id) => {
      setTabId(id)
      if (id) {
        getContentStatus(id).then(setStatus)
      }
    })
  }, [])

  const handleStartRecord = async () => {
    if (!tabId) return
    const resp = await sendToBg({ action: "start-record", tabId })
    if (!resp?.error) setStatus("recording")
  }

  const handleStopRecord = async () => {
    if (!tabId) return
    const resp = await sendToBg({ action: "stop-record", tabId })
    if (!resp?.error) setStatus("idle")
  }

  const handleReplay = async (scriptId: string) => {
    if (!tabId) return
    const resp = await sendToBg({ action: "start-replay", tabId, scriptId })
    if (!resp?.error) setStatus("replaying")
  }

  const handleDelete = async (scriptId: string) => {
    await sendToBg({ action: "delete-script", scriptId })
  }

  const startRename = (script: Script) => {
    setEditingId(script.id)
    setEditName(script.name)
  }

  const saveRename = async () => {
    if (editingId && editName.trim()) {
      await sendToBg({ action: "rename-script", scriptId: editingId, name: editName.trim() })
    }
    setEditingId(null)
  }

  const isRecording = status === "recording"
  const isReplaying = status === "replaying"

  return (
    <div
      style={{
        width: 320,
        padding: 12,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tape</h1>
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 4,
            background: isRecording
              ? "#fee2e2"
              : isReplaying
                ? "#dbeafe"
                : "#f3f4f6",
            color: isRecording
              ? "#dc2626"
              : isReplaying
                ? "#2563eb"
                : "#6b7280",
          }}
        >
          {isRecording ? "Recording" : isReplaying ? "Replaying" : "Idle"}
        </span>
      </div>

      {isRecording ? (
        <button
          onClick={handleStopRecord}
          style={{
            width: "100%",
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: "#dc2626",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          ■ Stop Recording
        </button>
      ) : (
        <button
          onClick={handleStartRecord}
          disabled={isReplaying || !tabId}
          style={{
            width: "100%",
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: isReplaying || !tabId ? "#d1d5db" : "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: isReplaying || !tabId ? "not-allowed" : "pointer",
            marginBottom: 12,
          }}
        >
          ● Record
        </button>
      )}

      <div style={{ fontWeight: 500, marginBottom: 8, color: "#374151" }}>
        Scripts
      </div>

      {scripts.length === 0 ? (
        <div
          style={{
            color: "#9ca3af",
            fontSize: 13,
            textAlign: "center",
            padding: 16,
          }}
        >
          No scripts yet. Go to any page and start recording.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...scripts].reverse().map((script) => (
            <div
              key={script.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "white",
              }}
            >
              <div
                style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                onClick={() => startRename(script)}
              >
                {editingId === script.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename()
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    onBlur={saveRename}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      padding: "2px 4px",
                      fontSize: 13,
                      border: "1px solid #2563eb",
                      borderRadius: 4,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {script.name}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {script.actions.length} actions · {formatDuration(script.durationMs)} ·{" "}
                  {new URL(script.url).hostname}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                <button
                  onClick={() => handleReplay(script.id)}
                  disabled={isReplaying || isRecording}
                  title="Replay"
                  style={{
                    padding: "4px 8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    background:
                      isReplaying || isRecording ? "#f3f4f6" : "white",
                    cursor: isReplaying || isRecording ? "not-allowed" : "pointer",
                    fontSize: 14,
                  }}
                >
                  ▶
                </button>
                <button
                  onClick={() => handleDelete(script.id)}
                  title="Delete"
                  style={{
                    padding: "4px 8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    background: "white",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "#9ca3af",
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default IndexPopup
