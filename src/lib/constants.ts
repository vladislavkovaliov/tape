export const STORAGE_KEYS = {
  SCRIPTS: "tape-scripts",
  STATUS: "tape-status",
  PENDING_REPLAY: "tape-pending-replay",
} as const

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
