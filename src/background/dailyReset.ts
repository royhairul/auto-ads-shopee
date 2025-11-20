import {
  getShopeeCampaign,
  updateDailyBudget,
  getProfile,
  getActiveCampaignSpent,
} from '@/services/shopee'

// ==========================================================
// 🔹 Daily Reset Function
// ==========================================================
export async function handleDailyReset() {
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
