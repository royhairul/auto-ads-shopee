import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tooltip, Button, Image } from '@heroui/react'
import {
  IconRefresh,
  IconSun,
  IconMoon,
  IconWallet,
  IconHistory,
  IconAlertTriangleFilled,
  IconCash,
} from '@tabler/icons-react'

import {
  getProfile,
  getShopeeTodayData,
  getShopeeCampaign,
} from '@/services/shopee'
import ProfileCard from '@/components/Sidepanel/ProfileCard'
import StatsCard from '@/components/Sidepanel/StatsCard'
import CampaignList from '@/components/Sidepanel/CampaignList'
import type { ShopeeCampaign } from '@/types/shopee'

// ✅ Pastikan tipe respons terdefinisi dengan jelas
interface CampaignResponse {
  campaigns: ShopeeCampaign[]
}

export default function App() {
  const [isDark, setIsDark] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // === Mode gelap / terang ===
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const toggleDarkMode = () => setIsDark((prev) => !prev)

  // === React Query ===
  const profileQuery = useQuery({
    queryKey: ['shopeeProfile'],
    queryFn: getProfile,
  })

  const todayQuery = useQuery({
    queryKey: ['shopeeTodayData'],
    queryFn: getShopeeTodayData,
    refetchInterval: 300_000,
  })

  const campaignQuery = useQuery<CampaignResponse>({
    queryKey: ['shopeeCampaign'],
    queryFn: async () => {
      const data = await getShopeeCampaign()
      return { campaigns: data?.campaigns ?? [] }
    },
    refetchInterval: 600_000,
  })

  // === Handler Refresh ===
  const handleRefresh = async () => {
    await Promise.all([
      profileQuery.refetch(),
      todayQuery.refetch(),
      campaignQuery.refetch(),
    ])
    setLastRefreshed(new Date())
  }

  // === Error Handling ===
  if (profileQuery.isError || todayQuery.isError || campaignQuery.isError) {
    return (
      <div className="p-5">
        <p className="text-sm text-red-500 font-medium">
          ⚠️ Gagal memuat data Shopee. Pastikan Anda sudah login di Shopee Web.
        </p>
      </div>
    )
  }

  // === Cek jika belum login Shopee ===
  if (!profileQuery.data?.is_seller) {
    return (
      <div className="mt-10 p-5 flex flex-col gap-3 items-center text-center">
        <Image
          src="/icons/logo128.png"
          alt="Shopee Logo"
          className="w-16 h-16 object-contain"
        />

        <h1 className="px-4 py-1 rounded-2xl text-lg font-semibold ">
          Anda Belum Login
        </h1>
        <p className="text-xs text-default-500 max-w-[220px]">
          Silakan login ke akun Shopee Seller Anda untuk menampilkan data iklan.
        </p>

        <Button
          as="a"
          href="https://seller.shopee.co.id/"
          target="_blank"
          rel="noopener noreferrer"
          color="warning"
          radius="full"
          variant="flat"
          className="mt-2 font-medium"
        >
          Buka Shopee Seller Center
        </Button>
      </div>
    )
  }

  // === Deteksi saldo habis ===
  const isSaldoHabis =
    !todayQuery.isLoading && (todayQuery.data?.accountBalance ?? 0) <= 0

  return (
    <div className="relative w-full p-5 mt-6 flex flex-col items-start gap-5">
      {/* Toolbar kanan atas */}
      <div className="absolute top-2 right-2 flex gap-2">
        <Tooltip content="Refresh data">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleRefresh}
            className="text-default-500 hover:text-default-700 dark:text-gray-200 dark:hover:text-white"
          >
            <IconRefresh size={18} />
          </Button>
        </Tooltip>

        <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={toggleDarkMode}
            className="text-default-500 hover:text-default-700 dark:text-gray-200 dark:hover:text-white"
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </Button>
        </Tooltip>
      </div>

      {/* Profil */}
      <ProfileCard
        profile={profileQuery.data}
        loading={profileQuery.isLoading}
      />

      {/* Stats Saldo */}
      <StatsCard
        title="Saldo Iklan"
        icon={IconWallet}
        value={todayQuery.data?.accountBalance}
        loading={todayQuery.isLoading}
        colorScheme="amber"
        footer={
          isSaldoHabis && (
            <div className="text-xs flex items-center gap-2 text-red-500 font-medium">
              <IconAlertTriangleFilled size={16} />
              Semua iklan telah dijeda karena saldo habis.
            </div>
          )
        }
      />

      {/* Stats Biaya Hari Ini */}
      <StatsCard
        title="Biaya Hari Ini"
        icon={IconCash}
        value={todayQuery.data?.expenseToday}
        loading={todayQuery.isLoading}
        colorScheme="rose"
        footer={
          <>
            {lastRefreshed && (
              <p className="ml-auto flex gap-2 items-center text-xs text-default-500">
                <IconHistory size={14} />
                <span>{lastRefreshed.toLocaleTimeString()}</span>
              </p>
            )}

            {/* ✅ Pastikan CampaignList tidak error walau data kosong */}
            <CampaignList
              campaigns={campaignQuery.data?.campaigns ?? []}
              loading={campaignQuery.isLoading}
            />
          </>
        }
      />
    </div>
  )
}
