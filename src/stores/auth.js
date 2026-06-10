import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: '',
    logged: false,
    imgUrl: '',
    keys: {
      owner: null,
      active: null,
      posting: null,
      memo: null,
    },
  }),
})
