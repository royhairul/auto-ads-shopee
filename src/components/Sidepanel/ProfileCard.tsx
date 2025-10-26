import { User, Skeleton } from '@heroui/react'

export default function ProfileCard({
  profile,
  loading,
}: {
  profile: any
  loading: boolean
}) {
  return (
    <User
      name={
        loading ? (
          <Skeleton className="w-32 h-5 rounded-md dark:bg-gray-700" />
        ) : (
          profile?.username || 'Unknown User'
        )
      }
      avatarProps={{
        src: loading
          ? undefined
          : profile?.portrait
          ? `https://cf.shopee.co.id/file/${profile.portrait}`
          : 'https://avatars.githubusercontent.com/u/30373425?v=4',
      }}
      description={
        loading ? (
          <Skeleton className="w-44 h-4 mt-1 rounded-md dark:bg-gray-700" />
        ) : (
          profile?.email || 'Email tidak tersedia'
        )
      }
      classNames={{
        name: 'text-lg font-semibold tracking-tighter dark:text-gray-100',
        description: 'text-xs font-medium dark:text-gray-300',
      }}
    />
  )
}
