<template>
  <div>
    <AppHeader portal="OAM Portal" :showAuth="true" ref="appHeader" @login="onLogin" @logout="onLogout" />
    <div class="container">
      <h2>Witnesses</h2>
      <div v-if="witnesses.length > 0">
        <table class="table">
          <thead>
            <tr class="table-primary">
              <th scope="col">#</th>
              <th scope="col">Witness</th>
              <th scope="col">Enabled</th>
              <th scope="col">Account Creation Fee</th>
              <th scope="col">Approval</th>
              <th scope="col">Last Block</th>
              <th scope="col">Miss</th>
              <th scope="col">Since</th>
              <th scope="col">Vote</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(wit, index) in witnesses" :key="wit.id" :value="wit.owner">
              <td>{{ wit.position }}</td>
              <td>
                <div :style="{ backgroundImage: 'url(' + wit.imgUrl.replace(/'/g, '') + ')' }" class="image-profile me-2"></div>
                <router-link :to="EXPLORER + '@' + wit.owner">{{ wit.owner }}</router-link>
              </td>
              <td><div class="circle" :class="{ enabled: wit.enabled, disabled: !wit.enabled }"></div></td>
              <td>{{ wit.props ? wit.props.account_creation_fee : '' }}</td>
              <td>{{ wit.votes_sp }}</td>
              <td>{{ wit.last_confirmed_block_num }}</td>
              <td>{{ wit.total_missed }}</td>
              <td>{{ new Date(wit.created).toLocaleDateString('en-us') }}</td>
              <td>
                <button class="btn" @click="toggleVote(index)"
                  :class="{ 'btn-danger': wit.newVote.approve, 'btn-success': !wit.newVote.approve }">
                  <font-awesome-icon v-if="wit.newVote.approve" icon="times" />
                  <font-awesome-icon v-else icon="check" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <div class="loader"></div>
      </div>
    </div>
  </div>
</template>

<script>
import debounce from 'lodash.debounce'
import Config from '@/config.js'
import Utils from '@/utils/utils.js'
import AppHeader from '@/components/layout/AppHeader'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import { useAuthStore } from '@/stores/auth.js'

export default {
  name: 'Witnesses',
  components: { AppHeader },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    const authStore = useAuthStore()
    return { ...chainProps, ...rpc, alertsStore, authStore }
  },

  data() {
    return {
      account: { vesting_shares: '0.000000 VESTS' },
      witnesses: [],
      witLoaded: false,
      saving: false,
      EXPLORER: Config.EXPLORER,
    }
  },

  async created() {
    await this.getChainProperties()
    this.loadWitnessesByVote()
  },

  methods: {
    async loadWitnessesByVote() {
      const witnessesByVote = await this.steem_database_call('get_witnesses_by_vote', ['', 100])
      const names = witnessesByVote.map(w => w.owner)
      const accounts = await this.steem_database_call('get_accounts', [names])

      this.witnesses = witnessesByVote.map((wit, i) => {
        wit.vote = { approve: false, shares: '0.000000 VESTS' }
        wit.newVote = { approve: false, shares: '0.000000 VESTS' }
        wit.votes_sp = this.witnessVotes2sp(wit.votes)
        wit.position = i + 1
        wit.enabled = wit.signing_key !== Config.STEEM_ADDRESS_PREFIX + '1111111111111111111111111111111114T1Anm'
        let metadata = {}
        try { metadata = JSON.parse(accounts[i].json_metadata) } catch (e) { /* */ }
        wit.imgUrl = Utils.extractUrlProfileImage(metadata)
        wit.steem_power = this.vests2sp(accounts[i].vesting_shares)
        return wit
      })
      this.witLoaded = true
      if (this.authStore.logged) await this.loadVotesFromAccount()
    },

    async loadVotesFromAccount() {
      if (!this.witLoaded) return
      const accounts = await this.steem_database_call('get_accounts', [[this.authStore.user]])
      this.account = accounts[0]
      this.clearVotes()

      for (const vote of this.account.witness_votes) {
        const id = this.witnesses.findIndex(w => w.owner === vote)
        if (id >= 0) {
          this.witnesses[id].vote.approve = true
          this.witnesses[id].newVote.approve = true
        }
      }
    },

    onLogin() { this.loadVotesFromAccount() },
    onLogout() { this.clearVotes() },

    toggleVote(index) {
      const wit = this.witnesses[index]
      wit.newVote.approve = !wit.newVote.approve
      this.witnesses[index] = { ...wit }
      // Note: broadcasting witness votes requires signing keys — not implemented in this version.
      window.alert(`Vote ${wit.newVote.approve ? 'added for' : 'removed from'} ${wit.owner} (requires signing key to broadcast)`)
    },

    clearVotes() {
      this.witnesses = this.witnesses.map(wit => ({
        ...wit,
        vote: { approve: false, shares: '0.000000 VESTS' },
        newVote: { approve: false, shares: '0.000000 VESTS' },
      }))
    },
  },
}
</script>

<style scoped>
.image-profile {
  display: inline-block;
  height: 2rem;
  width: 2rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 50%;
  vertical-align: middle;
}
.circle { border: 2px solid; border-radius: 50%; width: 12px; height: 12px; }
.enabled { border-color: green; }
.disabled { border-color: red; }
.table > tbody > tr > td { vertical-align: middle; }
.table { border: 1px solid #ddd; }
tr:nth-child(even) { background-color: #f2f2f2; }
</style>
