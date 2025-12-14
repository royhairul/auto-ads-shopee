import type {
  CampaignDailyBudget,
  ShopeeCampaign,
  ShopeeUser,
} from '@/types/shopee'
import { logError } from '@/background/logger'

// === [UTILS] Shopee API & Helper ===
export function formatScaledRupiah(value: number | null | undefined) {
  if (!value || isNaN(value)) return 'Rp0'
  const scaled = Math.floor(value / 100_000)
  return `Rp${scaled.toLocaleString('id-ID')}`
}

// === Ambil data profile Shopee ===
export async function getProfile(): Promise<ShopeeUser | null> {
  const url = 'https://shopee.co.id/api/v4/account/basic/get_account_info'
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const json = await res.json()
    return json?.data as ShopeeUser
  } catch (error) {
    console.error('[EXT] Error mengambil data profile:', error)
    await logError(error, { function: 'getProfile', url })
    return null
  }
}

// === Ambil data saldo & pengeluaran hari ini ===
export async function getShopeeTodayData() {
  const url =
    'https://seller.shopee.co.id/api/pas/v1/meta/get_ads_data/?SPC_CDS=b6be0576-3372-4ae7-8782-9da0f4815c2f&SPC_CDS_VER=2'
  const body = {
    info_type_list: [
      'ads_expense',
      'ads_account',
      'ads_credit',
      'campaign_day',
    ],
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const json = await res.json()
    const data = json?.data
    if (!data) return null
    return {
      expenseToday: data?.ads_expense?.ads_expense_today ?? 0,
      accountBalance: data?.ads_credit?.app_detail?.live_available_balance ?? 0,
      raw: json,
    }
  } catch (err) {
    console.error('❌ [UTIL] Gagal ambil Shopee Today Data:', err)
    await logError(err, { function: 'getShopeeTodayData', url })
    return null
  }
}

// === Ambil daftar campaign Shopee ===
export async function getShopeeCampaign(
  status: string | null = 'ongoing'
): Promise<{ campaigns: ShopeeCampaign[] }> {
  const url =
    'https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=b6be0576-3372-4ae7-8782-9da0f4815c2f&SPC_CDS_VER=2'

  const now = new Date()
  const start_time = Math.floor(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    ).getTime() / 1000
  )
  const end_time = Math.floor(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    ).getTime() / 1000
  )

  const body = {
    start_time,
    end_time,
    filter_list: [
      {
        campaign_type: 'live_stream_homepage',
        state: status, // ambil dari parameter
        search_term: '',
        is_valid_rebate_only: false,
      },
    ],
    offset: 0,
    limit: 20,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    const json = await res.json()
    const entryList = json?.data?.entry_list ?? []

    // 🔹 Ambil semua campaign dasar
    let campaigns: ShopeeCampaign[] = entryList.map((entry: any) => {
      const broad_gmv = entry.report?.broad_gmv ?? 0
      const direct_gmv = entry.report?.direct_gmv ?? 0
      const spent = entry.report?.cost ?? 0

      return {
        id: entry.campaign?.campaign_id ?? entry.id ?? 0,
        title: entry.title ?? 'Untitled Campaign',
        spent,
        state: entry.state ?? 'paused',
        daily_budget: entry.campaign?.daily_budget ?? 0,
        report: {
          broad_gmv,
          direct_gmv,
          roas: spent > 0 ? broad_gmv / spent : 0,
        },
      }
    })

    // 🔹 Update spent untuk campaign ongoing (gunakan Promise.all agar paralel)
    await Promise.all(
      campaigns.map(async (item) => {
        if (item.state === 'ongoing') {
          try {
            const budget = await getActiveCampaignSpent({
              reference_id: '0ae48242-4774-47b7-8b9e-0c0faa61f299',
              campaign_id_list: [Number(item.id)],
            })
            if (budget) {
              item.spent = budget.previous_expense
            }
          } catch (err) {
            console.warn(`⚠️ Gagal ambil spent untuk campaign ${item.id}`, err)
          }
        }
        return item
      })
    )

    // 🔹 Filter berdasarkan parameter (misal 'ongoing', 'paused', dll)
    // const filtered = updatedCampaigns.filter((c) => c.state === status)

    return { campaigns }
  } catch (err) {
    console.error('❌ [UTIL] Gagal ambil campaign Shopee:', err)
    await logError(err, { function: 'getShopeeCampaign', status, url })
    return { campaigns: [] }
  }
}

// === Ambil data spent & budget untuk campaign aktif ===
export interface GetBudgetRequest {
  reference_id: string
  campaign_id_list: number[]
}

export async function getActiveCampaignSpent(
  payload: GetBudgetRequest
): Promise<CampaignDailyBudget | null> {
  try {
    const response = await fetch(
      'https://seller.shopee.co.id/api/pas/v1/setup_helper/get_budget_data_for_edit/?SPC_CDS=b6be0576-3372-4ae7-8782-9da0f4815c2f&SPC_CDS_VER=2',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    )

    const json = await response.json()
    const daily = json?.data?.daily_budget

    if (!daily) return null

    const campaignDailyBudget: CampaignDailyBudget = {
      budget_log_key: daily.budget_log_key || '',
      cps: daily.cps?.min_budget ?? null,
      is_allow_decrease: daily.is_allow_decrease ?? null,
      low_threshold: daily.low_threshold ?? null,
      max: daily.max ?? 0,
      min: daily.min ?? 0,
      multiple: daily.multiple ?? 0,
      previous_expense: daily.previous_expense ?? 0,
      recommended: daily.recommended ?? 0,
    }

    return campaignDailyBudget
  } catch (error) {
    console.error('❌ [UTIL] Gagal fetch budget campaign:', error)
    await logError(error, {
      function: 'getActiveCampaignSpent',
      campaignIds: payload.campaign_id_list,
    })
    return null
  }
}

// === Edit Daily Budget Campaign ===
export async function updateDailyBudget(
  campaignId: number,
  dailyBudgetRupiah: number
) {
  const url =
    'https://seller.shopee.co.id/api/pas/v1/live_stream/edit/?SPC_CDS=dbd99780-6514-4ccf-81a8-23a0ec0e881e&SPC_CDS_VER=2'

  const dailyBudgetMicro = dailyBudgetRupiah * 100000

  const payload = {
    campaign_id: campaignId,
    type: 'change_budget',
    change_budget: {
      page: 'page_homepage',
      daily_budget: dailyBudgetMicro,
      budget_log_key: '',
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    return await res.json()
  } catch (err) {
    console.error('❌ [UTIL] Gagal ubah budget campaign:', err)
    await logError(err, {
      function: 'updateDailyBudget',
      campaignId,
      dailyBudgetRupiah,
    })
    return null
  }
}

export async function updateStatusCampaign(campaignId: number, status: string) {
  const payload = {
    campaign_id: campaignId,
    type: status,
    header: {},
  }

  try {
    const response = await fetch(
      'https://seller.shopee.co.id/api/pas/v1/live_stream/edit/?SPC_CDS=050e1e2c-14da-4838-ac1e-4e4420f9ff45&SPC_CDS_VER=2',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    )

    return await response.json()
  } catch (error) {
    console.error('❌ [UTIL] Gagal update status campaign:', error)
    await logError(error, {
      function: 'updateStatusCampaign',
      campaignId,
      status,
    })
    return null
  }
}
