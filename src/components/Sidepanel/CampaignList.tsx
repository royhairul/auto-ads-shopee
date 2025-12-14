import { ShopeeCampaign } from '@/types/shopee'
import SkeletonStack from './SkeletonStack'
import { formatScaledRupiah } from '@/services/shopee'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Spinner,
  Tooltip,
  Link,
  Progress,
} from '@heroui/react'
import {
  IconPlayerStopFilled,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconReload,
  IconCaretDownFilled,
} from '@tabler/icons-react'
import { useState } from 'react'
import { updateStatusCampaign } from '@/services/shopee'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  campaigns?: ShopeeCampaign[]
  loading?: boolean
  onRefresh?: () => void
  effectivenessThreshold: number
}

type UpdatingState = {
  campaignId: number
  action: 'resume' | 'pause' | 'stop'
} | null

export default function CampaignList({
  campaigns = [],
  loading = false,
  onRefresh,
  effectivenessThreshold = 20,
}: Props) {
  const [updating, setUpdating] = useState<UpdatingState>(null)
  const queryClient = useQueryClient()

  const handleStatusChange = async (
    campaignId: number,
    action: 'resume' | 'pause' | 'stop'
  ) => {
    setUpdating({ campaignId, action })
    try {
      await updateStatusCampaign(campaignId, action)

      if (onRefresh) {
        onRefresh()
      } else {
        queryClient.invalidateQueries({ queryKey: ['shopeeCampaign'] })
      }
    } finally {
      setTimeout(() => {
        setUpdating(null)
      }, 400)
    }
  }

  if (loading) return <SkeletonStack />

  if (!campaigns.length)
    return (
      <span className="w-full text-center text-default-700/60 dark:text-gray-400/60 text-xs py-5 bg-gray-100 dark:bg-gray-800/60 rounded-md border-1 border-dashed border-default-300 dark:border-gray-600">
        Tidak ada campaign
      </span>
    )

  return (
    <div className="flex flex-col w-full gap-3">
      {campaigns.map((c) => {
        const rawPercent = c.daily_budget ? (c.spent / c.daily_budget) * 100 : 0
        const percentSpent = Math.min(rawPercent, 100)

        const isUpdating = (action: 'resume' | 'pause' | 'stop') =>
          updating?.campaignId === c.id && updating.action === action

        return (
          <div
            key={c.id}
            className="flex flex-col w-full p-3 rounded-lg bg-default-50 dark:bg-gray-800/40 border border-default-200 dark:border-gray-700"
          >
            {/* === Header: Title + Status === */}
            <div className="flex items-center justify-between mb-2">
              <Link
                color="foreground"
                size="sm"
                isExternal
                href={`https://seller.shopee.co.id/portal/marketing/pas/live-stream/detail/${c.id}`}
                className="flex-1 min-w-0"
              >
                <span className="font-semibold text-sm text-default-700 dark:text-gray-200 truncate block">
                  {c.title || 'Tanpa Judul'}
                </span>
              </Link>

              {/* Status Badge + Action */}
              <div className="flex items-center gap-1 ml-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    c.state === 'ongoing'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                      : c.state === 'paused'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                  }`}
                >
                  {c.state === 'ongoing'
                    ? 'Berjalan'
                    : c.state === 'paused'
                    ? 'Dijeda'
                    : 'Berakhir'}
                </span>

                {c.state === 'ended' ? (
                  <Tooltip content="Mulai ulang">
                    <Button
                      isIconOnly
                      size="sm"
                      as="a"
                      href={`https://seller.shopee.co.id/portal/marketing/pas/live-stream/detail/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="light"
                      className="text-default-500 hover:text-default-700 min-w-6 w-6 h-6"
                    >
                      <IconReload className="w-3.5 h-3.5" />
                    </Button>
                  </Tooltip>
                ) : (
                  <Popover placement="bottom-end">
                    <PopoverTrigger asChild>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-default-500 hover:text-default-700 min-w-6 w-6 h-6"
                      >
                        <IconCaretDownFilled className="w-3.5 h-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-1">
                      <Button
                        fullWidth
                        variant="light"
                        size="sm"
                        isDisabled={
                          c.state === 'ongoing' || isUpdating('resume')
                        }
                        onPress={() => handleStatusChange(c.id, 'resume')}
                        startContent={
                          isUpdating('resume') ? (
                            <Spinner size="sm" className="flex-none w-4 h-4" />
                          ) : (
                            <IconPlayerPlayFilled
                              className={`w-3.5 h-3.5 ${
                                c.state === 'ongoing'
                                  ? 'text-gray-400'
                                  : 'text-green-500'
                              }`}
                            />
                          )
                        }
                        className={`justify-start ${
                          c.state === 'ongoing' || isUpdating('resume')
                            ? 'text-gray-400'
                            : ''
                        }`}
                      >
                        Aktifkan
                      </Button>
                      <Button
                        fullWidth
                        variant="light"
                        size="sm"
                        isDisabled={c.state === 'paused' || isUpdating('pause')}
                        onPress={() => handleStatusChange(c.id, 'pause')}
                        startContent={
                          isUpdating('pause') ? (
                            <Spinner size="sm" className="flex-none w-4 h-4" />
                          ) : (
                            <IconPlayerPauseFilled
                              className={`w-3.5 h-3.5 ${
                                c.state === 'paused'
                                  ? 'text-gray-400'
                                  : 'text-yellow-500'
                              }`}
                            />
                          )
                        }
                        className={`justify-start ${
                          c.state === 'paused' || isUpdating('pause')
                            ? 'text-gray-400'
                            : ''
                        }`}
                      >
                        Jeda
                      </Button>
                      <Button
                        fullWidth
                        variant="light"
                        size="sm"
                        isDisabled={c.state === 'ended' || isUpdating('stop')}
                        onPress={() => handleStatusChange(c.id, 'stop')}
                        startContent={
                          isUpdating('stop') ? (
                            <Spinner size="sm" className="flex-none w-4 h-4" />
                          ) : (
                            <IconPlayerStopFilled
                              className={`w-3.5 h-3.5 ${
                                c.state === 'ended'
                                  ? 'text-gray-400'
                                  : 'text-red-500'
                              }`}
                            />
                          )
                        }
                        className={`justify-start ${
                          c.state === 'ended' || isUpdating('stop')
                            ? 'text-gray-400'
                            : ''
                        }`}
                      >
                        Berhenti
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* === Spent Amount === */}
            <div className="flex justify-between items-center mb-2">
              <Tooltip content="Daily Budget" size="sm" offset={-2} showArrow>
                <div className="text-base font-bold text-default-800 dark:text-gray-100">
                  {formatScaledRupiah(c.daily_budget)}
                </div>
              </Tooltip>
              <div className="text-right">
                <div
                  className={`text-sm font-semibold ${
                    c.report.roas >= effectivenessThreshold
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {c.report.roas.toFixed(2)}
                </div>
              </div>
            </div>

            {/* === Progress Bar === */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-default-500 dark:text-gray-400 mb-1">
                <span>{rawPercent < 1 ? '0' : Math.round(rawPercent)}%</span>
                <Tooltip
                  size="sm"
                  content="Biaya Terpakai"
                  offset={-2}
                  placement="bottom"
                  showArrow
                >
                  <span className="flex items-center gap-1">
                    {formatScaledRupiah(c.spent)}
                  </span>
                </Tooltip>
              </div>
              <Progress
                aria-label="Budget spent"
                size="md"
                value={percentSpent}
                color={percentSpent >= 100 ? 'success' : 'danger'}
                className="h-1.5"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
