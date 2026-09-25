import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .min(1, 'Biến môi trường VITE_API_BASE_URL không được để trống')
    .url('VITE_API_BASE_URL phải là một URL hợp lệ (ví dụ: http://localhost:3000/api)'),
})

export interface AppEnv {
  apiBaseUrl: string
}

export function validateEnv(rawEnv: Record<string, unknown> = import.meta.env): AppEnv {
  const result = envSchema.safeParse({
    VITE_API_BASE_URL: rawEnv.VITE_API_BASE_URL,
  })

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    const errorMessage = `[Config Error] Cấu hình môi trường không hợp lệ: ${errorDetails}`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  return {
    apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/+$/, ''),
  }
}

export const env: AppEnv = validateEnv()
