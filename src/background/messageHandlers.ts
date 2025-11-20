import { createAlarm, clearAlarm } from './alarms'
import { handleDailyReset } from './dailyReset'
import { checkShopeeCampaigns } from './campaignChecker'

// ==========================================================
// 🔹 Runtime Message Handler
// ==========================================================
export function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener(
    async (message, _sender, sendResponse) => {
      const { type, payload } = message

      if (type === 'SET_EXTENSION_ACTIVE') {
        const active = payload
        const today = new Date().toDateString()
        const { lastActiveDate } = await chrome.storage.local.get(
          'lastActiveDate'
        )

        await chrome.storage.local.set({ extensionActive: active })

        if (active) {
          console.log('[BG] Extension diaktifkan → membuat alarm...')
          if (lastActiveDate !== today) {
            console.log('🗓️ Hari baru terdeteksi → reset harian dimulai...')
            await handleDailyReset()
            await chrome.storage.local.set({ lastActiveDate: today })
          }
          createAlarm()
        } else {
          console.log('[BG] Extension dinonaktifkan → menghapus alarm...')
          clearAlarm()
        }

        sendResponse({ success: true })
      }

      if (type === 'FORCE_CHECK') {
        console.log('🧭 Sidepanel meminta pengecekan manual campaign.')
        await checkShopeeCampaigns()
        sendResponse({ ok: true })
      }

      // Tambahkan return true agar async sendResponse tidak error
      return true
    }
  )
}
