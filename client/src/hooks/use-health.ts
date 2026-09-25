import { useQuery } from '@tanstack/react-query'
import { getHealth, type HealthResponse } from '@/api/health-api'
import { queryKeys } from '@/lib/query-keys'

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    staleTime: 30000,
    refetchInterval: 30000,
    retry: 1,
  })
}
