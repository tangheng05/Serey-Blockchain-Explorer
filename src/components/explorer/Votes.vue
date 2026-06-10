<template>
  <div>
    <div v-if="data && data.length > 0" class="votes">
      <div class="title row">
        <div class="col-2">Voter</div>
        <div class="col-2">Weight</div>
        <div class="col-2">Value</div>
        <div class="col-2">New payout</div>
        <div class="col-2">Curation</div>
        <div class="col-2">Time</div>
      </div>
      <div v-for="(v, i) in votes" :key="i" class="data row">
        <div class="col-2">
          <router-link :to="EXPLORER + '@' + v.voter">@{{ v.voter }}</router-link>
          <span class="reputation">({{ v.rep_log }})</span>
        </div>
        <div class="col-2">{{ v.vote_weight }}</div>
        <div class="col-2">{{ v.vote_value }}</div>
        <div class="col-2">{{ v.vote_value_before }}</div>
        <div class="col-2">{{ v.curation }}</div>
        <div class="col-2" :title="v.time">{{ v.time_text }}</div>
      </div>
    </div>
    <div v-else class="votes">
      <div class="title row">
        <div class="col-2">Voter</div>
      </div>
      <div v-for="(voter, i) in dataApi" :key="i" class="data row">
        <div class="col-2">
          <router-link :to="EXPLORER + '@' + voter">@{{ voter }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import Utils from '@/utils/utils.js'
import { useChainProperties } from '@/composables/useChainProperties.js'

export default {
  name: 'Votes',

  props: {
    data: { type: Array, required: true },
    dataApi: { type: Array, required: true },
    payout: { type: Object, required: true },
  },

  setup() {
    const { chain, getChainProperties } = useChainProperties()
    return { chain, getChainProperties }
  },

  data() {
    return { EXPLORER: Config.EXPLORER }
  },

  computed: {
    votes() { return this.votesLinear() },
  },

  created() { this.getChainProperties() },

  methods: {
    votesLinear() {
      const votes_aux = [...this.data].sort((a, b) => parseInt(b.rshares) - parseInt(a.rshares))
      const total_rshares = votes_aux.reduce((t, v) => t + parseInt(v.rshares), 0)
      const total_payout_sbd = parseFloat(this.payout.total)
      let total_payout_curator_sbd = 0
      let total_weight = 0

      if (this.payout.old_post) {
        total_payout_curator_sbd = parseFloat(this.payout.curator)
        total_weight = votes_aux.reduce((t, v) => t + v.weight, 0)
      } else {
        total_payout_curator_sbd = 0.25 * total_payout_sbd
        total_weight = this.payout.total_vote_weight
      }

      return votes_aux.map(v => {
        v.vote_weight = (v.percent / 100).toFixed(2) + '%'
        v.vote_value = (total_payout_sbd * parseInt(v.rshares) / total_rshares).toFixed(3) + ' ' + Config.SBD
        if (this.payout.old_post) {
          v.curation = (total_payout_curator_sbd * v.weight / total_weight).toFixed(3) + ' ' + Config.SBD
        } else if (this.chain.feed_price >= 0) {
          v.curation = (total_payout_curator_sbd * v.weight / total_weight / this.chain.feed_price).toFixed(3) + ' ' + Config.SP
        } else {
          v.curation = (total_payout_curator_sbd * v.weight / total_weight).toFixed(3) + ' ' + Config.SBD
        }
        v.time_text = Utils.getTimestamp(v.time)
        v.rep_log = Utils.getReputation(v.reputation)
        return v
      })
    },
  },
}
</script>

<style scoped>
.title { width: 100%; border: solid 1px #8a8a8a; color: #a0a0a0; background-color: white; padding: 6px 10px; }
.data { width: 100%; border: solid 1px #8a8a8a; border-top-width: 0px; background-color: white; padding: 6px 10px; }
.reputation { font-size: 0.9rem; }
</style>
