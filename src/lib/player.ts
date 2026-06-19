import { CommandStack, Command } from "wi-command-stack"
import { Storage } from "@plasmohq/storage"
import { SelectorEngine } from "./selector-engine"
import type { Action, PendingReplay } from "./types"
import { STORAGE_KEYS } from "./constants"
import { log } from "./logger"

const storage = new Storage()

class ReplayCommand extends Command<Action[]> {
  constructor(
    private action: Action,
    private selectorEngine: SelectorEngine,
  ) {
    super()
  }

  async execute(_state: Action[]): Promise<Action[]> {
    switch (this.action.type) {
      case "scroll": {
        const [x, y] = (this.action.value ?? "0,0").split(",").map(Number)
        window.scrollTo({ left: x, top: y, behavior: "smooth" })
        await this.sleep(300)
        return [..._state, this.action]
      }

      case "click":
      case "input": {
        const hasSelector = Object.keys(this.action.selector).length > 0
        if (!hasSelector) {
          log.warn(`Skipping ${this.action.type} — no selector`)
          return [..._state, this.action]
        }

        const el = await this.selectorEngine.resolve(this.action.selector)
        if (!el) {
          log.warn(`Element not found for ${this.action.type}: ${JSON.stringify(this.action.selector)}`)
          return [..._state, this.action]
        }

        if (this.action.type === "click") {
          ;(el as HTMLElement).click()
        } else {
          const input = el as HTMLInputElement
          const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          )?.set
          nativeSetter?.call(input, this.action.value ?? "")
          input.dispatchEvent(new Event("input", { bubbles: true }))
          input.dispatchEvent(new Event("change", { bubbles: true }))
        }
        return [..._state, this.action]
      }

      default:
        return [..._state, this.action]
    }
  }

  async undo(state: Action[]): Promise<Action[]> {
    return state.slice(0, -1)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}

export class Player {
  private stack = new CommandStack<Action[]>([])
  private selectorEngine = new SelectorEngine()
  private _isPlaying = false
  private stopped = false

  get isPlaying(): boolean {
    return this._isPlaying
  }

  async run(
    actions: Action[],
    onProgress?: (i: number, total: number) => void,
  ): Promise<void> {
    if (this._isPlaying || actions.length === 0) return
    this._isPlaying = true
    this.stopped = false

    for (let i = 0; i < actions.length; i++) {
      if (this.stopped) break

      const action = actions[i]

      if (action.url && !this.matchesCurrentUrl(action.url)) {
        const remaining = actions.slice(i)
        await storage.set(STORAGE_KEYS.PENDING_REPLAY, {
          actions: remaining,
        } satisfies PendingReplay)
        log.log(`Navigating to: ${action.url}`)
        window.location.href = action.url
        this._isPlaying = false
        this.stopped = true
        break
      }

      const cmd = new ReplayCommand(action, this.selectorEngine)
      await this.stack.execute(cmd)

      onProgress?.(i + 1, actions.length)
      await this.sleep(400)
    }

    if (!this.stopped) {
      this._isPlaying = false
      log.log("Replay finished")
    }
  }

  private matchesCurrentUrl(actionUrl: string): boolean {
    try {
      const recorded = new URL(actionUrl)
      const current = new URL(location.href)
      recorded.hash = ""
      current.hash = ""
      return recorded.href === current.href
    } catch {
      return true
    }
  }

  stop(): void {
    this.stopped = true
    this._isPlaying = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
