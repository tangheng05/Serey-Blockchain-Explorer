<template>
  <div>
    <!-- Login modal -->
    <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true" ref="loginModalEl">
      <div class="modal-dialog">
        <div class="modal-content s-modal">
          <div class="modal-header s-modal-header">
            <h5 class="modal-title s-modal-title" id="loginModalLabel">Sign In</h5>
            <button type="button" class="s-modal-close" @click="closeModalAuth" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <AuthComponent @login="onLogin" @close="closeModalAuth" />
          </div>
        </div>
      </div>
    </div>

    <!-- Spacer so content doesn't hide under fixed header -->
    <div class="s-header-spacer"></div>

    <!-- Main nav -->
    <header class="s-header">
      <div class="s-header-inner">

        <!-- Left: nav links -->
        <nav class="s-nav">
          <router-link to="/explorer" class="s-nav-link">
            <svg class="s-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Explorer
          </router-link>
          <router-link to="/witnesses" class="s-nav-link">
            <svg class="s-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Witnesses
          </router-link>
        </nav>

        <!-- Center: brand -->
        <router-link to="/" class="s-brand">
          <img src="../../assets/serey-logo.png" alt="Serey" class="s-brand-logo" />
        </router-link>

        <!-- Right: search + auth -->
        <div class="s-right">
          <form class="s-search" @submit.prevent="searchInput">
            <svg class="s-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="search"
              class="s-search-input"
              type="search"
              placeholder="Account, tx, or block…"
              aria-label="Search"
            />
          </form>

          <div v-if="authStore.logged" class="s-dropdown-wrap">
            <button class="s-avatar-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <div class="s-avatar" :style="{ backgroundImage: 'url(' + authStore.imgUrl + ')' }"></div>
              <span class="s-avatar-name">@{{ authStore.user }}</span>
              <svg class="s-avatar-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <ul class="dropdown-menu s-dropdown">
              <li class="s-dropdown-user">@{{ authStore.user }}</li>
              <li><hr class="s-dropdown-divider" /></li>
              <li><button class="s-dropdown-item" @click="doLogout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button></li>
            </ul>
          </div>
          <button v-else class="s-login-btn" @click="showModalAuth">Login</button>
        </div>

        <!-- Mobile toggler -->
        <button class="s-toggler" type="button" @click="menuOpen = !menuOpen" :class="{ open: menuOpen }">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Mobile nav -->
      <Transition name="menu-slide">
        <div v-show="menuOpen" class="s-mobile-nav">
          <router-link to="/explorer" class="s-mobile-link" @click="menuOpen = false">Explorer</router-link>
          <router-link to="/witnesses" class="s-mobile-link" @click="menuOpen = false">Witnesses</router-link>
          <form class="s-mobile-search" @submit.prevent="searchInput">
            <input v-model="search" class="s-mobile-input" type="search" placeholder="Account, tx, or block…" />
            <button class="s-mobile-search-btn" type="submit">Go</button>
          </form>
        </div>
      </Transition>
    </header>
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
    return { search: '', menuOpen: false, _bsModal: null }
  },

  mounted() {
    this._bsModal = new Modal(this.$refs.loginModalEl)
  },

  beforeUnmount() {
    if (this._bsModal) this._bsModal.dispose()
  },

  methods: {
    showModalAuth()  { this._bsModal.show() },
    closeModalAuth() { this._bsModal.hide() },
    onLogin()        { this.closeModalAuth(); this.$emit('login') },

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
      if (s.length === 40)       this.$router.push(`/explorer/tx/${s}`)
      else if (/^\d+$/.test(s)) this.$router.push(`/explorer/b/${s}`)
      else                       this.$router.push(`/explorer/@${s}`)
      this.search = ''
      this.menuOpen = false
    },
  },
}
</script>

<style scoped>
/* ── Header shell ── */
.s-header-spacer {
  height: 58px;
}

.s-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #ffffff;
  border-bottom: 2px solid #7aa8cc;
  box-shadow: 0 2px 12px rgba(14,14,82,.12);
}

.s-header-inner {
  display: flex;
  align-items: center;
  padding: 0 2rem;
  height: 58px;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
}

/* ── Brand (centered) ── */
.s-brand {
  display: flex;
  align-items: center;
  gap: .5rem;
  text-decoration: none;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.s-brand-logo { height: 2.2rem; }

.s-brand-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: #0e0e52;
  letter-spacing: -.01em;
}

/* ── Nav links (left) ── */
.s-nav {
  display: flex;
  align-items: center;
  gap: .25rem;
}

.s-nav-link {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .4rem .75rem;
  font-family: 'Outfit', sans-serif;
  font-size: .85rem;
  font-weight: 500;
  color: #5878a0;
  text-decoration: none;
  border-radius: 8px;
  transition: color .15s, background .15s;
  letter-spacing: .01em;
  white-space: nowrap;
}

.s-nav-link:hover {
  color: #0e0e52;
  background: #f4f8fc;
}

.s-nav-link.router-link-active {
  color: #0e0e52;
  font-weight: 700;
  background: #eef5fb;
}

.s-nav-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── Right side ── */
.s-right {
  display: flex;
  align-items: center;
  gap: .85rem;
  margin-left: auto;
}

/* ── Search ── */
.s-search {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #a8c8e8;
  border-radius: 9px;
  padding: 0 .75rem;
  transition: border-color .2s, box-shadow .2s;
  width: 240px;
}

.s-search:focus-within {
  border-color: #449dd1;
  box-shadow: 0 0 0 3px rgba(68,157,209,.12);
}

.s-search-icon {
  width: 13px;
  height: 13px;
  color: #5878a0;
  flex-shrink: 0;
  margin-right: .45rem;
}

.s-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: .82rem;
  color: #0e0e52;
  padding: .45rem 0;
  min-width: 0;
}

.s-search-input::placeholder { color: #5878a0; }
.s-search-input::-webkit-search-cancel-button { display: none; }

/* ── Login button ── */
.s-login-btn {
  background: #0e0e52;
  border: none;
  border-radius: 999px;
  padding: .45rem 1.3rem;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-size: .82rem;
  font-weight: 700;
  letter-spacing: .02em;
  color: #ffffff;
  white-space: nowrap;
  transition: background .18s, box-shadow .18s;
}
.s-login-btn:hover {
  background: #192bc2;
  box-shadow: 0 4px 14px rgba(25,43,194,.25);
}

/* ── Avatar dropdown ── */
.s-dropdown-wrap { position: relative; }

.s-avatar-btn {
  display: flex;
  align-items: center;
  gap: .4rem;
  background: transparent;
  border: 1.5px solid #e8eef5;
  border-radius: 999px;
  padding: .25rem .65rem .25rem .25rem;
  cursor: pointer;
  transition: border-color .18s;
}
.s-avatar-btn:hover { border-color: #c8dff0; }

.s-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #eef5fb;
}

.s-avatar-name {
  font-family: 'Outfit', sans-serif;
  font-size: .78rem;
  font-weight: 600;
  color: #0e0e52;
}

.s-avatar-caret { width: 12px; height: 12px; color: #5878a0; }

.s-dropdown {
  min-width: 160px;
  background: #ffffff;
  border: 1px solid #e8eef5;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(14,14,82,.12);
  padding: .4rem 0;
  margin-top: .4rem;
}

.s-dropdown-user {
  padding: .5rem 1rem;
  font-family: 'Outfit', sans-serif;
  font-size: .78rem;
  font-weight: 700;
  color: #5878a0;
}

.s-dropdown-divider { border-color: #e8eef5; margin: .25rem 0; }

.s-dropdown-item {
  display: flex;
  align-items: center;
  gap: .5rem;
  width: 100%;
  padding: .5rem 1rem;
  background: transparent;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: .82rem;
  color: #0e0e52;
  cursor: pointer;
  transition: background .15s;
}
.s-dropdown-item svg { width: 14px; height: 14px; }
.s-dropdown-item:hover { background: #f4f8fc; }

/* ── Mobile toggler ── */
.s-toggler {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: .4rem;
  margin-left: auto;
}
.s-toggler span {
  display: block;
  width: 22px;
  height: 2px;
  background: #0e0e52;
  border-radius: 2px;
  transition: transform .25s ease, opacity .2s ease;
  transform-origin: center;
}
.s-toggler.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.s-toggler.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.s-toggler.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Menu slide transition ── */
.menu-slide-enter-active,
.menu-slide-leave-active { transition: opacity .2s ease, transform .2s ease; }
.menu-slide-enter-from,
.menu-slide-leave-to     { opacity: 0; transform: translateY(-8px); }

/* ── Mobile nav ── */
.s-mobile-nav {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  border-top: 1px solid #e8eef5;
  padding: .75rem 1.5rem 1rem;
  background: #ffffff;
}

@media (max-width: 900px) {
  .s-nav, .s-search { display: none; }
  .s-brand   { order: 1; position: static; transform: none; }
  .s-right   { order: 2; margin-left: auto; gap: .4rem; }
  .s-toggler { order: 3; display: flex; margin-left: .35rem; }
}

.s-mobile-link {
  display: block;
  padding: .55rem .75rem;
  font-family: 'Outfit', sans-serif;
  font-size: .88rem;
  font-weight: 500;
  color: #5878a0;
  text-decoration: none;
  border-radius: 7px;
  transition: background .15s, color .15s;
}
.s-mobile-link:hover,
.s-mobile-link.router-link-active { background: #f4f8fc; color: #0e0e52; font-weight: 700; }

.s-mobile-search {
  display: flex;
  gap: .5rem;
  margin-top: .5rem;
}

.s-mobile-input {
  flex: 1;
  background: #f4f8fc;
  border: 1px solid #e8eef5;
  border-radius: 8px;
  padding: .5rem .85rem;
  font-family: 'Outfit', sans-serif;
  font-size: .85rem;
  color: #0e0e52;
  outline: none;
}
.s-mobile-input::placeholder { color: #b8d4ef; }

.s-mobile-search-btn {
  background: #0e0e52;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: .82rem;
  font-weight: 700;
  padding: 0 1rem;
  cursor: pointer;
  transition: background .15s;
}
.s-mobile-search-btn:hover { background: #192bc2; }

/* ── Modal ── */
.s-modal {
  border: 1px solid #e8eef5;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.s-modal-header {
  background: #f4f8fc;
  border-bottom: 1px solid #e8eef5;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.s-modal-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: #0e0e52;
  margin: 0;
}

.s-modal-close {
  background: transparent;
  border: none;
  color: #5878a0;
  cursor: pointer;
  padding: .2rem;
  border-radius: 6px;
  transition: color .15s, background .15s;
  display: flex;
}
.s-modal-close:hover { color: #0e0e52; background: #e8eef5; }
.s-modal-close svg { width: 18px; height: 18px; }
</style>
