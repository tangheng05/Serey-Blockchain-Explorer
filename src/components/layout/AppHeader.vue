<template>
  <div>
    <!-- Login modal (plain Bootstrap 5) -->
    <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true" ref="loginModalEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="loginModalLabel">Login</h5>
            <button type="button" class="btn-close" @click="closeModalAuth" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <AuthComponent @login="onLogin" @close="closeModalAuth" />
          </div>
        </div>
      </div>
    </div>

    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-3">
      <div class="container-fluid">
        <router-link to="/" class="navbar-brand py-0">
          <img src="../../assets/serey-logo.png" style="height:2.3rem;" alt="Serey" />
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarMain">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link to="/explorer" class="nav-link">Explorer</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/witnesses" class="nav-link">Witnesses</router-link>
            </li>
          </ul>

          <form class="d-flex me-3" @submit.prevent="searchInput">
            <input
              v-model="search"
              class="form-control form-control-sm me-2"
              type="search"
              placeholder="Account, tx, or block"
              aria-label="Search"
            />
            <button class="btn btn-sm btn-light" type="submit">Search</button>
          </form>

          <div v-if="authStore.logged" class="dropdown">
            <button
              class="btn btn-link p-0 dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="image-profile" :style="{ backgroundImage: 'url(' + authStore.imgUrl + ')' }"></div>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><h6 class="dropdown-header">{{ authStore.user }}</h6></li>
              <li><hr class="dropdown-divider" /></li>
              <li><button class="dropdown-item" @click="doLogout">Logout</button></li>
            </ul>
          </div>
          <div v-else>
            <button class="btn btn-sm btn-light" @click="showModalAuth">LOGIN</button>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import AuthComponent from '@/components/Auth'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'AppHeader',
  components: { AuthComponent },

  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },

  data() {
    return {
      search: '',
      _bsModal: null,
    }
  },

  mounted() {
    this._bsModal = new Modal(this.$refs.loginModalEl)
  },

  beforeUnmount() {
    if (this._bsModal) this._bsModal.dispose()
  },

  methods: {
    showModalAuth() {
      this._bsModal.show()
    },

    closeModalAuth() {
      this._bsModal.hide()
    },

    onLogin() {
      this.closeModalAuth()
      this.$emit('login')
    },

    doLogout() {
      this.authStore.$patch({
        user: '', logged: false, imgUrl: '',
        keys: { owner: null, active: null, posting: null, memo: null },
      })
      this.$emit('logout')
    },

    searchInput() {
      if (!this.search) return
      const s = this.search.trim()
      if (s.length === 40) {
        this.$router.push(`/explorer/tx/${s}`)
      } else if (/^\d+$/.test(s)) {
        this.$router.push(`/explorer/b/${s}`)
      } else {
        this.$router.push(`/explorer/@${s}`)
      }
      this.search = ''
    },
  },
}
</script>

<style scoped>
.image-profile {
  display: inline-block;
  height: 2rem;
  width: 2rem;
  background-size: cover;
  background-position: center center;
  border-radius: 50%;
  vertical-align: middle;
}
</style>
