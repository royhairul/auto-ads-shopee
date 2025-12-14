// ==========================================================
// 🔹 Error Logging Module for Chrome Extension
// ==========================================================
// Stores errors persistently in chrome.storage.local
// Maximum 200 entries, auto-removes oldest when limit exceeded
// ==========================================================

const MAX_ERROR_LOGS = 200
const STORAGE_KEY = 'errorLogs'

/**
 * Error log entry structure
 */
export interface ErrorLog {
  message: string
  stack: string
  when: string // ISO timestamp
  url?: string
  line?: number
  column?: number
}

/**
 * Log an error to chrome.storage.local
 * @param error - Error object or message
 * @param additionalInfo - Optional additional context
 */
export async function logError(
  error: Error | string | unknown,
  additionalInfo?: Record<string, any>
): Promise<void> {
  try {
    // Extract error details
    let message: string
    let stack: string

    if (error instanceof Error) {
      message = error.message
      stack = error.stack || 'No stack trace available'
    } else if (typeof error === 'string') {
      message = error
      stack = new Error().stack || 'No stack trace available'
    } else {
      message = String(error)
      stack = 'Unknown error type'
    }

    // Create error log entry
    const errorLog: ErrorLog = {
      message,
      stack,
      when: new Date().toISOString(),
      ...additionalInfo,
    }

    // Retrieve existing logs
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const existingLogs: ErrorLog[] = result[STORAGE_KEY] || []

    // Add new log to the beginning (newest first)
    existingLogs.unshift(errorLog)

    // Limit to MAX_ERROR_LOGS entries (remove oldest)
    if (existingLogs.length > MAX_ERROR_LOGS) {
      existingLogs.splice(MAX_ERROR_LOGS)
    }

    // Save back to storage
    await chrome.storage.local.set({ [STORAGE_KEY]: existingLogs })

    // Also log to console for development
    console.error('📝 Error logged:', errorLog)
  } catch (storageError) {
    // If logging fails, at least log to console
    console.error('❌ Failed to log error to storage:', storageError)
    console.error('Original error:', error)
  }
}

/**
 * Get all error logs from storage
 * @returns Promise with array of error logs
 */
export async function getErrorLogs(): Promise<ErrorLog[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return result[STORAGE_KEY] || []
  } catch (error) {
    console.error('Failed to retrieve error logs:', error)
    return []
  }
}

/**
 * Clear all error logs from storage
 */
export async function clearErrorLogs(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEY)
    console.log('✅ Error logs cleared')
  } catch (error) {
    console.error('Failed to clear error logs:', error)
  }
}

/**
 * Get error logs count
 */
export async function getErrorLogsCount(): Promise<number> {
  try {
    const logs = await getErrorLogs()
    return logs.length
  } catch (error) {
    console.error('Failed to get error logs count:', error)
    return 0
  }
}

/**
 * Get error logs within a time range
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 */
export async function getErrorLogsByDateRange(
  startDate: string | Date,
  endDate: string | Date
): Promise<ErrorLog[]> {
  try {
    const logs = await getErrorLogs()
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    return logs.filter((log) => {
      const logTime = new Date(log.when).getTime()
      return logTime >= start && logTime <= end
    })
  } catch (error) {
    console.error('Failed to filter error logs by date:', error)
    return []
  }
}

/**
 * Setup global error handlers
 * Call this once when the extension starts
 */
export function setupGlobalErrorHandlers(): void {
  // Handle synchronous errors in service worker
  self.onerror = (message, source, lineno, colno, error) => {
    logError(error || message, {
      url: source,
      line: lineno,
      column: colno,
      type: 'onerror',
    })
    return true // Prevent default error handling
  }

  // Handle unhandled promise rejections
  self.onunhandledrejection = (event) => {
    logError(event.reason, {
      type: 'unhandledrejection',
      promise: 'Promise rejection',
    })
    event.preventDefault()
  }

  console.log('✅ Global error handlers initialized')
}

/**
 * Export error logs as JSON string (for debugging/export)
 */
export async function exportErrorLogsAsJSON(): Promise<string> {
  try {
    const logs = await getErrorLogs()
    return JSON.stringify(logs, null, 2)
  } catch (error) {
    console.error('Failed to export error logs:', error)
    return '[]'
  }
}

/**
 * Get recent error logs (last N entries)
 * @param count - Number of recent logs to retrieve
 */
export async function getRecentErrorLogs(
  count: number = 10
): Promise<ErrorLog[]> {
  try {
    const logs = await getErrorLogs()
    return logs.slice(0, count)
  } catch (error) {
    console.error('Failed to get recent error logs:', error)
    return []
  }
}
