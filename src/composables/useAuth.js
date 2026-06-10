import axios from 'axios'
import Config from '@/config.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()

  async function login(username, password) {
    if (import.meta.env.VITE_DEV_USER) {
      authStore.$patch({
        user: import.meta.env.VITE_DEV_USERNAME || 'devuser',
        imgUrl: '',
        logged: true,
      })
      return
    }

    let response
    if (!username && !password) {
      response = await axios.get(Config.SERVER_API + 'login')
    } else {
      response = await axios.post(Config.SERVER_API + 'login', { username, password })
    }
    setLoginUser(response.data)
    if (username) router.push(Config.PAGE_AFTER_LOGIN)
  }

  async function logout() {
    await axios.get(Config.SERVER_API + 'logout')
    authStore.$patch({ user: '', logged: false, imgUrl: '' })
    router.push(Config.PAGE_AFTER_LOGOUT)
  }

  function setLoginUser(user) {
    if (!user.imgUrl || user.imgUrl === '') user.imgUrl = ''
    user.logged = true
    authStore.$patch(user)
    return user
  }

  return { login, logout, setLoginUser, authStore }
}
