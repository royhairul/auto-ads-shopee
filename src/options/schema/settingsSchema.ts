import { z } from 'zod'

export const SettingsSchema = z.object({
  budgetThreshold: z.preprocess(
    (val) => (val === '' ? NaN : Number(val)),
    z
      .number({ error: 'Batas minimal budget harus berupa angka' })
      .min(1, { error: 'Minimal 1%' })
      .max(100, { error: 'Maksimal 100%' })
  ),
  notificationCooldown: z.preprocess(
    (val) => (val === '' ? NaN : Number(val)),
    z
      .number({ error: 'Cooldown harus berupa angka' })
      .min(1, { error: 'Minimal 1 menit' })
      .max(1440, { error: 'Maksimal 1440 menit' })
  ),
  dailyBudget: z.preprocess(
    (val) => (val === '' ? NaN : Number(val)),
    z
      .number({ error: 'Daily Budget harus berupa angka' })
      .min(5000, { error: 'Minimal Rp5.000' })
      .max(1_000_000_000, { error: 'Maksimal Rp1.000.000.000' })
      .refine((val) => val % 5000 === 0, {
        error: 'Harus kelipatan Rp5.000',
      })
  ),
})

export type SettingsForm = z.infer<typeof SettingsSchema>

export const FALLBACK_VALUES: SettingsForm = {
  budgetThreshold: 98,
  notificationCooldown: 1,
  dailyBudget: 5000,
}
