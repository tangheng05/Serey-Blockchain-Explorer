<template>
  <div class="votes-wrap">
    <!-- Full vote data from RPC -->
    <div v-if="data && data.length > 0">
      <div class="votes-table-wrap">
        <table class="votes-table">
          <thead>
            <tr>
              <th>Voter</th>
              <th>Weight</th>
              <th>Value</th>
              <th>Curation</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in votes" :key="i">
              <td>
                <router-link :to="EXPLORER + '@' + v.voter" class="voter-link">@{{ v.voter }}</router-link>
                <span class="rep-badge">{{ v.rep_log }}</span>
              </td>
              <td class="num">{{ v.vote_weight }}</td>
              <td class="num accent">{{ v.vote_value }}</td>
              <td class="num">{{ v.curation }}</td>
              <td class="time" :title="v.time">{{ v.time_text }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Lightweight list from API (no RPC vote data) -->
    <div v-else-if="dataApi && dataApi.length > 0">
      <div class="voters-list">
        <router-link
          v-for="(voter, i) in dataApi"
          :key="i"
          :to="EXPLORER + '@' + voter"
          class="voter-chip"
        >
          @{{ voter }}
        </router-link>
      </div>
    </div>

    <div v-else class="empty-votes">No votes yet</div>
  </div>
</template>

<script>
import Config from '@/config.js'
import Utils from '@/utils/utils.js'
import { useChainProperties } from '@/composables/useChainProperties.js'

export default {
  name: 'Votes',

  props: {
    data:    { type: Array,  required: true },
    dataApi: { type: Array,  required: true },
    payout:  { type: Object, required: true },
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
        v.vote_value  = (total_payout_sbd * parseInt(v.rshares) / total_rshares).toFixed(3) + ' ' + Config.SBD
        if (this.payout.old_post) {
          v.curation = (total_payout_curator_sbd * v.weight / total_weight).toFixed(3) + ' ' + Config.SBD
        } else if (this.chain.feed_price >= 0) {
          v.curation = (total_payout_curator_sbd * v.weight / total_weight / this.chain.feed_price).toFixed(3) + ' ' + Config.SP
        } else {
          v.curation = (total_payout_curator_sbd * v.weight / total_weight).toFixed(3) + ' ' + Config.SBD
        }
        v.time_text = Utils.getTimestamp(v.time)
        v.rep_log   = Utils.getReputation(v.reputation)
        return v
      })
    },
  },
}
</script>

<style scoped>
.votes-wrap {
  font-family: 'Outfit', sans-serif;
}

/* Scrollable wrapper for wide table */
.votes-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #c8dff0;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15,23,42,.05);
}

.votes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .84rem;
  white-space: nowrap;
}

.votes-table thead tr {
  background: #f4f9fd;
  border-bottom: 2px solid #c8dff0;
}

.votes-table th {
  padding: .65rem 1rem;
  text-align: left;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #5878a0;
}

.votes-table tbody tr {
  border-bottom: 1px solid #eef5fb;
  transition: background .15s;
}

.votes-table tbody tr:last-child { border-bottom: none; }

.votes-table tbody tr:hover { background: #eff6ff; }

.votes-table td {
  padding: .6rem 1rem;
  color: #0e0e52;
  vertical-align: middle;
}

.voter-link {
  font-weight: 600;
  color: #0e0e52;
  text-decoration: none;
  transition: color .15s;
}
.voter-link:hover { color: #449dd1; }

.rep-badge {
  display: inline-block;
  margin-left: .4rem;
  padding: .1em .45em;
  font-size: .7rem;
  background: #eef5fb;
  color: #5878a0;
  border-radius: 4px;
  font-weight: 500;
  vertical-align: middle;
}

.num  { font-variant-numeric: tabular-nums; color: #3b5c9e; }
.accent { color: #449dd1; font-weight: 600; }
.time { color: #5878a0; font-size: .8rem; }

/* Voter chips (API-only fallback) */
.voters-list {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}

.voter-chip {
  display: inline-block;
  padding: .3rem .7rem;
  background: #fff;
  border: 1px solid #c8dff0;
  border-radius: 999px;
  font-size: .8rem;
  color: #0e0e52;
  text-decoration: none;
  transition: border-color .15s, color .15s, background .15s;
}
.voter-chip:hover {
  border-color: #449dd1;
  color: #449dd1;
  background: #eff6ff;
}

.empty-votes {
  padding: 1.25rem;
  color: #5878a0;
  font-size: .88rem;
  text-align: center;
  background: #fff;
  border: 1px solid #c8dff0;
  border-radius: 10px;
}
</style>
