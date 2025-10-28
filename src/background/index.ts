import {
  getShopeeCampaign,
  updateDailyBudget,
  getProfile,
} from '@/services/shopee'

chrome.runtime.onInstalled.addListener(async () => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  console.log('🧩 Extension installed')

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
    console.log('🔁 Browser dimulai ulang → extension aktif, membuat alarm...')
    createAlarm()
  } else {
    console.log(
      '🔁 Browser dimulai ulang → extension nonaktif, alarm tidak dibuat.'
    )
  }
})

function createAlarm() {
  chrome.alarms.create('checkShopeeCampaigns', {
    delayInMinutes: 0.1,
    periodInMinutes: 0.1, // testing setiap 6 detik
  })
  console.log('✅ Alarm checkShopeeCampaigns dibuat atau diperbarui.')
}

function clearAlarm() {
  chrome.alarms.clear('checkShopeeCampaigns', (wasCleared) => {
    if (wasCleared) console.log('🛑 Alarm checkShopeeCampaigns dihapus.')
  })
}

self.onerror = (message, _source, _lineno, _colno, error) => {
  console.error('🌋 Uncaught error:', message, error)
  return true
}

self.onunhandledrejection = (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
  event.preventDefault()
}

chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message.type === 'SET_EXTENSION_ACTIVE') {
    const active = message.payload
    await chrome.storage.local.set({ extensionActive: active })
    console.log('[BG] Extension active saved:', active)

    if (active) {
      console.log('[BG] Extension diaktifkan → membuat alarm...')
      createAlarm()
    } else {
      console.log('[BG] Extension dinonaktifkan → menghapus alarm...')
      clearAlarm()
    }

    sendResponse({ success: true })
  }

  if (message.type === 'FORCE_CHECK') {
    console.log('🧭 Sidepanel meminta pengecekan manual campaign.')
    checkShopeeCampaigns()
    sendResponse({ ok: true })
  }
})

async function checkShopeeCampaigns() {
  const { extensionActive = true } = await chrome.storage.local.get(
    'extensionActive'
  )
  if (!extensionActive) return

  console.log('[BG] Alarm triggered → Cek campaign Shopee')

  try {
    const profile = await getProfile().catch(() => null)
    if (!profile || !profile.is_seller) {
      console.warn('[BG] Tidak ada akun Shopee aktif — hentikan alarm.')
      clearAlarm()
      return
    }

    const {
      budgetThreshold = 98,
      updateInterval = 10,
      dailyBudget = 5000,
      notificationCooldown = 5,
      notificationEnabled = true,
      mode = 'percentage', // mode: 'percentage' | 'time'
      lastUpdateTime = 0,
    } = await chrome.storage.sync.get([
      'budgetThreshold',
      'updateInterval',
      'dailyBudget',
      'notificationCooldown',
      'notificationEnabled',
      'mode',
      'lastUpdateTime',
    ])

    const NOTIFICATION_COOLDOWN = notificationCooldown * 60 * 1000
    const UPDATE_INTERVAL_MS = updateInterval * 60 * 1000
    const now = Date.now()

    console.log(
      `[BG] Mode: ${mode} | threshold: ${budgetThreshold}% | interval: ${updateInterval}m | cooldown: ${notificationCooldown}m`
    )

    const { campaigns } = await getShopeeCampaign()
    if (!campaigns || campaigns.length === 0) return

    const { notifiedCampaigns = {} } = await chrome.storage.local.get(
      'notifiedCampaigns'
    )
    const updatedCampaigns: any[] = []

    for (const c of campaigns) {
      const percent = (c.spent / c.daily_budget) * 100
      const lastNotified = notifiedCampaigns[c.id] || 0
      const cooldownPassed = now - lastNotified > NOTIFICATION_COOLDOWN

      let shouldUpdate = false

      // 🔹 Tentukan logika berdasarkan mode
      if (mode === 'percentage') {
        shouldUpdate = percent >= budgetThreshold
      } else if (mode === 'time') {
        shouldUpdate = now - lastUpdateTime >= UPDATE_INTERVAL_MS
      }

      if (shouldUpdate) {
        const newBudget = c.daily_budget / 100000 + dailyBudget
        console.log(
          `💰 Update ${c.title} dari Rp${(
            c.daily_budget / 100000
          ).toLocaleString()} → Rp${newBudget.toLocaleString()}`
        )

        const result = await updateDailyBudget(c.id, newBudget)
        if (result?.code === 0) {
          console.log(`✅ Budget ${c.title} berhasil diperbarui.`)

          // Simpan waktu update terakhir hanya untuk mode "time"
          if (mode === 'time') {
            await chrome.storage.sync.set({ lastUpdateTime: now })
          }

          // 🔔 Notifikasi disesuaikan berdasarkan mode
          if (notificationEnabled && cooldownPassed) {
            let message = ''
            if (mode === 'percentage') {
              message = `Kampanye "${c.title}" mencapai ${percent.toFixed(
                1
              )}% dari budget harian dan telah dinaikkan menjadi Rp${newBudget.toLocaleString()}.`
            } else if (mode === 'time') {
              const nextUpdate = new Date(now + UPDATE_INTERVAL_MS)
              message = `Kampanye "${
                c.title
              }" diperbarui berdasarkan interval waktu.\nUpdate berikutnya sekitar ${nextUpdate.toLocaleTimeString()}.`
            }

            await chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('icons/logo128.png'),
              title:
                mode === 'percentage'
                  ? '📊 Batas Anggaran Tercapai'
                  : '⏰ Update Otomatis Berdasarkan Waktu',
              message,
            })

            notifiedCampaigns[c.id] = now
            await chrome.storage.local.set({ notifiedCampaigns })
          }

          chrome.runtime.sendMessage({
            type: 'CAMPAIGN_UPDATED',
            payload: { id: c.id, newBudget, title: c.title, percent },
          })

          updatedCampaigns.push({
            id: c.id,
            title: c.title,
            newBudget,
            percent,
          })
        } else {
          console.error('❌ Gagal update budget:', result)
        }
      }
    }

    if (updatedCampaigns.length > 0) {
      chrome.runtime.sendMessage({
        type: 'CAMPAIGNS_REFRESH',
        payload: updatedCampaigns,
      })
    }
  } catch (err) {
    console.error('❌ Error saat cek campaign:', err)
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkShopeeCampaigns') return
  const { extensionActive = true } = await chrome.storage.local.get(
    'extensionActive'
  )
  if (!extensionActive) return
  checkShopeeCampaigns()
})
