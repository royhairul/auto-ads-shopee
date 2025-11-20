import {
  getShopeeCampaign,
  updateDailyBudget,
  getProfile,
  getShopeeTodayData,
} from '@/services/shopee'
import { getActiveLive } from '@/services/shopee/live'
import { handleDailyReset } from './dailyReset'
import { clearAlarm } from './alarms'
import {
  ANTI_DOUBLE_UPDATE_MINUTES,
  DEFAULT_BUDGET_THRESHOLD,
  DEFAULT_UPDATE_INTERVAL,
  DEFAULT_NOTIFICATION_COOLDOWN,
  DEFAULT_EFFECTIVENESS_THRESHOLD,
  DEFAULT_MODE,
  DEFAULT_DAILY_BUDGET,
} from './constants'

// ==========================================================
// 🔹 Campaign Check Routine (anti-double update)
// ==========================================================
export async function checkShopeeCampaigns() {
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

  // ================================================
  // 🔍 Ambil pengaturan dailyBudget dulu
  // ================================================
  const { dailyBudget = DEFAULT_DAILY_BUDGET } = await chrome.storage.sync.get([
    'dailyBudget',
  ])

  // ================================================
  // 🔍 Pengecekan saldo dulu
  // ================================================
  let todayData
  try {
    todayData = await getShopeeTodayData()
    if (!todayData) {
      console.log('[BG] Gagal ambil saldo → Skip update campaign.')
      return // skip update saat ini, alarm berikutnya tetap jalan
    }

    const balance = todayData.accountBalance / 100000
    if (balance <= 0 || balance <= dailyBudget) {
      console.log(
        `[BG] Saldo tidak cukup (Rp${balance.toLocaleString()}) → Skip update campaign.`
      )
      return // skip update saat ini, alarm berikutnya tetap jalan
    }

    console.log(`[BG] Saldo tersedia: Rp${balance.toLocaleString()}`)
  } catch (err) {
    console.error('[BG] Gagal ambil saldo:', err)
    return // skip update saat ini
  }

  // ================================================
  // 🔍 Tambahkan pengecekan live terlebih dahulu
  // ================================================
  try {
    const actives = await getActiveLive().catch(() => [])

    if (!actives || actives.length === 0) {
      console.log('[BG] Tidak ada LIVE aktif → Stop semua proses update.')
      return
    }

    console.log(`[BG] Ada ${actives.length} live aktif — lanjut cek campaign`)
  } catch (err) {
    console.error('[BG] Error saat cek live:', err)
    return
  }

  // =======================================================
  // 🔽 Setelah ini lakukan cek campaign seperti biasa 🔽
  // =======================================================
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
      notificationCooldown = DEFAULT_NOTIFICATION_COOLDOWN,
      notificationEnabled = true,
      effectivenessThreshold = DEFAULT_EFFECTIVENESS_THRESHOLD, // 🔹 Ambang efektivitas
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

      const currentBudget = c.daily_budget / 100000
      const newBudget = currentBudget + dailyBudget
      const budgetDifference = newBudget - currentBudget

      // 🔹 Khusus mode "time": cek apakah selisih antara budget baru dan current masih < dailyBudget
      if (mode === 'time' && budgetDifference >= dailyBudget) {
        console.log(
          `⏸️ Skip ${
            c.title
          } (mode: time) — selisih budget (Rp${budgetDifference.toLocaleString()}) sudah mencapai atau melebihi Rp${dailyBudget.toLocaleString()}`
        )
        continue
      }

      console.log(
        `💰 Update ${
          c.title
        } dari Rp${currentBudget.toLocaleString()} → Rp${newBudget.toLocaleString()}`
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
