export interface ShopeeUser {
  userid: number
  username: string
  email: string
  portrait: string
  shopid: number
  phone: string
  nickname: string
  is_seller: boolean
}

export interface ShopeeCampaign {
  id: number
  title: string
  spent: number
  state: string
  daily_budget: number
}

export interface CampaignDailyBudget {
  budget_log_key: string
  cps: number | null
  is_allow_decrease: boolean | null
  low_threshold: number | null
  max: number
  min: number
  multiple: number
  previous_expense: number
  recommended: number
}
