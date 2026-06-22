export const STORAGE_KEYS = {
  SCRIPTS_INDEX: "tape-scripts-index",
  STATUS: "tape-status",
  PENDING_REPLAY: "tape-pending-replay",
} as const

export const SCRIPT_KEY_PREFIX = "tape-script-"

export function scriptKey(id: string): string {
  return `${SCRIPT_KEY_PREFIX}${id}`
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
