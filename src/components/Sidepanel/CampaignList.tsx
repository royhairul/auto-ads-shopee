import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PolarRadiusAxis,
  Label,
  PolarGrid,
} from 'recharts'
import { ShopeeCampaign } from '@/types/shopee'
import SkeletonStack from './SkeletonStack'
import { formatScaledRupiah } from '@/services/shopee'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Divider,
  Spinner,
  Tooltip,
  Link,
} from '@heroui/react'
import {
  IconDotsVertical,
  IconPlayerStopFilled,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconReload,
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
    <div className="flex flex-col w-full">
      {campaigns.map((c, idx) => {
        const rawPercent = c.daily_budget ? (c.spent / c.daily_budget) * 100 : 0
        const percentSpent = Math.min(rawPercent, 100)
        const chartData = [{ name: 'Spent', visitors: percentSpent }]

        const isUpdating = (action: 'resume' | 'pause' | 'stop') =>
          updating?.campaignId === c.id && updating.action === action

        return (
          <div key={c.id} className="flex flex-col w-full">
            {/* === Header Campaign === */}
            <div className="flex justify-between items-center w-full">
              <div
                className="w-12 h-12 shrink-0 mr-3"
                onMouseDown={(e) => e.preventDefault()}
              >
                <RadialBarChart
                  width={56}
                  height={56}
                  innerRadius={20}
                  outerRadius={24}
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarGrid radialLines={false} />
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar
                    dataKey="visitors"
                    cornerRadius={10}
                    background
                    fill={percentSpent >= 100 ? '#22c55e' : '#f87171'}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (
                          !viewBox ||
                          !('cx' in viewBox) ||
                          !('cy' in viewBox)
                        )
                          return null
                        const fontSize = percentSpent >= 100 ? 8 : 12
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            tabIndex={-1}
                            style={{ fontSize }}
                            className="font-medium fill-default-700 dark:fill-gray-100"
                          >
                            {rawPercent < 1
                              ? '<1%'
                              : Math.round(rawPercent) + '%'}
                          </text>
                        )
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </div>

              {/* === Info Campaign === */}
              <div className="flex-1 flex flex-col justify-start">
                <span
                  className={`w-max text-xs font-medium px-1 py-0.5 rounded ${
                    c.state === 'ongoing'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : c.state === 'paused'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {c.state === 'ongoing'
                    ? 'Berjalan'
                    : c.state === 'paused'
                    ? 'Dijeda'
                    : 'Berakhir'}
                </span>

                <div className="flex justify-between py-1 gap-1">
                  <Link
                    color="foreground"
                    size="sm"
                    isExternal
                    href={`https://seller.shopee.co.id/portal/marketing/pas/live-stream/detail/${c.id}`}
                  >
                    <span className="font-semibold text-default-600 dark:text-gray-300 truncate max-w-[140px]">
                      {c.title || 'Tanpa Judul'}
                    </span>
                  </Link>
                  <span className="font-medium text-default-700 dark:text-gray-100">
                    {formatScaledRupiah(c.spent)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-default-600 dark:text-gray-400 pb-1">
                  <span>Budget Harian</span>
                  <span>{formatScaledRupiah(c.daily_budget)}</span>
                </div>

                <div className="flex justify-between text-xs text-default-600 dark:text-gray-400">
                  <span>Efektivitas Iklan</span>
                  <span
                    className={
                      c.report.roas >= effectivenessThreshold
                        ? 'text-green-500 font-medium'
                        : 'text-red-500 font-medium'
                    }
                  >
                    {c.report.roas.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* === Popover Aksi === */}
              {c.state === 'ended' ? (
                <Tooltip content="Mulai ulang">
                  <Button
                    isIconOnly
                    as="a"
                    href={`https://seller.shopee.co.id/portal/marketing/pas/live-stream/detail/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="light"
                    className="ml-2 text-default-500 hover:text-default-700"
                  >
                    <IconReload className="w-4 h-4" />
                  </Button>
                </Tooltip>
              ) : (
                <Popover placement="bottom-end">
                  <PopoverTrigger asChild>
                    <Button
                      isIconOnly
                      variant="light"
                      className="ml-2 text-default-500 hover:text-default-700"
                    >
                      <IconDotsVertical className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-36 p-1">
                    {/* Aktifkan */}
                    <Button
                      fullWidth
                      variant="light"
                      isDisabled={c.state === 'ongoing' || isUpdating('resume')}
                      onPress={() => handleStatusChange(c.id, 'resume')}
                      startContent={
                        isUpdating('resume') ? (
                          <Spinner size="sm" className="flex-none w-5 h-5" />
                        ) : (
                          <IconPlayerPlayFilled
                            className={`w-4 h-4 ${
                              c.state === 'ongoing'
                                ? 'text-gray-400'
                                : 'text-green-500'
                            }`}
                          />
                        )
                      }
                      className={`justify-start items-center ${
                        c.state === 'ongoing' || isUpdating('resume')
                          ? 'text-gray-400 hover:text-gray-400'
                          : ''
                      }`}
                    >
                      Aktifkan
                    </Button>

                    {/* Jeda */}
                    <Button
                      fullWidth
                      variant="light"
                      isDisabled={c.state === 'paused' || isUpdating('pause')}
                      onPress={() => handleStatusChange(c.id, 'pause')}
                      startContent={
                        isUpdating('pause') ? (
                          <Spinner size="sm" className="flex-none w-5 h-5" />
                        ) : (
                          <IconPlayerPauseFilled
                            className={`w-4 h-4 ${
                              c.state === 'paused'
                                ? 'text-gray-400'
                                : 'text-yellow-500'
                            }`}
                          />
                        )
                      }
                      className={`justify-start items-center ${
                        c.state === 'paused' || isUpdating('pause')
                          ? 'text-gray-400 hover:text-gray-400'
                          : ''
                      }`}
                    >
                      Jeda
                    </Button>

                    {/* Berhenti */}
                    <Button
                      fullWidth
                      variant="light"
                      isDisabled={c.state === 'ended' || isUpdating('stop')}
                      onPress={() => handleStatusChange(c.id, 'stop')}
                      startContent={
                        isUpdating('stop') ? (
                          <Spinner size="sm" className="flex-none w-5 h-5" />
                        ) : (
                          <IconPlayerStopFilled
                            className={`w-4 h-4 ${
                              c.state === 'ended'
                                ? 'text-gray-400'
                                : 'text-red-500'
                            }`}
                          />
                        )
                      }
                      className={`justify-start items-center ${
                        c.state === 'ended' || isUpdating('stop')
                          ? 'text-gray-400 hover:text-gray-400'
                          : ''
                      }`}
                    >
                      Berhenti
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Divider antar item */}
            {idx < campaigns.length - 1 && <Divider className="my-5" />}
          </div>
        )
      })}
    </div>
  )
}
