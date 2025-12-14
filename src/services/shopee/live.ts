import { ShopeeLiveData } from '@/types/shopee'
import { logError } from '@/background/logger'

export async function getActiveLive(): Promise<ShopeeLiveData[]> {
  const url = `https://creator.shopee.co.id/supply/api/lm/sellercenter/realtime/sessionList?page=1&pageSize=10&name=&orderBy=&sort=`

  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Gagal mengambil data Shopee Live')
    }

    const json = await res.json()
    const listLive = json?.data?.list ?? []

    const mapped: ShopeeLiveData[] = listLive
      .filter((live: any) => live.status === 1)
      .map((live: any) => ({
        sessionId: live.sessionId,
        title: live.title,
        status: live.status,
        link: `https://creator.shopee.co.id/dashboard/live/${live.sessionId}`,
        gmv: live.placedSales,
        view: live.viewers,
      }))

    return mapped
  } catch (err) {
    console.error('Error getActiveLive:', err)
    await logError(err, { function: 'getActiveLive', url })
    return []
  }
}
