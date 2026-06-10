<template>
  <div class="container">
    <h2>Wallet page</h2>
    <hr />
    <p>You can derive your Serey keys here</p>
    <hr />
    <h3>Enter your username and Serey password below</h3>
    <div class="container">
      <div class="row">
        <div class="column">
          <label>Username</label><br>
          <input v-model="username" id="username" type="text">
        </div>
      </div>
      <div class="row">
        <div class="column">
          <label>Master Password</label><br>
          <input v-model="ownerkey" id="owner_key" type="password">
        </div>
      </div>
      <br />
      <div class="row">
        <div class="column">
          <button @click="deriveKeys">Derive Keys</button>
        </div>
      </div>
      <div v-if="derivedKeys.active" class="mt-3">
        <p><strong>Active key:</strong> <code>{{ derivedKeys.active }}</code></p>
        <p><strong>Posting key:</strong> <code>{{ derivedKeys.posting }}</code></p>
        <p><strong>Owner key:</strong> <code>{{ derivedKeys.owner }}</code></p>
        <p><strong>Memo key:</strong> <code>{{ derivedKeys.memo }}</code></p>
      </div>
    </div>
  </div>
</template>

<script>
import { PrivateKey } from 'dsteem'

export default {
  name: 'Wallet',

  data() {
    return {
      username: '',
      ownerkey: '',
      derivedKeys: {},
    }
  },

  methods: {
    deriveKeys() {
      if (!this.username || !this.ownerkey) return
      try {
        this.derivedKeys = {
          active: PrivateKey.fromLogin(this.username, this.ownerkey, 'active').toString(),
          posting: PrivateKey.fromLogin(this.username, this.ownerkey, 'posting').toString(),
          owner: PrivateKey.fromLogin(this.username, this.ownerkey, 'owner').toString(),
          memo: PrivateKey.fromLogin(this.username, this.ownerkey, 'memo').toString(),
        }
      } catch (e) {
        console.error('Key derivation error:', e)
      }
    },
  },
}
</script>
