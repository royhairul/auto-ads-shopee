import { motion } from 'framer-motion'
import { Button, ButtonGroup, Tooltip } from '@heroui/react'
import {
  IconLivePhoto,
  IconLivePhotoOff,
  IconChevronDown,
} from '@tabler/icons-react'
import ProfileCard from './ProfileCard'

export function ProfileHeader({
  profile,
  loading,
  liveActive,
  open,
  toggle,
}: {
  profile: any
  loading: boolean
  liveActive: boolean
  open: boolean
  toggle: () => void
}) {
  return (
    <div
      className="cursor-pointer flex justify-between items-center select-none"
      onClick={toggle}
    >
      <ProfileCard profile={profile} loading={loading} />

      <ButtonGroup variant="flat" className="transition-all duration-300">
        <Tooltip
          content={liveActive ? 'Sedang Live' : 'Nonaktif'}
          placement="bottom"
          classNames={{ content: 'text-xs' }}
        >
          <Button
            isIconOnly
            aria-readonly
            className="transition-all duration-300 hover:scale-110"
          >
            {liveActive ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 10,
                  ease: 'linear',
                  repeat: Infinity,
                }}
              >
                <IconLivePhoto size={16} />
              </motion.div>
            ) : (
              <IconLivePhotoOff className="opacity-50" />
            )}
          </Button>
        </Tooltip>

        <Button
          isIconOnly
          className="group transition-all duration-300"
          onPress={() => {
            toggle()
          }}
        >
          <IconChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              open ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </Button>
      </ButtonGroup>
    </div>
  )
}
