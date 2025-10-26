import { Skeleton } from '@heroui/react'

export default function SkeletonStack() {
  return (
    <>
      <Skeleton className="w-full h-4 rounded-md dark:bg-gray-700" />
      <Skeleton className="w-3/4 h-4 rounded-md dark:bg-gray-700" />
    </>
  )
}
