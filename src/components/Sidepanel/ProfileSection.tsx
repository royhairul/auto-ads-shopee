import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconCircleDashedMinus } from '@tabler/icons-react'

import { LiveStatusList } from './LiveStatusList'
import { ProfileHeader } from './ProfileHeader'

export default function ProfileSection({
  profile,
  profileLoading,
  liveData,
}: {
  profile: any
  profileLoading: boolean
  liveData: any[] | undefined
}) {
  const [openProfile, setOpenProfile] = useState(false)

  return (
    <div className="w-full">
      <ProfileHeader
        profile={profile}
        loading={profileLoading}
        liveActive={!!liveData?.length}
        open={openProfile}
        toggle={() => setOpenProfile(!openProfile)}
      />

      <AnimatePresence>
        {openProfile && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-2 rounded-xl border border-default-200 dark:border-default-100 p-3 flex flex-col gap-3"
          >
            {liveData && liveData.length > 0 ? (
              <LiveStatusList liveData={liveData} />
            ) : (
              <div className="p-3 rounded-lg bg-default-50 dark:bg-default-900/30 border border-default-200 dark:border-default-700 flex items-center gap-2 text-xs text-default-500">
                <IconCircleDashedMinus size={16} />
                Seller tidak sedang live
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
