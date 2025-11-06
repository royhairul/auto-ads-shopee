import {
  getShopeeCampaign,
  updateDailyBudget,
  getProfile,
  getActiveCampaignSpent,
} from '@/services/shopee'

// ==========================================================
// 🔹 Global Configurable Constants
// ==========================================================

// Interval waktu anti double update (dalam menit)
const ANTI_DOUBLE_UPDATE_MINUTES: number = 3

// Default interval pengecekan campaign untuk createAlarm (menit)
const DEFAULT_ALARM_INTERVAL_MINUTES: number = 1

// Default mode trigger
const DEFAULT_MODE: string = 'percentage'

// Default batas threshold persentase anggaran
const DEFAULT_BUDGET_THRESHOLD: number = 98

// Default interval update otomatis (menit)
const DEFAULT_UPDATE_INTERVAL: number = 10

// Default nilai budget tambahan
const DEFAULT_DAILY_BUDGET: number = 5000

// Default nilai budget tambahan
const DEFAULT_EFFECTIVENESS_THRESHOLD: number = 20

// Default cooldown notifikasi (menit)
const DEFAULT_NOTIFICATION_COOLDOWN: number = 5

// ==========================================================
// 🔹 Lifecycle Events
// ==========================================================
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
    console.log('🔁 Browser dimulai ulang → extension aktif, membuat alarm...')
    createAlarm()
  } else {
    console.log(
      '🔁 Browser dimulai ulang → extension nonaktif, alarm tidak dibuat.'
    )
  }
})

// ==========================================================
// 🔹 Alarm Management
// ==========================================================
function createAlarm() {
  chrome.alarms.create('checkShopeeCampaigns', {
    delayInMinutes: DEFAULT_ALARM_INTERVAL_MINUTES,
    periodInMinutes: DEFAULT_ALARM_INTERVAL_MINUTES,
  })
  console.log('✅ Alarm checkShopeeCampaigns dibuat atau diperbarui.')
}

function clearAlarm() {
  chrome.alarms.clear('checkShopeeCampaigns', (wasCleared) => {
    if (wasCleared) console.log('🛑 Alarm checkShopeeCampaigns dihapus.')
  })
}

// ==========================================================
// 🔹 Global Error Handlers
// ==========================================================
self.onerror = (message, _source, _lineno, _colno, error) => {
  console.error('🌋 Uncaught error:', message, error)
  return true
}

self.onunhandledrejection = (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
  event.preventDefault()
}

// ==========================================================
// 🔹 Runtime Message Handler
// ==========================================================
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  const { type, payload } = message

  if (type === 'SET_EXTENSION_ACTIVE') {
    const active = payload
    const today = new Date().toDateString()
    const { lastActiveDate } = await chrome.storage.local.get('lastActiveDate')

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
})

// ==========================================================
// 🔹 Daily Reset Function
// ==========================================================
async function handleDailyReset() {
  try {
    const profile = await getProfile().catch(() => null)
    if (!profile || !profile.is_seller) {
      console.warn('[RESET] Tidak ada akun Shopee aktif.')
      return
    }

    const { campaigns } = await getShopeeCampaign()
    if (!campaigns?.length) return

    console.log(
      '🔄 Reset harian: set ulang semua campaign ke minimalBudget Shopee.'
    )

    for (const campaign of campaigns) {
      try {
        const spentInfo = await getActiveCampaignSpent({
          reference_id: '0ae48242-4774-47b7-8b9e-0c0faa61f299',
          campaign_id_list: [Number(campaign.id)],
        })

        const minimalBudget = spentInfo?.min
        if (!minimalBudget) {
          console.warn(
            `⚠️ Tidak menemukan minimalBudget untuk ${campaign.title}, lewati.`
          )
          continue
        }

        const result = await updateDailyBudget(
          campaign.id,
          minimalBudget / 100000
        )
        if (result?.code === 0) {
          console.log(
            `✅ ${campaign.title} direset ke minimalBudget Rp${
              minimalBudget / 100000
            }`
          )
        } else {
          console.error(`❌ Gagal reset ${campaign.title}:`, result)
        }
      } catch (err) {
        console.error(`💥 Error saat reset ${campaign.title}:`, err)
      }
    }

    await chrome.storage.local.set({ notifiedCampaigns: {} })
    await chrome.storage.sync.set({ lastUpdateTime: 0 })

    console.log('🎯 Reset harian selesai.')
  } catch (err) {
    console.error('💥 Error saat reset harian:', err)
  }
}

// ==========================================================
// 🔹 Campaign Check Routine (anti-double update)
// ==========================================================
async function checkShopeeCampaigns() {
  const {
    extensionActive = true,
    lastActiveDate,
    firstInstallDone,
  } = await chrome.storage.local.get([
    'extensionActive',
    'lastActiveDate',
    'firstInstallDone',
  ])

  if (!extensionActive) return

  const today = new Date().toDateString()

  if (firstInstallDone && lastActiveDate !== today) {
    console.log('[BG] New Day → Reset Daily Budget...')
    await handleDailyReset()
    await chrome.storage.local.set({ lastActiveDate: today })
  }

  console.log('[BG] Alarm triggered → Cek campaign Shopee')

  try {
    const profile = await getProfile().catch(() => null)
    if (!profile || !profile.is_seller) {
      console.warn('[BG] Tidak ada akun Shopee aktif — hentikan alarm.')
      clearAlarm()
      return
    }

    const {
      budgetThreshold = DEFAULT_BUDGET_THRESHOLD,
      updateInterval = DEFAULT_UPDATE_INTERVAL,
      dailyBudget = DEFAULT_DAILY_BUDGET,
      notificationCooldown = DEFAULT_NOTIFICATION_COOLDOWN,
      notificationEnabled = true,
      effectivenessThreshold = DEFAULT_EFFECTIVENESS_THRESHOLD, // 🔹 Ambil ambang efektivitas
      mode = DEFAULT_MODE,
      lastUpdateTime = 0,
    } = await chrome.storage.sync.get([
      'budgetThreshold',
      'updateInterval',
      'dailyBudget',
      'notificationCooldown',
      'notificationEnabled',
      'effectivenessThreshold',
      'mode',
      'lastUpdateTime',
    ])

    const NOTIFICATION_COOLDOWN = notificationCooldown * 60 * 1000
    const UPDATE_INTERVAL_MS = updateInterval * 60 * 1000
    const ANTI_DOUBLE_UPDATE_MS = ANTI_DOUBLE_UPDATE_MINUTES * 60 * 1000
    const now = Date.now()

    console.log(
      `[BG] Mode: ${mode} | threshold: ${budgetThreshold}% | efektivitas: ${effectivenessThreshold} | interval: ${updateInterval}m`
    )

    const { campaigns } = await getShopeeCampaign()
    if (!campaigns?.length) return

    const {
      notifiedCampaigns = {},
      updatedCampaignsMap = {},
      lastBudgets = {},
    } = await chrome.storage.local.get([
      'notifiedCampaigns',
      'updatedCampaignsMap',
      'lastBudgets',
    ])

    const updatedCampaigns = []

    for (const c of campaigns) {
      const percent = (c.spent / c.daily_budget) * 100
      const lastNotified = notifiedCampaigns[c.id] || 0
      const lastUpdated = updatedCampaignsMap[c.id] || 0
      const lastBudget = lastBudgets[c.id] || 0
      const cooldownPassed = now - lastNotified > NOTIFICATION_COOLDOWN

      // ==================================================
      // 🔸 CEK EFEKTIVITAS IKLAN RENDAH
      // ==================================================
      if (
        c.report.roas !== undefined &&
        c.report.roas < effectivenessThreshold
      ) {
        if (notificationEnabled && cooldownPassed) {
          console.warn(
            `⚠️ Efektivitas rendah (${c.report.roas}) pada ${c.title}`
          )

          await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo128.png'),
            title: '⚠️ Efektivitas Iklan Rendah',
            message: `Efektivitas campaign "${
              c.title
            }" hanya ${c.report.roas.toFixed(
              2
            )}, lebih rendah daripada ${effectivenessThreshold}. Pertimbangkan optimasi.`,
          })

          notifiedCampaigns[c.id] = now
          await chrome.storage.local.set({ notifiedCampaigns })
        }
      }

      // ==================================================
      // 🔸 LOGIKA UPDATE BUDGET
      // ==================================================
      let shouldUpdate = false

      if (mode === 'percentage') {
        shouldUpdate = percent >= budgetThreshold
      } else if (mode === 'time') {
        shouldUpdate = now - lastUpdateTime >= UPDATE_INTERVAL_MS
      } else if (mode === 'combined') {
        shouldUpdate =
          percent >= budgetThreshold ||
          now - lastUpdateTime >= UPDATE_INTERVAL_MS
      }

      const recentlyUpdated = now - lastUpdated < ANTI_DOUBLE_UPDATE_MS
      if (recentlyUpdated || c.daily_budget <= lastBudget) {
        console.log(
          `⏸️ Skip ${c.title} — sudah diperbarui dalam ${ANTI_DOUBLE_UPDATE_MINUTES} menit terakhir.`
        )
        continue
      }

      if (!shouldUpdate) continue

      const newBudget = c.daily_budget / 100000 + dailyBudget
      console.log(
        `💰 Update ${c.title} dari Rp${(
          c.daily_budget / 100000
        ).toLocaleString()} → Rp${newBudget.toLocaleString()}`
      )

      const result = await updateDailyBudget(c.id, newBudget)
      if (result?.code === 0) {
        console.log(`✅ Budget ${c.title} berhasil diperbarui.`)

        updatedCampaignsMap[c.id] = now
        lastBudgets[c.id] = newBudget

        if (mode === 'time' || mode === 'combined') {
          await chrome.storage.sync.set({ lastUpdateTime: now })
        }

        if (notificationEnabled && cooldownPassed) {
          const title =
            mode === 'percentage' ||
            (mode === 'combined' && percent >= budgetThreshold)
              ? '📊 Batas Anggaran Tercapai'
              : '⏰ Update Berdasarkan Interval'

          const message =
            title === '📊 Batas Anggaran Tercapai'
              ? `Campaign "${c.title}" mencapai ${percent.toFixed(
                  1
                )}% dari budget harian dan telah dinaikkan menjadi Rp${newBudget.toLocaleString()}.`
              : `Campaign "${
                  c.title
                }" diperbarui otomatis berdasarkan waktu.\nUpdate berikutnya sekitar ${new Date(
                  now + UPDATE_INTERVAL_MS
                ).toLocaleTimeString()}.`

          await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/logo128.png'),
            title,
            message,
          })

          notifiedCampaigns[c.id] = now
        }

        await chrome.storage.local.set({
          notifiedCampaigns,
          updatedCampaignsMap,
          lastBudgets,
        })

        chrome.runtime.sendMessage({
          type: 'CAMPAIGN_UPDATED',
          payload: { id: c.id, newBudget, title: c.title, percent },
        })

        updatedCampaigns.push({ id: c.id, title: c.title, newBudget, percent })
      } else {
        console.error('❌ Gagal update budget:', result)
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

// ==========================================================
// 🔹 Alarm Listener
// ==========================================================
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkShopeeCampaigns') return
  const { extensionActive = true } = await chrome.storage.local.get(
    'extensionActive'
  )
  if (!extensionActive) return
  checkShopeeCampaigns()
})
