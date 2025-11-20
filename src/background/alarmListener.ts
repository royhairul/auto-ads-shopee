import { checkShopeeCampaigns } from './campaignChecker'

// ==========================================================
// 🔹 Alarm Listener
// ==========================================================
export function setupAlarmListener() {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'checkShopeeCampaigns') return
    const { extensionActive = true } = await chrome.storage.local.get(
      'extensionActive'
    )
    if (!extensionActive) return
    checkShopeeCampaigns()
  })
}
