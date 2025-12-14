import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Tooltip,
  Button,
  Image,
  Spinner,
  Switch,
  Select,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ButtonGroup,
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
  IconCircleDashedCheck,
  IconReload,
} from '@tabler/icons-react'
import {
  getProfile,
  getShopeeTodayData,
  getShopeeCampaign,
  formatScaledRupiah,
} from '@/services/shopee'
import StatsCard from '@/components/Sidepanel/StatsCard'
import CampaignList from '@/components/Sidepanel/CampaignList'
import type { ShopeeCampaign } from '@/types/shopee'
import { getActiveLive } from '@/services/shopee/live'
import ProfileSection from '@/components/Sidepanel/ProfileSection'

interface CampaignResponse {
  campaigns: ShopeeCampaign[]
}

export default function App() {
  const queryClient = useQueryClient()
  const [isDark, setIsDark] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ongoing')
  const [effectivenessThreshold, setEffectivenessThreshold] =
    useState<number>(20)

  // === Load Dark Mode & Extension Status dari Storage saat awal ===
  useEffect(() => {
    chrome.storage.local.get(['isDark', 'extensionActive'], (result) => {
      const darkMode = !!result.isDark
      const active = result.extensionActive ?? true
      setIsDark(darkMode)
      setIsActive(active)
      document.documentElement.classList.toggle('dark', darkMode)
    })

    chrome.storage.sync.get(['effectivenessThreshold'], (result) => {
      setEffectivenessThreshold(result.effectivenessThreshold ?? 20)
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

  const liveQuery = useQuery({
    queryKey: ['shopeeLive'],
    queryFn: getActiveLive,
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

  const handleRefresh = useCallback(async () => {
    // Refetch API
    await Promise.all([
      profileQuery.refetch(),
      todayQuery.refetch(),
      campaignQuery.refetch(),
    ])

    // Update effectiveness threshold dari storage
    const storageData: any = await new Promise((resolve) => {
      chrome.storage.sync.get(['effectivenessThreshold'], (result) =>
        resolve(result)
      )
    })

    setEffectivenessThreshold(storageData.effectivenessThreshold ?? 20)
    setLastRefreshed(new Date())
  }, [profileQuery, todayQuery, campaignQuery])

  useEffect(() => {
    campaignQuery.refetch()
  }, [filterStatus, campaignQuery])

  // === Force Check dari Background ===
  const handleForceCheck = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'FORCE_CHECK' })
    } catch (err) {
      console.error('❌ Gagal mengirim FORCE_CHECK:', err)
    }
  }

  // === Auto Refresh setiap 1 menit ===
  const intervalRef = useRef<number>(null)

  useEffect(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(handleRefresh, 60000)
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

        <ButtonGroup variant="flat" className="gap-1">
          <Button
            as="a"
            href="https://seller.shopee.co.id/"
            target="_blank"
            rel="noopener noreferrer"
            color="warning"
            radius="full"
            className="font-medium"
          >
            Buka Shopee Seller Center
          </Button>

          <Tooltip content="Reload Extension" placement="top">
            <Button
              isIconOnly
              onPress={() => chrome.runtime.reload()}
              className="text-default-500 hover:text-default-700 dark:text-gray-200 dark:hover:text-white"
            >
              <IconReload size={18} />
            </Button>
          </Tooltip>
        </ButtonGroup>
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

  // Hitung rata-rata efektivitas
  const activeCampaign = campaigns.filter((c) => c.state === 'ongoing')
  const totalGMV =
    (liveQuery.data?.reduce((acc, curr) => acc + curr.gmv, 0) ?? 0) * 100000

  const effectiveness =
    activeCampaign.length > 0 && todayQuery.data?.expenseToday > 0
      ? totalGMV / todayQuery.data?.expenseToday
      : 0

  // === UI Utama ===
  return (
    <div className="w-full p-3 flex flex-col items-start gap-3">
      {/* Toolbar */}
      <div className="w-full flex items-center justify-between gap-2">
        <Switch
          defaultSelected={isActive}
          onChange={toggleExtensionActive}
          aria-label="Activate extension"
          size="sm"
        />

        <div>
          <Tooltip content="Refresh data" placement="top">
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
          <Tooltip
            content={isDark ? 'Light mode' : 'Dark mode'}
            placement="top"
          >
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
          <Tooltip content="Pengaturan / Options" placement="top">
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
      <ProfileSection
        profile={profileQuery.data}
        profileLoading={profileQuery.isLoading}
        liveData={liveQuery.data}
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
        colorScheme={`${
          effectiveness < effectivenessThreshold ? 'danger' : 'default'
        }`}
        value={
          <div className="w-full flex justify-between font-semibold text-lg">
            <span>{formatScaledRupiah(todayQuery.data?.expenseToday)}</span>
            <Popover>
              <PopoverTrigger className="cursor-pointer">
                <span
                  className={`gap-2 flex items-center text-sm
                    ${
                      effectiveness >= effectivenessThreshold
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                >
                  {effectiveness < effectivenessThreshold ? (
                    <IconAlertTriangleFilled size={16} />
                  ) : (
                    <IconCircleDashedCheck size={16} />
                  )}
                  {effectiveness.toFixed(2)}
                </span>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2">
                  <div className="text-tiny flex gap-4 justify-between">
                    <span>GMV</span>
                    <span>{formatScaledRupiah(totalGMV)}</span>
                  </div>
                  <div className="text-tiny flex gap-4 justify-between">
                    <span>Biaya</span>
                    <span>
                      {formatScaledRupiah(todayQuery.data?.expenseToday)}
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
        loading={todayQuery.isLoading}
      />

      {/* Filter Status */}
      <div className="w-full flex justify-between items-center gap-2">
        <Select
          size="sm"
          variant="faded"
          selectedKeys={[filterStatus]}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="max-w-40"
          aria-label="Filter Status Campaign"
          disallowEmptySelection
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
        effectivenessThreshold={effectivenessThreshold}
        campaigns={filteredCampaigns}
        loading={campaignQuery.isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
