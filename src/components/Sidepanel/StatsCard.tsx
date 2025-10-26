import { Card, CardHeader, CardBody, CardFooter, Skeleton } from '@heroui/react'
import { formatScaledRupiah } from '@/services/shopee'
import React from 'react'

export default function StatsCard({
  title,
  icon,
  value,
  loading,
  colorScheme,
  footer,
}: {
  title: string
  icon: React.ElementType
  value?: number
  loading: boolean
  colorScheme: string
  footer?: React.ReactNode
}) {
  const Icon = icon
  const bgClass = `!bg-${colorScheme}-600/5 !dark:bg-${colorScheme}-600/15 !text-${colorScheme}-600 !dark:text-${colorScheme}-400`
  return (
    <Card className={`w-full ${bgClass}`}>
      <CardHeader className="flex gap-2 items-center">
        <Icon size={20} />
        <p className="font-semibold dark:text-white">{title}</p>
      </CardHeader>
      <CardBody className={footer ? 'py-0' : 'pt-0'}>
        {loading ? (
          <Skeleton className="w-24 h-6 rounded-md dark:bg-gray-700" />
        ) : (
          <p className="text-lg font-bold dark:text-white">
            {formatScaledRupiah(value ?? 0)}
          </p>
        )}
      </CardBody>
      {footer && (
        <CardFooter className="flex flex-col items-start space-y-2">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
