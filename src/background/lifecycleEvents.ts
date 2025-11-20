import { createAlarm } from './alarms'

// ==========================================================
// 🔹 Lifecycle Events
// ==========================================================
export function setupLifecycleEvents() {
  chrome.runtime.onInstalled.addListener(async () => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    console.log('🧩 Extension installed')

    const today = new Date().toDateString()

    await chrome.storage.local.set({
      lastActiveDate: today, // Set agar tidak langsung dianggap "hari baru"
      firstInstallDone: true,
    })

    const { extensionActive = true } = await chrome.storage.local.get(
      'extensionActive'
    )
    if (extensionActive) {
      console.log('[BG] Extension aktif saat install → membuat alarm...')
      createAlarm()
    }
  })

  chrome.runtime.onStartup.addListener(async () => {
    const { extensionActive = true } = await chrome.storage.local.get(
      'extensionActive'
    )

    if (extensionActive) {
      console.log(
        '🔁 Browser dimulai ulang → extension aktif, membuat alarm...'
      )
      createAlarm()
    } else {
      console.log(
        '🔁 Browser dimulai ulang → extension nonaktif, alarm tidak dibuat.'
      )
    }
  })
}
