import { Logger } from "wi-console-logger"

export const log = new Logger({
  level: "log",
  transform: {
    colors: {
      log: { background: "#2563eb", font: "white" },
      warn: { background: "#f59e0b", font: "black" },
      error: { background: "#ef4444", font: "white" },
    },
  },
})
