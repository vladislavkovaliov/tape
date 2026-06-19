export const log = new (class {
  private prefix = "[Tape]"

  log(...args: unknown[]) {
    console.log(`%c${this.prefix}`, "background:#2563eb;color:white;padding:1px 4px;border-radius:2px", ...args)
  }

  warn(...args: unknown[]) {
    console.warn(`%c${this.prefix}`, "background:#f59e0b;color:black;padding:1px 4px;border-radius:2px", ...args)
  }

  error(...args: unknown[]) {
    console.error(`%c${this.prefix}`, "background:#ef4444;color:white;padding:1px 4px;border-radius:2px", ...args)
  }
})()
