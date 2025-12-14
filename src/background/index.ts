// ==========================================================
// 🔹 Auto Ads Shopee - Background Service Worker
// ==========================================================

import { setupGlobalErrorHandlers } from './logger'
import { setupLifecycleEvents } from './lifecycleEvents'
import { setupMessageHandlers } from './messageHandlers'
import { setupAlarmListener } from './alarmListener'

// ==========================================================
// 🔹 Initialize Extension
// ==========================================================

// Setup global error handlers with persistent logging
setupGlobalErrorHandlers()

// Setup lifecycle events (onInstalled, onStartup)
setupLifecycleEvents()

// Setup runtime message handlers
setupMessageHandlers()

// Setup alarm listener
setupAlarmListener()
