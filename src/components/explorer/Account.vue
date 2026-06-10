<template>
  <div class="account">
    <AppHeader ref="appHeader" />
    <div v-if="exists.account">
      <div class="profile" :style="account.cover_image === '' ? 'background-color: black;' : 'background-image: url(' + account.cover_image + ');'">
        <div>
          <div class="image" :style="'background-image: url(' + account.profile_image + ');'"></div>
          <div class="name"><h1><strong>@{{ account.name }}</strong></h1></div>
        </div>
      </div>
      <div class="container">
        <div class="row">
          <div class="col-md-3">
            <h2>Generals</h2>
            <card-data :data="accountGenerals" />
            <div v-if="exists.voting_manabar">
              <h2>Voting manabar</h2>
              <card-data :data="account.voting_manabar" />
            </div>
            <h2>Account info</h2>
            <card-data :data="accountGenerals2" />
            <div v-if="exists.witness">
              <h2>Witness info</h2>
              <card-data :data="witnessGenerals" />
              <h3>Witness props</h3>
              <card-data :data="witness.props" />
              <h3>SBD exchange rate</h3>
              <card-data :data="witness.sbd_exchange_rate" />
            </div>
            <h2>{{ account.name }} votes for</h2>
            <card-data :data="account.witness_votes" typeCard="witnesses" :link="true" />
            <h2>Authorities</h2>
            <div v-if="exists.witness">
              <h3>Signing Auth</h3>
              <card-data :data="authorities.signing" />
            </div>
            <h3>Owner Auth</h3>
            <card-data :data="authorities.owner" :link="true" />
            <h3>Active Auth</h3>
            <card-data :data="authorities.active" :link="true" />
            <h3>Posting Auth</h3>
            <card-data :data="authorities.posting" :link="true" />
            <h3>Memo Auth</h3>
            <card-data :data="authorities.memo" />
          </div>
          <div class="col-md-9">
            <div v-if="exists.json_metadata">
              <h2>JSON metadata</h2>
              <card-data :data="account.json_metadata" />
            </div>
            <h2>Transactions</h2>
            <div v-if="exists.transactions">
              <div v-for="(tx, index) in transactions" :key="index">
                <trx :tx="tx" />
              </div>
            </div>
            <div v-else>
              <p>No transaction found</p>
            </div>
            <div class="center">
              <div v-for="(p, index) in pages" :key="index" class="page">
                <span v-if="p.link"><router-link :to="EXPLORER + p.link">{{ p.text }}</router-link></span>
                <span v-else>{{ p.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="loader"></div>
    </div>
    <div class="container">
      <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{ alertsStore.infoText }}</div>
      <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
      <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{ alertsStore.dangerText }}</div>
    </div>
  </div>
</template>

<script>
import Utils from '@/utils/utils.js'
import Config from '@/config.js'
import CardData from '@/components/explorer/CardData'
import Trx from '@/components/explorer/Trx'
import AppHeader from '@/components/layout/AppHeader'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'

export default {
  name: 'Account',
  components: { AppHeader, CardData, Trx },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      account: {},
      witness: {},
      accountGenerals: {},
      accountGenerals2: {},
      witnessGenerals: {},
      authorities: {},
      transactions: {},
      limit: 500,
      pages: [],
      exists: {
        account: false,
        witness: false,
        json_metadata: false,
        witness_votes: false,
        voting_manabar: false,
        transactions: false,
      },
      EXPLORER: Config.EXPLORER,
    }
  },

  watch: {
    '$route': 'fetchData',
  },

  async created() {
    await this.getChainProperties()
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const name = this.$route.params.account
      this.exists.account = false
      this.exists.transactions = false
      this.exists.witness = false

      const result = await this.steem_database_call('get_accounts', [[name]])
      this.exists.account = true

      this.exists.json_metadata = result[0].json_metadata.length > 0
      this.exists.voting_manabar = !!result[0].voting_manabar

      try { result[0].json_metadata = JSON.parse(result[0].json_metadata) } catch (e) { /* */ }

      result[0].rep_log = Utils.getReputation(result[0].reputation)
      result[0].profile_image = Utils.getProfileImage(result[0].json_metadata)
      result[0].cover_image = Utils.extractUrlCoverImage(result[0].json_metadata)
      for (let i = 0; i < result[0].witness_votes.length; i++) {
        result[0].witness_votes[i] = { link: '@' + result[0].witness_votes[i], text: result[0].witness_votes[i] }
      }
      this.account = result[0]

      const no_keys = ['owner', 'active', 'posting', 'memo_key', 'json_metadata', 'voting_manabar',
        'proxied_vsf_votes', 'transfer_history', 'market_history', 'post_history', 'vote_history',
        'other_history', 'witness_votes', 'tags_usage', 'guest_bloggers', 'profile_image', 'cover_image',
        'balance', 'sbd_balance', 'savings_balance']
      const acc = {}
      for (const key in this.account) {
        if (!no_keys.includes(key)) acc[key] = this.account[key]
      }
      this.accountGenerals2 = acc
      this.authorities.owner = this.arrayAuthorities(this.account.owner)
      this.authorities.active = this.arrayAuthorities(this.account.active)
      this.authorities.posting = this.arrayAuthorities(this.account.posting)
      this.authorities.memo = [this.account.memo_key]

      const delegated = parseFloat(this.account.received_vesting_shares) - parseFloat(this.account.delegated_vesting_shares)
      this.accountGenerals = {
        voting_power: Utils.getVotingPower(this.account) / 100 + '%',
        balance: this.account.balance,
        sbd_balance: this.account.sbd_balance,
        savings_balance: this.account.savings_balance,
        steem_power: this.vests2sp(this.account.vesting_shares) + ' (' + (delegated > 0 ? '+' : '') + this.vests2sp(delegated) + ')',
      }

      const histHead = await this.steem_database_call('get_account_history', [name, -1, 1])
      const last_tx = histHead[0][0]
      let from = -1
      let limit = this.limit
      const total_pages = Math.ceil(last_tx / limit)
      let page = 1
      if (this.$route.query && this.$route.query.page) {
        page = parseInt(this.$route.query.page)
        from = last_tx - limit * (page - 1)
      } else {
        from = last_tx + 1
      }
      if (from < 0) from = 0
      if (from < limit) limit = from

      this.pages = []
      const NUMBER_PAGES_DISPLAYED = 10
      let ini = page - NUMBER_PAGES_DISPLAYED / 2
      let end = page + NUMBER_PAGES_DISPLAYED / 2 - 1
      if (ini < 1) { end += 1 - ini; ini = 1 }
      if (end > total_pages) { ini -= end - total_pages; if (ini < 1) ini = 1; end = total_pages }
      if (ini > 1) {
        this.pages.push({ text: '1', link: '@' + name + '?page=1' })
        this.pages.push({ text: '...' })
      }
      for (let i = ini; i <= end; i++) this.pages.push({ text: i + '', link: '@' + name + '?page=' + i })
      if (end < total_pages) {
        this.pages.push({ text: '...' })
        this.pages.push({ text: total_pages + '', link: '@' + name + '?page=' + total_pages })
      }

      const history = await this.steem_database_call('get_account_history', [name, from, limit])
      this.transactions = history.reverse()
      this.exists.transactions = true

      const witnessByAccount = await this.steem_database_call('get_witness_by_account', [name])
      if (!witnessByAccount) return

      this.witness = witnessByAccount
      const no_keys2 = ['signing_key', 'props', 'sbd_exchange_rate']
      const wit = {}
      for (const key2 in this.witness) {
        if (!no_keys2.includes(key2)) wit[key2] = this.witness[key2]
      }
      this.witnessGenerals = wit
      this.authorities.signing = [this.witness.signing_key]
      this.exists.witness = true
    },

    arrayAuthorities(auth) {
      const array = []
      for (let i = 0; i < auth.key_auths.length; i++) array.push(auth.key_auths[i][0])
      for (let j = 0; j < auth.account_auths.length; j++) array.push({ link: '@' + auth.account_auths[j][0], text: auth.account_auths[j][0] })
      return array
    },
  },
}
</script>

<style scoped>
.profile {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 8rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  color: white;
  text-shadow: 2px 2px 5px #000000;
}
.image {
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  padding: 7px;
  height: 3.5rem;
  width: 3.5rem;
  border-radius: 50%;
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
}
.name { display: inline-block; vertical-align: middle; }
.page { display: inline-block; margin: 10px 4px; }
</style>
