<template>
  <div>
    <b-modal v-model="showModal" hide-footer title="Login">
      <AuthComponent @login="onLogin" @close="closeModalAuth" />
    </b-modal>
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <ul class="navbar-nav">
        <li class="nav-item">
          <router-link :to="linkLogo" class="nav-item nav-link">
            <div id="logo"><img src="../../assets/serey-logo.png" /></div>
          </router-link>
        </li>
      </ul>
      <b-navbar v-if="authStore.logged" class="ms-auto d-lg-none" style="margin:0;">
        <ul class="navbar-nav">
          <b-nav-item-dropdown variant="link" size="lg" no-caret right>
            <template #button-content>
              <div class="image-profile" :style="{ backgroundImage: 'url(' + authStore.imgUrl + ')' }"></div>
            </template>
            <b-dropdown-header>{{ authStore.user }}</b-dropdown-header>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item @click="doLogout">Logout</b-dropdown-item>
          </b-nav-item-dropdown>
        </ul>
      </b-navbar>
      <b-navbar-nav v-else class="nav-link ms-auto d-lg-none">
        <button class="btn btn-primary" @click="showModalAuth">Login</button>
      </b-navbar-nav>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link to="/explorer" class="nav-item nav-link"><div class="extra-padding">Explorer</div></router-link>
          </li>
          <li class="nav-item">
            <router-link to="/witnesses" class="nav-item nav-link"><div class="extra-padding">Witnesses</div></router-link>
          </li>
        </ul>
        <b-navbar-nav class="ms-auto">
          <b-nav-form>
            <b-form-input
              v-model="search"
              size="sm"
              class="me-sm-2"
              placeholder="Account, transaction, or block"
            />
            <b-button size="sm" class="my-2 my-sm-0" type="submit" @click="searchInput()">Search</b-button>
          </b-nav-form>
        </b-navbar-nav>
        <ul class="navbar-nav ms-auto">
          <li class="nav-item d-lg-block d-none">
            <div v-if="authStore.logged">
              <b-nav-item-dropdown size="lg" variant="link" no-caret right>
                <template #button-content>
                  <div class="image-profile" :style="{ backgroundImage: 'url(' + authStore.imgUrl + ')' }"></div>
                </template>
                <b-dropdown-header>{{ authStore.user }}</b-dropdown-header>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item @click="doLogout">Logout</b-dropdown-item>
              </b-nav-item-dropdown>
            </div>
            <div v-else>
              <button class="btn btn-primary" @click="showModalAuth">Login</button>
            </div>
          </li>
        </ul>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import AuthComponent from '@/components/Auth'
import Config from '@/config.js'
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
      showModal: false,
      linkLogo: '/',
      search: '',
    }
  },

  methods: {
    showModalAuth() {
      this.showModal = true
    },

    closeModalAuth() {
      this.showModal = false
    },

    onLogin() {
      this.closeModalAuth()
      this.$emit('login')
    },

    doLogout() {
      this.authStore.$patch({ user: '', logged: false, imgUrl: '', keys: { owner: null, active: null, posting: null, memo: null } })
      this.$emit('logout')
    },

    searchInput() {
      if (!this.search) return
      if (this.search.length === 40) {
        this.$router.push(`/explorer/tx/${this.search}`)
      } else if (/^\d+$/.test(this.search)) {
        this.$router.push(`/explorer/b/${this.search}`)
      } else {
        this.$router.push(`/explorer/@${this.search}`)
      }
    },
  },
}
</script>

<style scoped>
#logo {
  height: 2.3rem;
}
#logo img {
  max-width: 100%;
  max-height: 100%;
}
.extra-padding {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}
</style>
