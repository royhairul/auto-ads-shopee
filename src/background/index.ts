import {
  getShopeeCampaign,
  updateDailyBudget,
  getProfile,
} from '@/services/shopee'

const NOTIFICATION_COOLDOWN = 30 * 60 * 1000 // 30 menit
const BUDGET_THRESHOLD = 98

async function checkShopeeCampaigns() {
  console.log('[BG] Alarm triggered → Cek campaign Shopee')

  try {
    // === 🧩 Pastikan user sudah login Shopee dulu ===
    const profile = await getProfile().catch(() => null)

    if (!profile || !profile.is_seller) {
      console.warn('[BG] Tidak ada akun Shopee aktif — hentikan alarm.')

      // 🔕 Hentikan alarm agar tidak terus berjalan
      await chrome.alarms.clear('checkShopeeCampaigns')
      console.log('[BG] Alarm "checkShopeeCampaigns" berhasil dihentikan.')

      return // berhenti di sini, tidak lanjut ke pengecekan campaign
    }

    // === Ambil daftar campaign ===
    const { campaigns } = await getShopeeCampaign()
    if (!campaigns || campaigns.length === 0) {
      console.log('[BG] Tidak ada campaign aktif.')
      return
    }

    const now = Date.now()
    const { notifiedCampaigns = {} } = await chrome.storage.local.get(
      'notifiedCampaigns'
    )

    for (const c of campaigns) {
      const percent = (c.spent / c.daily_budget) * 100
      const lastNotified = notifiedCampaigns[c.id] || 0
      const cooldownPassed = now - lastNotified > NOTIFICATION_COOLDOWN

      if (percent >= BUDGET_THRESHOLD) {
        console.log(
          `⚠️ ${c.title} sudah ${percent.toFixed(1)}% dari budget harian.`
        )

        if (cooldownPassed) {
          // === Perhitungan budget baru ===
          const newBudget = c.daily_budget / 100000 + 5000
          console.log(
            `💰 Meningkatkan budget ${c.title} dari ${c.daily_budget} → ${newBudget}`
          )

          const result = await updateDailyBudget(c.id, newBudget)

          if (result?.code === 0) {
            await chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('icons/logo128.png'),
              title: 'Shopee Campaign Budget Diperbarui',
              message: `${
                c.title
              } naik jadi Rp${newBudget.toLocaleString()} (auto-update karena ${percent.toFixed(
                1
              )}%).`,
            })
          } else {
            console.error('❌ Gagal update budget:', result)
          }

          notifiedCampaigns[c.id] = now
          await chrome.storage.local.set({ notifiedCampaigns })
        } else {
          console.log(`⏳ Skip auto-update ${c.title}, masih dalam cooldown.`)
        }
      }
    }
  } catch (err) {
    console.error('❌ Error saat cek campaign:', err)
  }
}

// === Listener alarm tetap aktif di background ===
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkShopeeCampaigns') checkShopeeCampaigns()
})

// === Buat alarm ketika extension pertama kali di-install ===
chrome.runtime.onInstalled.addListener(() => {
  console.log('🧩 Extension installed, membuat alarm...')
  chrome.alarms.create('checkShopeeCampaigns', {
    delayInMinutes: 0.1,
    periodInMinutes: 0.1, // setiap 6 detik (testing)
  })
})

// === Aktifkan kembali alarm saat browser dibuka ulang ===
chrome.runtime.onStartup.addListener(() => {
  console.log('🔁 Browser dimulai ulang, memastikan alarm aktif...')
  chrome.alarms.create('checkShopeeCampaigns', {
    delayInMinutes: 0.1,
    periodInMinutes: 0.1,
  })
})
