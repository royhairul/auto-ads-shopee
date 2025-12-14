import { Card, CardHeader, CardBody, CardFooter, Skeleton } from '@heroui/react'
import { formatScaledRupiah } from '@/services/shopee'
import React from 'react'
import clsx from 'clsx'

interface StatsCardProps {
  title: string
  icon: React.ElementType
  value?: React.ReactNode
  loading?: boolean
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  footer?: React.ReactNode
  action?: React.ReactNode // 👉 tambahan: tombol atau elemen aksi di samping value
  footerPosition?: 'inside' | 'bottom' // posisi footer
}

export default function StatsCard({
  title,
  icon,
  value = 0,
  loading = false,
  colorScheme = 'default',
  footer,
  action,
  footerPosition = 'bottom',
}: StatsCardProps) {
  const Icon = icon

  // mapping warna yang bisa dipakai Tailwind
  const colorClasses: Record<string, string> = {
    primary:
      'bg-blue-600/5 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400',
    success:
      'bg-green-600/5 dark:bg-green-600/15 text-green-600 dark:text-green-400',
    warning:
      'bg-yellow-600/5 dark:bg-yellow-600/15 text-yellow-600 dark:text-yellow-400',
    danger:
      'bg-red-600/5 dark:bg-red-600/15 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/25 dark:shadow-red-400/30 border-[1.5px] border-red-400/30 dark:border-red-400/30',
    default:
      'bg-gray-600/5 dark:bg-gray-600/15 text-gray-600 dark:text-gray-400',
  }

  return (
    <Card className={clsx('w-full', colorClasses[colorScheme])}>
      <CardHeader className="flex gap-2 items-center py-1 px-3 pt-2">
        <Icon size={18} />
        <p className="text-xs font-semibold dark:text-white">{title}</p>
      </CardHeader>

      <CardBody
        className={clsx(
          'flex flex-col gap-1.5 pt-0 px-3 pb-1.5',
          footerPosition === 'inside' && 'pb-0'
        )}
      >
        {loading ? (
          <Skeleton className="w-24 h-6 rounded-md dark:bg-gray-700" />
        ) : (
          <div className="flex items-center justify-between gap-2">
            {typeof value === 'number' ? (
              <p className="text-lg font-bold dark:text-white">
                {typeof value === 'number' ? formatScaledRupiah(value) : value}
              </p>
            ) : (
              value
            )}
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}

        {footer && footerPosition === 'inside' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {footer}
          </div>
        )}
      </CardBody>

      {footer && footerPosition === 'bottom' && (
        <CardFooter className="flex flex-col items-start py-2 px-3 pt-0 gap-1.5">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
