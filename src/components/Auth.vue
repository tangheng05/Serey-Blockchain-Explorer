<template>
  <div class="container">
    <div novalidate>
      <div class="form-group row mb-2">
        <label for="inputUsername" class="col-md-4 col-form-label">USERNAME</label>
        <div class="col-md-8">
          <input class="form-control" type="text" id="inputUsername"
             @keyup.enter="try_to_login"
             v-model="username" placeholder="Enter your username"/>
        </div>
      </div>
      <div class="form-group row mb-3">
        <label for="inputPassword" class="col-md-4 col-form-label">PASSWORD</label>
        <div class="col-md-8">
          <input class="form-control" type="password" id="inputPassword"
             @keyup.enter="try_to_login"
             v-model="password" placeholder="Password or WIF"/>
        </div>
      </div>
      <div class="row">
        <div class="form-group col-md-12" style="padding-top: 8px;">
          <button @click="try_to_login" class="btn btn-primary me-2" :disabled="localSending">
            <span v-if="localSending" class="spinner-border spinner-border-sm me-1"></span>Login
          </button>
          <button @click="close" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
      <div v-if="errorMsg" class="alert alert-danger mt-3" role="alert">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script>
import { PrivateKey } from 'dsteem'
import Config from '@/config.js'
import Utils from '@/utils/utils.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAuthStore } from '@/stores/auth.js'
import { useChainStore } from '@/stores/chain.js'

export default {
  name: 'Auth',

  setup() {
    const rpc = useRPCNode()
    const authStore = useAuthStore()
    const chainStore = useChainStore()
    return { ...rpc, authStore, chainStore }
  },

  data() {
    return {
      username: '',
      password: '',
      localSending: false,
      errorMsg: '',
    }
  },

  methods: {
    async try_to_login() {
      this.errorMsg = ''
      this.localSending = true
      try {
        const auth = await this.login(this.username, this.password)
        if (auth.logged) {
          this.authStore.$patch(auth)
          this.$emit('login')
        }
      } catch (error) {
        console.log(error)
        const knownErrors = ['UserError', 'PasswordError', 'RPCError', 'RPCFailRounds', 'Abort']
        this.errorMsg = knownErrors.includes(error.name) ? error.message : 'Password format mismatch'
        this.$emit('error')
      } finally {
        this.localSending = false
      }
    },

    async login(_username, _password) {
      this.chainStore.max_fails = 1
      this.chainStore.max_fail_rounds = 2

      const accounts = await this.steem_database_call('get_accounts', [[_username]])
      if (accounts.length === 0) {
        const e = new Error('User @' + _username + ' does not exist')
        e.name = 'UserError'
        throw e
      }

      const keysFromWIF = {}
      for (const role of ['owner', 'active', 'posting']) {
        const priv = PrivateKey.fromLogin(_username, _password, role)
        keysFromWIF[role] = { private: priv, public: priv.createPublic(Config.STEEM_ADDRESS_PREFIX).toString() }
      }

      let keyRole = { public: '', private: null }
      try {
        keyRole.private = PrivateKey.fromString(_password)
        keyRole.public = keyRole.private.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
      } catch (e) { /* not a WIF key */ }

      const account = accounts[0]
      let json_metadata = {}
      try { json_metadata = JSON.parse(account.json_metadata) } catch (e) { /* */ }

      let keyFound = false
      let typeOfPassword = ''
      const auth = {
        user: '', logged: false, imgUrl: '',
        keys: { owner: null, active: null, posting: null, memo: null },
      }

      for (const role of ['owner', 'active', 'posting']) {
        for (const [pubKey] of account[role].key_auths) {
          if (pubKey === keysFromWIF[role].public) {
            auth.keys[role] = keysFromWIF[role].private
            keyFound = true
            typeOfPassword = 'WIF'
          } else if (pubKey === keyRole.public) {
            auth.keys[role] = keyRole.private
            keyFound = true
            typeOfPassword = role
          }
        }
      }

      if (!keyFound) {
        const e = new Error('Incorrect password. Please use posting key or WIF')
        e.name = 'PasswordError'
        throw e
      }

      auth.logged = true
      auth.user = _username
      auth.imgUrl = Utils.extractUrlProfileImage(json_metadata)
      this.chainStore.max_fails = 1
      this.chainStore.max_fail_rounds = 1000000
      console.log('Correct ' + typeOfPassword + ' key — Welcome @' + _username)
      return auth
    },

    close() {
      this.$emit('close')
    },
  },
}
</script>
