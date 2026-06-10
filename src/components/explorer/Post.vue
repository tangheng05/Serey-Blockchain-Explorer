<template>
  <div class="post">
    <AppHeader ref="appHeader" />
    <div class="container">
      <div v-if="exists">
        <div class="row">
          <div class="col-md-3">
            <h3 class="right">
              Payout<br>
              {{ payout.total }}
              ({{ (parseFloat(payout.total) * (sereyPrice || 0)).toFixed(2) }}$)
            </h3>
            <card-data :data="payout.card" />
            <div v-if="post.depth === 0"><h2>Post Info</h2></div>
            <div v-else><h2>Comment Info</h2></div>
            <card-data :data="postGenerals" />
          </div>
          <div class="col-md-9">
            <h2><router-link :to="EXPLORER + '@' + post.author">@{{ post.author }}</router-link></h2>
            <div v-if="post.depth === 0">
              <h1>{{ post.title }}</h1>
            </div>
            <div v-else>
              <h1>Comment</h1>
              <div v-if="post.depth > 1">
                <router-link :to="EXPLORER + '@' + post.parent_author + '/' + post.parent_permlink">Parent Comment</router-link>
              </div>
              <router-link :to="EXPLORER + '@' + post.root_author + '/' + post.root_permlink">Root Post</router-link>
            </div>
            <a class="mt-2" :href="'https://serey.io/authors/' + post.author + '/' + post.permlink">Open with Serey.io</a>
            <div class="body break-word" v-html="postDetail ? postDetail.description : ''"></div>
            <card-data :data="post.json_metadata" />
            <h2>{{ postDetail ? postDetail.voter_count : 0 }} Votes</h2>
            <votes :data="post.active_votes || []" :dataApi="postDetail ? postDetail.voters : []" :payout="payout" />
            <div v-if="post.beneficiaries && post.beneficiaries.length > 0">
              <h2>Beneficiaries</h2>
              <beneficiaries :data="post.beneficiaries" :payout="payout" />
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="loader"></div>
      </div>
      <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{ alertsStore.infoText }}</div>
      <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
      <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{ alertsStore.dangerText }}</div>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import AppHeader from '@/components/layout/AppHeader'
import CardData from '@/components/explorer/CardData'
import Votes from '@/components/explorer/Votes'
import Beneficiaries from '@/components/explorer/Beneficiaries'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import axios from 'axios'

export default {
  name: 'Post',
  components: { AppHeader, CardData, Votes, Beneficiaries },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      post: {},
      postDetail: null,
      postGenerals: {},
      payout: { total: '', card: {} },
      sereyPrice: null,
      exists: false,
      EXPLORER: Config.EXPLORER,
    }
  },

  watch: { '$route': 'fetchData' },

  async created() {
    await this.getChainProperties()
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const author = this.$route.params.account
      const permlink = this.$route.params.permlink
      this.exists = false

      try {
        const res = await axios.get(`https://global-api.serey.io/api/v1/sereyweb/getDetailByPermlink?permlink=${permlink}&authorName=${author}`)
        this.postDetail = res.data.content
      } catch (e) { /* API may be unavailable */ }

      const result = await this.steem_database_call('get_content', [author, permlink])
      this.post = result

      const no_keys = ['body', 'json_metadata', 'beneficiaries', 'active_votes', 'replies', 'body_length', 'reblogged_by']
      const pst = {}
      for (const key in this.post) {
        if (!no_keys.includes(key)) pst[key] = this.post[key]
      }
      this.postGenerals = pst

      this.payout.old_post = (new Date()) - (new Date(result.cashout_time + 'Z')) > 0
      this.payout.net_rshares = result.net_rshares
      if (this.payout.old_post) {
        this.payout.total = (parseFloat(result.total_payout_value) + parseFloat(result.curator_payout_value)).toFixed(3) + ' ' + Config.SBD
        this.payout.author = result.total_payout_value
        this.payout.curator = result.curator_payout_value
      } else {
        this.payout.total = result.pending_payout_value
        this.payout.total_vote_weight = result.total_vote_weight
      }
      this.payoutCard()

      try {
        const priceRes = await axios.get('https://global-api.serey.io/api/v1/general/get_serey_price')
        this.sereyPrice = priceRes.data.price
      } catch (e) { /* */ }

      this.exists = true
    },

    payoutCard() {
      const total_payout_sbd = parseFloat(this.payout.total)
      let total_payout_author_sbd = 0
      let total_payout_curator_sbd = 0
      let total_payout_reward_pool_sbd = 0
      const forward_curation_remainder = this.HARDFORK <= 19

      if (this.payout.old_post) {
        total_payout_author_sbd = parseFloat(this.payout.author)
        total_payout_curator_sbd = parseFloat(this.payout.curator)
      } else {
        total_payout_author_sbd = 0.75 * total_payout_sbd
        total_payout_curator_sbd = 0.25 * total_payout_sbd
        const curation_remainder = total_payout_curator_sbd * (this.post.total_vote_weight - (this.post.active_votes || []).reduce((t, v) => t + v.weight, 0)) / this.post.total_vote_weight
        total_payout_curator_sbd -= curation_remainder
        if (forward_curation_remainder) total_payout_author_sbd += curation_remainder
        else total_payout_reward_pool_sbd = curation_remainder
      }

      const total_weight_beneficiaries = (this.post.beneficiaries || []).reduce((t, b) => t + parseInt(b.weight), 0)
      const total_payout_beneficiaries_sbd = total_payout_author_sbd * total_weight_beneficiaries / 10000
      total_payout_author_sbd -= total_payout_beneficiaries_sbd

      this.payout.card = {
        Author: total_payout_author_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_author_sbd / total_payout_sbd).toFixed(2) + '%)',
        Curators: total_payout_curator_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_curator_sbd / total_payout_sbd).toFixed(2) + '%)',
        Beneficiaries: total_payout_beneficiaries_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_beneficiaries_sbd / total_payout_sbd).toFixed(2) + '%)',
      }
      if (total_payout_reward_pool_sbd > 0) {
        this.payout.card.Reward_Pool = total_payout_reward_pool_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_reward_pool_sbd / total_payout_sbd).toFixed(2) + '%)'
      }
    },
  },
}
</script>

<style scoped>
.body {
  background-color: white;
  font-family: monospace;
  padding: 10px 15px;
  margin: 10px auto;
  border: solid 1px #8a8a8a;
  overflow-y: scroll;
  overflow-x: auto;
  height: 900px !important;
}
</style>
