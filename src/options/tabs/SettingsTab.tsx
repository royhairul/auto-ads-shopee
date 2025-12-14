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
  Tooltip,
} from '@heroui/react'
import { IconSettings2, IconCopy, IconClipboard } from '@tabler/icons-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 🔹 Schema validasi
const SettingsSchema = z.object({
  mode: z.enum(['time', 'percentage', 'combined']),
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
  effectivenessThreshold: z.number().min(1),
})

type SettingsForm = z.infer<typeof SettingsSchema>

type SettingsTabProps = {
  onSaved?: () => void
}

export default function SettingsTab({ onSaved }: SettingsTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [_, setCopied] = useState(false)

  const form = useForm<SettingsForm>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      mode: 'percentage',
      updateInterval: 10,
      budgetThreshold: 98,
      dailyBudget: 5000,
      effectivenessThreshold: 20,
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

  // === Ambil data dari chrome.storage saat load pertama kali ===
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'mode',
        'budgetThreshold',
        'updateInterval',
        'dailyBudget',
        'effectivenessThreshold',
      ],
      (data) => {
        reset({
          mode: data.mode ?? 'percentage',
          budgetThreshold: Number(data.budgetThreshold ?? 98),
          updateInterval: Number(data.updateInterval ?? 10),
          dailyBudget: Number(data.dailyBudget ?? 5000),
          effectivenessThreshold: Number(data.effectivenessThreshold ?? 20),
        })
        setIsLoading(false)
      }
    )
  }, [reset])

  // === Simpan ke storage ===
  const onSubmit = (values: SettingsForm) => {
    chrome.storage.sync.set(values, () => {
      addToast({
        title: 'Pengaturan disimpan',
        description: `Perubahan telah disimpan.`,
        color: 'success',
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      })
    })
    if (onSaved) onSaved()
  }

  // === Copy Settings ===
  const handleCopySettings = async () => {
    const values = form.getValues()
    await navigator.clipboard.writeText(JSON.stringify(values, null, 2))
    setCopied(true)
    addToast({
      title: 'Pengaturan disalin',
      description: 'Konfigurasi siap ditempel ke akun lain.',
      color: 'primary',
    })
    setTimeout(() => setCopied(false), 1500)
  }

  // === Paste Settings ===
  const handlePasteSettings = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = JSON.parse(text)
      reset(parsed)
      addToast({
        title: 'Pengaturan ditempel',
        description:
          'Semua pengaturan berhasil dimuat dari clipboard. Klik "Simpan Pengaturan" untuk menyimpan.',
        color: 'success',
      })
    } catch (err) {
      addToast({
        title: 'Gagal menempel pengaturan',
        description: 'Format clipboard tidak valid.',
        color: 'danger',
      })
    }
  }

  if (isLoading) return <p>Loading...</p>

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <IconSettings2 />
          <span className="text-base font-semibold">Auto Ads</span>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Salin Pengaturan">
            <Button
              isIconOnly
              variant="flat"
              color="primary"
              size="sm"
              onPress={handleCopySettings}
            >
              <IconCopy size={18} />
            </Button>
          </Tooltip>
          <Tooltip content="Tempel Pengaturan">
            <Button
              isIconOnly
              variant="flat"
              color="success"
              size="sm"
              onPress={handlePasteSettings}
            >
              <IconClipboard size={18} />
            </Button>
          </Tooltip>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardBody className="flex flex-col gap-4 mt-2">
          {/* Mode */}
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipe Trigger"
                selectedKeys={[field.value]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as
                    | 'time'
                    | 'percentage'
                    | 'combined'
                  field.onChange(value)
                }}
                isRequired
              >
                <SelectItem key="percentage">Berdasarkan Persentase</SelectItem>
                <SelectItem key="time">Berdasarkan Waktu</SelectItem>
                <SelectItem key="combined">
                  Kombinasi Persentase & Waktu
                </SelectItem>
              </Select>
            )}
          />

          {/* Inputs */}
          {(selectedMode === 'percentage' || selectedMode === 'combined') && (
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

          {(selectedMode === 'time' || selectedMode === 'combined') && (
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

          <p className="mt-5">Efektivitas Iklan</p>

          <Input
            {...register('effectivenessThreshold', { valueAsNumber: true })}
            label="Efektivitas Iklan Minimal"
            type="number"
            min={1}
            isInvalid={!!errors.effectivenessThreshold}
            errorMessage={errors.effectivenessThreshold?.message}
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
