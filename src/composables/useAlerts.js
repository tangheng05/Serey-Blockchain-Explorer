import { useAlertsStore } from '@/stores/alerts.js'

export function useAlerts() {
  return useAlertsStore()
}
