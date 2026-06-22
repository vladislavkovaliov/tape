export interface Action {
  type: "click" | "input" | "scroll" | "waitfor"
  selector: Selector
  value?: string
  url: string
  timestamp: number
}

export interface Selector {
  testid?: string
  id?: string
  name?: string
  text?: string
  ariaLabel?: string
  nthPath?: string
}

export interface ScriptMeta {
  id: string
  name: string
  url: string
  actionCount: number
  durationMs: number
  createdAt: number
  updatedAt: number
}

export interface Script {
  id: string
  name: string
  url: string
  actions: Action[]
  durationMs: number
  createdAt: number
  updatedAt: number
}

export type RecorderStatus = "idle" | "recording" | "replaying"

export interface PendingReplay {
  actions: Action[]
}

export interface ContentCommand {
  action: "start-record" | "stop-record" | "start-replay" | "stop-replay" | "get-status"
  scriptId?: string
  actions?: Action[]
  tabId?: number
}
