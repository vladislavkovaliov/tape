import type { Selector } from "./types"

export class SelectorEngine {
  fromElement(el: Element | null | undefined): Selector {
    if (!el || !(el instanceof Element)) return {}

    const selector: Selector = {}

    try {
      const testid = el.closest("[data-testid]")?.getAttribute("data-testid")
      if (testid) selector.testid = testid

      if (el.id) selector.id = el.id

      const name = el.getAttribute("name")
      if (name) selector.name = name

      const ariaLabel = el.getAttribute("aria-label")
      if (ariaLabel) selector.ariaLabel = ariaLabel

      const text = el.textContent?.trim()
      if (text && text.length < 50) selector.text = text

      const path = this.nthPath(el)
      if (path) selector.nthPath = path
    } catch {
      // If anything fails, return whatever we have
    }

    return selector
  }

  async resolve(sel: Selector, timeout = 5000): Promise<Element | null> {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const el = this.tryStrategies(sel)
      if (el) return el
      await this.sleep(200)
    }

    return null
  }

  private tryStrategies(sel: Selector): Element | null {
    try {
      if (sel.testid) {
        const el = document.querySelector(`[data-testid="${sel.testid}"]`)
        if (el) return el
      }

      if (sel.id) {
        const el = document.getElementById(sel.id)
        if (el) return el
      }

      if (sel.name) {
        const el = document.querySelector(`[name="${sel.name}"]`)
        if (el) return el
      }

      if (sel.ariaLabel) {
        const el = document.querySelector(`[aria-label="${sel.ariaLabel}"]`)
        if (el) return el
      }

      if (sel.text) {
        const el = this.findByText(sel.text)
        if (el) return el
      }

      if (sel.nthPath) {
        try {
          const el = document.querySelector(sel.nthPath)
          if (el) return el
        } catch {}
      }
    } catch {}

    return null
  }

  private nthPath(el: Element): string | undefined {
    try {
      const parts: string[] = []
      let current: Element | null = el

      while (current && current !== document.body && current !== document.documentElement) {
        const parent = current.parentElement
        if (!parent) break

        const tag = current.tagName.toLowerCase()
        const siblings = Array.from(parent.children).filter(
          (s) => s.tagName === current.tagName,
        )
        const index = siblings.indexOf(current) + 1
        const suffix = siblings.length > 1 ? `:nth-child(${index})` : ""
        parts.unshift(`${tag}${suffix}`)
        current = parent
      }

      return parts.length > 0 ? `body > ${parts.join(" > ")}` : undefined
    } catch {
      return undefined
    }
  }

  private findByText(text: string): Element | null {
    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
      )

      while (walker.nextNode()) {
        const node = walker.currentNode
        const content = node.textContent?.trim()
        if (content === text && node.parentElement) {
          return node.parentElement
        }
      }
    } catch {}

    return null
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
