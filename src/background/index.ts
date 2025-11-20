// ==========================================================
// 🔹 Auto Ads Shopee - Background Service Worker
// ==========================================================

import { setupErrorHandlers } from './errorHandlers'
import { setupLifecycleEvents } from './lifecycleEvents'
import { setupMessageHandlers } from './messageHandlers'
import { setupAlarmListener } from './alarmListener'

// ==========================================================
// 🔹 Initialize Extension
// ==========================================================

// Setup global error handlers
setupErrorHandlers()

// Setup lifecycle events (onInstalled, onStartup)
setupLifecycleEvents()

// Setup runtime message handlers
setupMessageHandlers()

// Setup alarm listener
setupAlarmListener()
