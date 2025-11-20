import { DEFAULT_ALARM_INTERVAL_MINUTES } from './constants'

// ==========================================================
// 🔹 Alarm Management
// ==========================================================
export function createAlarm() {
  chrome.alarms.create('checkShopeeCampaigns', {
    delayInMinutes: DEFAULT_ALARM_INTERVAL_MINUTES,
    periodInMinutes: DEFAULT_ALARM_INTERVAL_MINUTES,
  })
  console.log('✅ Alarm checkShopeeCampaigns dibuat atau diperbarui.')
}

export function clearAlarm() {
  chrome.alarms.clear('checkShopeeCampaigns', (wasCleared) => {
    if (wasCleared) console.log('🛑 Alarm checkShopeeCampaigns dihapus.')
  })
}
