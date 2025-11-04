import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Tooltip,
  Button,
  Image,
  Spinner,
  Switch,
  Select,
  SelectItem,
} from '@heroui/react'
import {
  IconRefresh,
  IconSun,
  IconMoon,
  IconWallet,
  IconSettings2,
  IconHistory,
  IconAlertTriangleFilled,
  IconCash,
  IconSquareRoundedPlusFilled,
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

interface CampaignResponse {
  campaigns: ShopeeCampaign[]
}

export default function App() {
  const queryClient = useQueryClient()
  const [isDark, setIsDark] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ongoing')

  // === Load Dark Mode & Extension Status dari Storage saat awal ===
  useEffect(() => {
    chrome.storage.local.get(['isDark', 'extensionActive'], (result) => {
      const darkMode = !!result.isDark
      const active = result.extensionActive ?? true
      setIsDark(darkMode)
      setIsActive(active)
      document.documentElement.classList.toggle('dark', darkMode)
    })
  }, [])

  // === Sinkronisasi Dark Mode ke DOM & Storage ===
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    chrome.storage.local.set({ isDark })
  }, [isDark])

  // === Toggle Extension Active ===
  const toggleExtensionActive = () => {
    const newValue = !isActive
    setIsActive(newValue)
    chrome.runtime.sendMessage({
      type: 'SET_EXTENSION_ACTIVE',
      payload: newValue,
    })
  }

  const toggleDarkMode = () => setIsDark((prev) => !prev)

  // === React Query ===
  const profileQuery = useQuery({
    queryKey: ['shopeeProfile'],
    queryFn: getProfile,
    refetchInterval: 300_000,
  })

  const todayQuery = useQuery({
    queryKey: ['shopeeTodayData'],
    queryFn: getShopeeTodayData,
    refetchInterval: 300_000,
  })

  const campaignQuery = useQuery<CampaignResponse>({
    queryKey: ['shopeeCampaign', filterStatus],
    queryFn: async () => {
      const data = await getShopeeCampaign(filterStatus)
      return { campaigns: data?.campaigns ?? [] }
    },
    refetchInterval: 600_000,
  })

  const campaigns = campaignQuery.data?.campaigns ?? []
  const filteredCampaigns =
    filterStatus === 'all'
      ? campaigns
      : campaigns.filter((c) => c.state === filterStatus)

  // === Manual Refresh Handler ===
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      profileQuery.refetch(),
      todayQuery.refetch(),
      campaignQuery.refetch(),
    ])
    setLastRefreshed(new Date())
  }, [profileQuery, todayQuery, campaignQuery])

  useEffect(() => {
    campaignQuery.refetch()
  }, [filterStatus])

  // === Force Check dari Background ===
  const handleForceCheck = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'FORCE_CHECK' })
    } catch (err) {
      console.error('❌ Gagal mengirim FORCE_CHECK:', err)
    }
  }

  // === Auto Refresh setiap 5 menit ===
  useEffect(() => {
    const interval = setInterval(handleRefresh, 300_000)
    return () => clearInterval(interval)
  }, [handleRefresh])

  // === Listener pesan dari Background ===
  useEffect(() => {
    const handleMessage = (msg: any) => {
      if (msg.type === 'CAMPAIGN_UPDATED' || msg.type === 'CAMPAIGNS_REFRESH') {
        queryClient.invalidateQueries({ queryKey: ['shopeeCampaign'] })
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [queryClient])

  // === Render states error / loading / belum login ===
  if (profileQuery.isError || todayQuery.isError || campaignQuery.isError) {
    return (
      <div className="p-5 text-center">
        <p className="text-sm text-red-500 font-medium">
          ⚠️ Gagal memuat data Shopee. Pastikan Anda sudah login di Shopee Web.
        </p>
        <Button color="warning" onPress={handleForceCheck} className="mt-3">
          Coba Cek Ulang
        </Button>
      </div>
    )
  }

  if (!profileQuery.data?.is_seller) {
    return (
      <div className="mt-10 py-5 px-3 flex flex-col gap-3 items-center text-center">
        <Image
          src="/icons/logo128.png"
          alt="Shopee Logo"
          className="w-16 h-16 object-contain"
        />
        <h1 className="px-4 py-1 rounded-2xl text-lg font-semibold">
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

  if (
    profileQuery.isLoading ||
    todayQuery.isLoading ||
    campaignQuery.isLoading
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] gap-3">
        <Spinner color="warning" />
        <p className="text-sm text-default-500">Memuat data Shopee...</p>
      </div>
    )
  }

  const isSaldoHabis = (todayQuery.data?.accountBalance ?? 0) <= 0

  // === UI Utama ===
  return (
    <div className="w-full p-5 mt-6 flex flex-col items-start gap-5">
      {/* Toolbar */}
      <div className="w-full flex items-center justify-between gap-2">
        <Switch
          defaultSelected={isActive}
          onChange={toggleExtensionActive}
          aria-label="Activate extension"
          size="sm"
        />

        <div>
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
          <Tooltip content="Pengaturan / Options">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => chrome.runtime.openOptionsPage()}
              className="text-default-500 hover:text-default-700 dark:text-gray-200 dark:hover:text-white"
            >
              <IconSettings2 size={18} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Profil */}
      <ProfileCard
        profile={profileQuery.data}
        loading={profileQuery.isLoading}
      />

      {/* Stats */}
      <StatsCard
        title="Saldo Iklan"
        icon={IconWallet}
        value={todayQuery.data?.accountBalance}
        loading={todayQuery.isLoading}
        colorScheme="warning"
        action={
          <Button
            color="warning"
            as="a"
            href="https://seller.shopee.co.id/portal/marketing/pas/top-up"
            target="_blank"
            startContent={<IconSquareRoundedPlusFilled />}
            className="text-white"
          >
            Top Up
          </Button>
        }
        footer={
          isSaldoHabis && (
            <div className="text-xs flex items-center gap-2 text-red-500 font-medium">
              <IconAlertTriangleFilled size={16} />
              Semua iklan telah dijeda karena saldo habis.
            </div>
          )
        }
      />

      <StatsCard
        title="Biaya Hari Ini"
        icon={IconCash}
        value={todayQuery.data?.expenseToday}
        loading={todayQuery.isLoading}
        colorScheme="danger"
      />

      {/* Filter Status */}
      <div className="w-full flex justify-between items-center gap-2">
        <Select
          label="Status"
          size="sm"
          variant="faded"
          selectedKeys={[filterStatus]}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="max-w-[160px]"
        >
          <SelectItem key="all">Semua</SelectItem>
          <SelectItem key="ongoing">Berjalan</SelectItem>
          <SelectItem key="paused">Dijeda</SelectItem>
          <SelectItem key="ended">Berakhir</SelectItem>
        </Select>

        {lastRefreshed && (
          <p className="ml-auto flex gap-2 items-center text-xs text-default-500">
            <IconHistory size={14} />
            <span>{lastRefreshed.toLocaleTimeString()}</span>
          </p>
        )}
      </div>

      {/* Campaign List di luar StatsCard */}
      <CampaignList
        campaigns={filteredCampaigns}
        loading={campaignQuery.isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
