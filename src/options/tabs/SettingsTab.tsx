import { useEffect, useState } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Select,
  SelectItem,
  addToast,
} from '@heroui/react'
import { IconSettings2 } from '@tabler/icons-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 🔹 Schema dengan dua mode: 'time' atau 'threshold'
const SettingsSchema = z.object({
  mode: z.enum(['time', 'percentage']),
  updateInterval: z
    .number({ error: 'Harus berupa angka' })
    .min(1, { error: 'Minimal 1 menit' })
    .max(1440, { error: 'Maksimal 1440 menit' })
    .optional(),
  budgetThreshold: z
    .number({ error: 'Harus berupa angka' })
    .min(1, { error: 'Minimal 1%' })
    .max(100, { error: 'Maksimal 100%' })
    .optional(),
  dailyBudget: z
    .number({ error: 'Harus berupa angka' })
    .min(5000, { error: 'Minimal Rp5.000' })
    .refine((val) => val % 5000 === 0, {
      error: 'Harus kelipatan Rp5.000',
    }),
})

type SettingsForm = z.infer<typeof SettingsSchema>

export default function SettingsTab() {
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<SettingsForm>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      mode: 'percentage',
      updateInterval: 10,
      budgetThreshold: 98,
      dailyBudget: 5000,
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = form

  const selectedMode = watch('mode')

  // 🔹 Ambil nilai dari storage saat load pertama kali
  useEffect(() => {
    chrome.storage.sync.get(
      ['mode', 'budgetThreshold', 'updateInterval', 'dailyBudget'],
      (data) => {
        reset({
          mode: data.mode ?? 'percentage',
          budgetThreshold: Number(data.budgetThreshold ?? 98),
          updateInterval: Number(data.updateInterval ?? 10),
          dailyBudget: Number(data.dailyBudget ?? 5000),
        })
        setIsLoading(false)
      }
    )
  }, [reset])

  // 🔹 Simpan ke storage dan tampilkan toast
  const onSubmit = (values: SettingsForm) => {
    console.log(values)
    chrome.storage.sync.set(values, () => {
      addToast({
        title: 'Pengaturan disimpan',
        description: `Perubahan telah disimpan.`,
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
        <IconSettings2 />
        <span className="text-base font-semibold">Auto Ads</span>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardBody className="flex flex-col gap-4 mt-2">
          {/* 🔹 Pilih Mode */}
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipe Trigger"
                selectedKeys={[field.value]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as 'time' | 'percentage'
                  field.onChange(value)
                }}
                isRequired
              >
                <SelectItem key="percentage">Berdasarkan Persentase</SelectItem>
                <SelectItem key="time">Berdasarkan Waktu</SelectItem>
              </Select>
            )}
          />

          {/* 🔹 Input sesuai mode */}
          {selectedMode === 'percentage' && (
            <Input
              {...register('budgetThreshold', { valueAsNumber: true })}
              label="Batas Minimal Budget (%)"
              type="number"
              min={1}
              max={100}
              isInvalid={!!errors.budgetThreshold}
              errorMessage={errors.budgetThreshold?.message}
              endContent={
                <span className="text-default-400 text-small">%</span>
              }
            />
          )}

          {selectedMode === 'time' && (
            <Input
              {...register('updateInterval', { valueAsNumber: true })}
              label="Perbarui Setiap (menit)"
              type="number"
              min={1}
              max={1440}
              isInvalid={!!errors.updateInterval}
              errorMessage={errors.updateInterval?.message}
              endContent={
                <span className="text-default-400 text-small">Menit</span>
              }
            />
          )}

          <Input
            {...register('dailyBudget', { valueAsNumber: true })}
            label="Daily Budget (Rp)"
            type="number"
            min={5000}
            step={5000}
            isInvalid={!!errors.dailyBudget}
            errorMessage={errors.dailyBudget?.message}
            startContent={
              <span className="text-default-400 text-small">Rp</span>
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
