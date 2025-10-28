import { Card, CardHeader, CardBody } from '@heroui/react'
import { IconInfoCircle } from '@tabler/icons-react'

export default function AboutTab() {
  return (
    <Card className="w-full p-2">
      <CardHeader className="flex items-center gap-2 mt-4">
        <IconInfoCircle />
        <span className="text-base font-semibold">About Extension</span>
      </CardHeader>
      <CardBody className="mt-2">
        <p className="text-sm text-default-500">
          Extension ini otomatis memantau budget iklan Shopee dan melakukan
          update harian. Anda dapat mengatur batas minimal budget, frekuensi
          update, dan daily budget.
        </p>
      </CardBody>
    </Card>
  )
}
