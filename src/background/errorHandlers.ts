// ==========================================================
// 🔹 Global Error Handlers
// ==========================================================
export function setupErrorHandlers() {
  self.onerror = (message, _source, _lineno, _colno, error) => {
    console.error('🌋 Uncaught error:', message, error)
    return true
  }

  self.onunhandledrejection = (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason)
    event.preventDefault()
  }
}
