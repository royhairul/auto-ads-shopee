import { motion } from 'framer-motion'
import { Button, Chip, Tooltip } from '@heroui/react'
import {
  IconChevronRight,
  IconEye,
  IconShoppingCartCheck,
} from '@tabler/icons-react'

export function LiveStatusList({ liveData }: { liveData: any[] }) {
  return (
    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex flex-col gap-2">
      {liveData.map((live, i) => (
        <div key={i} className="text-xs text-default-600 dark:text-default-300">
          <div className="flex gap-2 items-center justify-between">
            <div className="flex flex-col gap-2">
              <div
                className="relative overflow-hidden w-full"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
                  maskImage:
                    'linear-gradient(to right, transparent, white 10%, white 90%, transparent)',
                }}
              >
                <motion.span
                  key={live.sessionId}
                  className="whitespace-nowrap inline-block font-medium dark:text-white"
                  animate={{ x: ['0%', '-100%'] }}
                  transition={{
                    duration: 25,
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                >
                  {live.title || '-'}
                </motion.span>
              </div>

              <div className="relative bottom-0 z-10 flex gap-4">
                <Chip
                  variant="flat"
                  size="sm"
                  className="gap-2"
                  startContent={<IconEye size={16} />}
                >
                  {live.view}
                </Chip>
                <Chip
                  variant="flat"
                  size="sm"
                  className="gap-2"
                  startContent={<IconShoppingCartCheck size={16} />}
                >
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(live.gmv || 0)}
                </Chip>
              </div>
            </div>

            <Tooltip content={'Lihat Live'}>
              <Button
                color="danger"
                aria-label="Lihat Detail Live"
                variant="flat"
                size="sm"
                as="a"
                href={live.link}
                target="_blank"
                isIconOnly
                className="transition-all duration-300 hover:scale-110"
              >
                <IconChevronRight size={16} />
              </Button>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  )
}
