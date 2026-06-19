import { SelectorEngine } from "./selector-engine"
import type { Action, Selector } from "./types"
import { log } from "./logger"

function hasSelector(sel: Selector): boolean {
  return Object.keys(sel).length > 0
}

export class Recorder {
  private actions: Action[] = []
  private selectorEngine = new SelectorEngine()
  private _isRecording = false
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null

  get isRecording(): boolean {
    return this._isRecording
  }

  start(): void {
    if (this._isRecording) return
    this.actions = []
    this._isRecording = true

    document.addEventListener("click", this.onClick, { capture: true })
    document.addEventListener("change", this.onChange, { capture: true })
    window.addEventListener("scroll", this.onScroll, { passive: true })

    log.log("Recording started")
  }

  stop(): Action[] {
    if (!this._isRecording) return []

    this._isRecording = false
    document.removeEventListener("click", this.onClick, { capture: true })
    document.removeEventListener("change", this.onChange, { capture: true })
    window.removeEventListener("scroll", this.onScroll)

    log.log(`Recording stopped — ${this.actions.length} actions`)
    return [...this.actions]
  }

  private resolveElement(target: EventTarget | null): Element | null {
    if (!target) return null
    const node = target as Node
    if (node.nodeType === Node.TEXT_NODE) {
      return node.parentElement
    }
    if (node instanceof Element) return node
    return null
  }

  private onClick = (e: MouseEvent): void => {
    const el = this.resolveElement(e.target)
    if (!el) return

    const selector = this.selectorEngine.fromElement(el)
    if (!hasSelector(selector)) return

    this.actions.push({
      type: "click",
      selector,
      url: location.href,
      timestamp: Date.now(),
    })
  }

  private onChange = (e: Event): void => {
    const el = this.resolveElement(e.target)
    if (!el) return

    const value = "value" in el ? (el as HTMLInputElement).value : undefined
    if (!value) return

    const selector = this.selectorEngine.fromElement(el)
    if (!hasSelector(selector)) return

    this.actions.push({
      type: "input",
      selector,
      value,
      url: location.href,
      timestamp: Date.now(),
    })
  }

  private onScroll = (): void => {
    if (this.scrollTimeout) return
    this.scrollTimeout = setTimeout(() => {
      this.scrollTimeout = null
      this.actions.push({
        type: "scroll",
        selector: {},
        value: `${window.scrollX},${window.scrollY}`,
        url: location.href,
        timestamp: Date.now(),
      })
    }, 300)
  }
}
