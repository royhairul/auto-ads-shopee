import { useEffect, useState } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Switch,
  Input,
  Button,
  addToast,
} from '@heroui/react'
import { IconBell } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 🧩 Schema untuk validasi form notifikasi
const NotificationSchema = z.object({
  notificationsEnabled: z.boolean(),
  notificationCooldown: z
    .number({ error: 'Harus berupa angka' })
    .min(1, { error: 'Minimal 1 menit' })
    .max(1440, { error: 'Maksimal 1440 menit' }),
})

type NotificationForm = z.infer<typeof NotificationSchema>

export default function NotificationTab() {
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<NotificationForm>({
    resolver: zodResolver(NotificationSchema),
    defaultValues: {
      notificationsEnabled: true,
      notificationCooldown: 5,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form

  const notificationsEnabled = watch('notificationsEnabled')

  // 🔹 Ambil nilai dari storage saat pertama kali load
  useEffect(() => {
    chrome.storage.sync.get(
      ['notificationsEnabled', 'notificationCooldown'],
      (data) => {
        reset({
          notificationsEnabled: data.notificationsEnabled ?? true,
          notificationCooldown: Number(data.notificationCooldown ?? 5),
        })
        setIsLoading(false)
      }
    )
  }, [reset])

  // 🔹 Simpan ke storage dan tampilkan toast
  const onSubmit = (values: NotificationForm) => {
    chrome.storage.sync.set(values, () => {
      addToast({
        title: 'Pengaturan Notifikasi Disimpan',
        description: 'Perubahan berhasil disimpan.',
        color: 'success',
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      })
    })
  }

  if (isLoading) return <p>Loading...</p>

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex items-center gap-2 mt-4">
        <IconBell />
        <span className="text-base font-semibold">Notifikasi</span>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardBody className="flex flex-col gap-4 mt-2">
          {/* 🔹 Aktifkan / Nonaktifkan notifikasi */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-default-700">
              Aktifkan Notifikasi
            </label>
            <Switch
              isSelected={notificationsEnabled}
              onChange={(e) =>
                setValue('notificationsEnabled', e.target.checked)
              }
              size="sm"
              color="primary"
            />
          </div>

          {/* 🔹 Input jeda notifikasi */}
          <Input
            {...register('notificationCooldown', { valueAsNumber: true })}
            label="Jeda Notifikasi (menit)"
            type="number"
            min={1}
            max={1440}
            isDisabled={!notificationsEnabled}
            isInvalid={!!errors.notificationCooldown}
            errorMessage={errors.notificationCooldown?.message}
            endContent={
              <span className="text-default-400 text-small">Menit</span>
            }
          />
        </CardBody>

        <CardFooter className="flex gap-3 mt-2">
          <Button
            type="submit"
            color="primary"
            className="flex-1 font-semibold"
          >
            Simpan
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
