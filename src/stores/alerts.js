import { defineStore } from 'pinia'

export const useAlertsStore = defineStore('alerts', {
  state: () => ({
    info: false,
    infoText: '',
    success: false,
    successText: '',
    danger: false,
    dangerText: '',
  }),
  actions: {
    showInfo(text) { this.info = true; this.infoText = text },
    hideInfo() { this.info = false; this.infoText = '' },
    showSuccess(text) { this.success = true; this.successText = text },
    hideSuccess() { this.success = false; this.successText = '' },
    showDanger(text) { this.danger = true; this.dangerText = text },
    hideDanger() { this.danger = false; this.dangerText = '' },
  },
})
