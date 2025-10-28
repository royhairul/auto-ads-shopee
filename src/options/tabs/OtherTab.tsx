import { Card, CardHeader, CardBody } from '@heroui/react'
import { IconX } from '@tabler/icons-react'

export default function OtherTab() {
  return (
    <Card className="w-full p-2">
      <CardHeader className="flex items-center gap-2 mt-4">
        <IconX />
        <span className="text-base font-semibold">Lainnya</span>
      </CardHeader>
      <CardBody className="mt-2">
        <p className="text-sm text-default-500">
          Konten tambahan atau opsi lainnya bisa ditempatkan di sini.
        </p>
      </CardBody>
    </Card>
  )
}
