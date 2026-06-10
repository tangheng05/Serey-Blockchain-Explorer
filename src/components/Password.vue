<template>
  <div>
    <AppHeader :showAuth="true" ref="appHeader" @login="onLogin" @logout="onLogout" />
    <div class="container">
      <h2>Change Password</h2>
      <div id="password-form" novalidate>
        <div class="row">
          <div class="col-12">
            <ul>
              <li>The first rule of EFTG is: Do not lose your password.</li>
              <li>The second rule of EFTG is: Nobody can reset your password.</li>
              <li>The third rule of EFTG is: Nobody can recover your password.</li>
              <li>The fourth rule: If you can remember the password, it's not secure.</li>
              <li>The fifth rule: Use only randomly-generated passwords.</li>
              <li>The sixth rule: Do not tell anyone your password.</li>
              <li>The seventh rule: Always back up your password.</li>
            </ul>
          </div>
        </div>
        <div class="form-group row">
          <label for="inputUsername" class="col-md-2 col-form-label">USERNAME</label>
          <div class="col-md-6">
            <input class="form-control" type="text" id="inputIssuerName"
                   :value="authStore.user" placeholder="Username" disabled/>
          </div>
        </div>
        <div class="form-group row">
          <label for="inputCurrentPassword" class="col-md-2 col-form-label">CURRENT PASSWORD</label>
          <div class="col-md-6">
            <input class="form-control" type="password" id="inputCurrentPassword"
                   v-model="currentPassword" placeholder="Current password or owner key"
                   :class="{'is-invalid': error.currentPassword }"/>
            <div v-if="error.currentPassword" class="invalid-feedback">{{ errorText.currentPassword }}</div>
          </div>
        </div>
        <div class="form-group row">
          <label for="inputNewPassword" class="col-md-2 col-form-label">NEW PASSWORD</label>
          <div class="col-md-6">
            <input class="form-control" type="password" id="inputNewPassword"
                   v-model="newPassword" placeholder="New password"
                   :class="{'is-invalid': error.newPassword }"/>
          </div>
        </div>
        <div class="form-group row">
          <label for="inputReNewPassword" class="col-md-2 col-form-label">RE-ENTER NEW PASSWORD</label>
          <div class="col-md-6">
            <input class="form-control" type="password" id="inputReNewPassword"
                   v-model="reNewPassword" placeholder="New password"
                   :class="{'is-invalid': error.reNewPassword }"/>
            <div v-if="error.reNewPassword" class="invalid-feedback">{{ errorText.reNewPassword }}</div>
          </div>
        </div>
        <div class="form-check row">
          <input type="checkbox" class="form-check-input col-md-12"
                 id="checkBoxWarning1" v-model="warning1"
                 :class="{'is-invalid': error.warning1 }">
          <label class="form-check-label" for="checkBoxWarning1">I understand that lost passwords cannot be recovered</label>
        </div>
        <div class="form-check row">
          <input type="checkbox" class="form-check-input col-md-12"
                 id="checkBoxWarning2" v-model="warning2"
                 :class="{'is-invalid': error.warning2 }">
          <label class="form-check-label" for="checkBoxWarning2">I have securely saved my new password</label>
        </div>
        <div class="form-group row">
          <div class="col-12">
            <button @click="updatePassword" class="btn btn-primary mt-2" :disabled="sending">
              <div v-if="sending" class="mini loader"></div>Update Password
            </button>
          </div>
        </div>
        <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{alertsStore.infoText}}</div>
        <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
        <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{alertsStore.dangerText}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import debounce from 'lodash.debounce'
import { PrivateKey } from 'dsteem'
import AppHeader from '@/components/layout/AppHeader'
import Config from '@/config.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'Password',
  components: { AppHeader },

  setup() {
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    const authStore = useAuthStore()
    return { ...rpc, alertsStore, authStore }
  },

  data() {
    return {
      account: null,
      currentPassword: '',
      passwordType: '',
      newPassword: '',
      reNewPassword: '',
      warning1: false,
      warning2: false,
      error: {
        currentPassword: false, newPassword: false,
        reNewPassword: false, warning1: false, warning2: false,
      },
      errorText: {
        currentPassword: 'No error', newPassword: 'No error',
        reNewPassword: 'No error', warning1: 'No error', warning2: 'No error',
      },
    }
  },

  created() {
    this.debounced_validateCurrentPassword = debounce(this.validateCurrentPassword, 300)
    if (this.authStore.logged) this.getUser()
  },

  watch: {
    currentPassword() { this.debounced_validateCurrentPassword() },
    newPassword() { this.validateNewPassword() },
    reNewPassword() { this.validateNewPassword() },
    warning1() { this.validateWarning1() },
    warning2() { this.validateWarning2() },
  },

  methods: {
    updatePassword() {
      let valid = true
      valid = this.validateCurrentPassword() && valid
      valid = this.validateNewPassword() && valid
      valid = this.validateWarning1() && valid
      valid = this.validateWarning2() && valid

      if (!valid) {
        this.alertsStore.showDanger('Error validating fields!')
        return false
      }

      const roles = { owner: {}, active: {}, posting: {}, memo: {} }
      for (const role in roles) {
        const privKey = PrivateKey.fromLogin(this.authStore.user, this.newPassword, role)
        const pubKey = privKey.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
        roles[role] = { key_auths: [[pubKey, 1]], account_auths: [], weight_threshold: 1 }
      }

      const operation = ['account_update', {
        account: this.account.name,
        memo_key: roles.memo.key_auths[0][0],
        json_metadata: this.account.json_metadata,
        owner: roles.owner,
        active: roles.active,
        posting: roles.posting,
      }]

      let privKey
      if (this.passwordType === 'master') {
        privKey = PrivateKey.fromLogin(this.authStore.user, this.currentPassword, 'owner')
      } else {
        privKey = PrivateKey.fromString(this.currentPassword)
      }

      this.sending = true
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.showInfo('Updating password...')

      this.steem_broadcast_sendOperations([operation], privKey)
        .then(response => {
          this.alertsStore.showSuccess('Password updated!')
          this.alertsStore.hideInfo()
          this.sending = false
          console.log(response)
        })
        .catch(error => {
          this.alertsStore.showDanger(error.message)
          this.alertsStore.hideInfo()
          this.sending = false
          console.log(error)
        })
    },

    onLogin() { this.getUser() },
    onLogout() { this.account = null },

    async getUser() {
      const accounts = await this.steem_database_call('get_accounts', [[this.authStore.user]])
      this.account = accounts[0]
    },

    validateCurrentPassword() {
      if (!this.account) {
        this.error.currentPassword = true
        this.errorText.currentPassword = 'Please login.'
        return false
      }

      const privKeyWIF = PrivateKey.fromLogin(this.authStore.user, this.currentPassword, 'owner')
      const pubKeyWIF = privKeyWIF.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()

      if (this.account.owner.key_auths[0][0] === pubKeyWIF) {
        this.error.currentPassword = false
        this.errorText.currentPassword = 'No error'
        this.passwordType = 'master'
        return true
      }

      try {
        const privKey = PrivateKey.fromString(this.currentPassword)
        const pubKey = privKey.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
        if (this.account.owner.key_auths[0][0] === pubKey) {
          this.error.currentPassword = false
          this.errorText.currentPassword = 'No error'
          this.passwordType = 'owner'
          return true
        }
      } catch (e) { /* */ }

      this.error.currentPassword = true
      this.errorText.currentPassword = 'Incorrect password.'
      return false
    },

    validateNewPassword() {
      const match = this.newPassword === this.reNewPassword
      this.error.newPassword = !match
      this.error.reNewPassword = !match
      this.errorText.newPassword = match ? 'No error' : "Password doesn't match"
      this.errorText.reNewPassword = match ? 'No error' : "Password doesn't match"
      return match
    },

    validateWarning1() {
      this.error.warning1 = !this.warning1
      this.errorText.warning1 = this.warning1 ? 'No error' : 'Check this field'
      return this.warning1
    },

    validateWarning2() {
      this.error.warning2 = !this.warning2
      this.errorText.warning2 = this.warning2 ? 'No error' : 'Check this field'
      return this.warning2
    },
  },
}
</script>
