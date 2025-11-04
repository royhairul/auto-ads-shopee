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
    return null
  }
}
