import { describe, it, expect } from 'vitest'
import { getHealth } from '@/api/health-api'

describe('Health API integration', () => {
  it('fetches health status from backend or returns normalized network error if offline', async () => {
    try {
      const data = await getHealth()
      expect(data).toEqual({ status: 'ok' })
    } catch (err: unknown) {
      expect(err).toMatchObject({
        kind: 'NETWORK_ERROR',
        status: 0,
      })
    }
  })
})
