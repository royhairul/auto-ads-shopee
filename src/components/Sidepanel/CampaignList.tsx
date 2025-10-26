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

type Props = {
  campaigns?: ShopeeCampaign[]
  loading?: boolean
}

export default function CampaignList({
  campaigns = [],
  loading = false,
}: Props) {
  if (loading) return <SkeletonStack />

  if (!campaigns.length)
    return (
      <span className="text-default-400 dark:text-gray-400 text-sm">
        Tidak ada campaign aktif
      </span>
    )

  return (
    <div className="flex flex-col w-full">
      {campaigns.map((c, idx) => {
        const rawPercent = c.daily_budget ? (c.spent / c.daily_budget) * 100 : 0
        const percentSpent = Math.min(rawPercent, 100)
        const chartData = [{ name: 'Spent', visitors: percentSpent }]

        return (
          <div key={c.id} className="flex flex-col w-full">
            {/* === Header Campaign === */}
            <div className="flex justify-between items-center w-full">
              <div className="flex-1">
                <div className="flex justify-between py-1">
                  <span className="text-default-500 dark:text-gray-300 truncate max-w-[140px]">
                    {c.title || 'Tanpa Judul'}
                  </span>
                  <span className="font-medium text-default-700 dark:text-gray-100">
                    {formatScaledRupiah(c.spent)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-default-400 dark:text-gray-400 pb-1">
                  <span>Budget Harian</span>
                  <span>{formatScaledRupiah(c.daily_budget)}</span>
                </div>
              </div>

              {/* === Progress Ring === */}
              <div className="relative w-12 h-12 shrink-0">
                <RadialBarChart
                  width={48}
                  height={48}
                  innerRadius={16}
                  outerRadius={20}
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
                    fill={percentSpent >= 100 ? '#22c55e' : '#f87171'} // merah normal, hijau kalau penuh
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
            </div>

            {/* Divider antar item */}
            {idx < campaigns.length - 1 && (
              <hr className="border-t border-default-200 dark:border-gray-700 my-2 w-full" />
            )}
          </div>
        )
      })}
    </div>
  )
}
