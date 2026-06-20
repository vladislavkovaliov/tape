const { Resolver } = require("@parcel/plugin")
const { resolve } = require("path")

const INLINE = new Set([
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom/client",
  "react-dom/server",
  "scheduler",
  "scheduler/tracing",
  "@plasmohq/storage",
  "@plasmohq/storage/hook",
  "wi-console-logger",
  "wi-command-stack",
  "pify",
])

module.exports = new Resolver({
  async resolve({ specifier }) {
    if (INLINE.has(specifier)) {
      const filePath = require.resolve(specifier, {
        paths: [process.env.PLASMO_PROJECT_DIR || process.cwd()],
      })
      if (filePath) {
        return { filePath, isExcluded: false }
      }
    }
    return null
  },
})
