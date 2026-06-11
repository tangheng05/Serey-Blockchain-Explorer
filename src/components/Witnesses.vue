<template>
  <div class="witnesses-page">
    <AppHeader portal="OAM Portal" :showAuth="true" ref="appHeader" @login="onLogin" @logout="onLogout" />

    <div class="witnesses-layout">

      <!-- Page title -->
      <div class="page-header"
        v-motion
        :initial="{ opacity: 0, y: -10 }"
        :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26, delay: 40 } }"
      >
        <div class="page-eyebrow">Serey Network</div>
        <h1 class="page-title">Witnesses</h1>
      </div>

      <!-- Table card -->
      <div class="table-card"
        v-motion
        :initial="{ opacity: 0, y: 16 }"
        :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 80 } }"
      >
        <!-- Loading skeleton -->
        <template v-if="witnesses.length === 0">
          <div class="skeleton-rows">
            <div v-for="i in 12" :key="i" class="skeleton-row"></div>
          </div>
        </template>

        <!-- Table -->
        <template v-else>
          <div class="table-wrap">
            <table class="w-table">
              <thead>
                <tr>
                  <th class="col-rank">#</th>
                  <th class="col-witness">Witness</th>
                  <th class="col-enabled">Enabled</th>
                  <th class="col-fee">Creation Fee</th>
                  <th class="col-approval">Approval</th>
                  <th class="col-block">Last Block</th>
                  <th class="col-miss">Missed</th>
                  <th class="col-since">Since</th>
                  <th class="col-vote">Vote</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(wit, index) in witnesses" :key="wit.id">
                  <td class="col-rank">
                    <span class="rank-num">{{ wit.position }}</span>
                  </td>
                  <td class="col-witness">
                    <div class="witness-cell">
                      <div class="w-avatar" :style="{ backgroundImage: 'url(' + wit.imgUrl.replace(/'/g, '') + ')' }"></div>
                      <router-link :to="EXPLORER + '@' + wit.owner" class="w-name">{{ wit.owner }}</router-link>
                    </div>
                  </td>
                  <td class="col-enabled">
                    <span class="status-dot" :class="wit.enabled ? 'on' : 'off'"></span>
                  </td>
                  <td class="col-fee mono">{{ wit.props ? wit.props.account_creation_fee : '—' }}</td>
                  <td class="col-approval mono">{{ wit.votes_sp }}</td>
                  <td class="col-block mono">{{ wit.last_confirmed_block_num }}</td>
                  <td class="col-miss mono" :class="{ 'miss-high': wit.total_missed > 5000 }">{{ wit.total_missed }}</td>
                  <td class="col-since mono">{{ new Date(wit.created).toLocaleDateString('en-us') }}</td>
                  <td class="col-vote">
                    <button
                      class="vote-btn"
                      :class="wit.newVote.approve ? 'vote-active' : 'vote-inactive'"
                      @click="toggleVote(index)"
                      :title="wit.newVote.approve ? 'Remove vote' : 'Vote for witness'"
                    >
                      <svg v-if="wit.newVote.approve" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script>
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

      const mapped = witnessesByVote.map((wit, i) => {
        wit.vote = { approve: false, shares: '0.000000 VESTS' }
        wit.newVote = { approve: false, shares: '0.000000 VESTS' }
        wit.votes_sp = this.witnessVotes2sp(wit.votes)
        wit.enabled = wit.signing_key !== Config.STEEM_ADDRESS_PREFIX + '1111111111111111111111111111111114T1Anm'
        let metadata = {}
        try { metadata = JSON.parse(accounts[i].json_metadata) } catch (e) { /* */ }
        wit.imgUrl = Utils.extractUrlProfileImage(metadata)
        wit.steem_power = this.vests2sp(accounts[i].vesting_shares)
        return wit
      })

      // Active witnesses first (by approval desc), then inactive (by approval desc)
      mapped.sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
        return parseInt(b.votes) - parseInt(a.votes)
      })
      mapped.forEach((wit, i) => { wit.position = i + 1 })
      this.witnesses = mapped
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

    onLogin()  { this.loadVotesFromAccount() },
    onLogout() { this.clearVotes() },

    toggleVote(index) {
      const wit = this.witnesses[index]
      wit.newVote.approve = !wit.newVote.approve
      this.witnesses[index] = { ...wit }
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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.witnesses-page {
  background: #eef5fb;
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}

.witnesses-layout {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
}

/* ── Page header ── */
.page-header { margin-bottom: 1.5rem; }

.page-eyebrow {
  font-size: .63rem;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: #5878a0;
  margin-bottom: .35rem;
}

.page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: #0e0e52;
  margin: 0 0 .3rem;
  letter-spacing: -.03em;
  line-height: 1.1;
}


/* ── Table card ── */
.table-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #c8dff0;
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
  overflow: hidden;
}

.table-wrap { overflow-x: auto; }

/* ── Table ── */
.w-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Outfit', sans-serif;
}

.w-table thead tr {
  border-bottom: 1.5px solid #c8dff0;
  background: #f4f9fd;
}

.w-table th {
  padding: .7rem 1rem;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #5878a0;
  white-space: nowrap;
  text-align: left;
}

.w-table tbody tr {
  border-bottom: 1px solid #eef5fb;
  transition: background .15s;
}
.w-table tbody tr:last-child { border-bottom: none; }
.w-table tbody tr:hover { background: #f8fcff; }

.w-table td {
  padding: .7rem 1rem;
  font-size: .82rem;
  color: #0e0e52;
  vertical-align: middle;
  white-space: nowrap;
}

/* ── Columns ── */
.col-rank { width: 48px; }
.col-witness { min-width: 180px; }
.col-enabled { width: 72px; }
.col-fee { width: 140px; }
.col-approval { width: 150px; }
.col-block { width: 120px; }
.col-miss { width: 80px; }
.col-since { width: 110px; }
.col-vote { width: 64px; text-align: center; }
.w-table th.col-vote { text-align: center; }

/* ── Rank number ── */
.rank-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: .75rem;
  font-weight: 600;
  color: #b8d4ef;
}

/* ── Witness cell ── */
.witness-cell {
  display: flex;
  align-items: center;
  gap: .65rem;
}

.w-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #c8dff0;
  border: 1.5px solid #c8dff0;
  flex-shrink: 0;
}

.w-name {
  font-family: 'Outfit', sans-serif;
  font-size: .85rem;
  font-weight: 600;
  color: #192bc2;
  text-decoration: none;
  transition: color .15s;
}
.w-name:hover { color: #449dd1; }

/* ── Status dot ── */
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.on  { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.15); }
.status-dot.off { background: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,.12); }

/* ── Mono data cells ── */
.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: .76rem;
  color: #0e0e52;
}

.miss-high { color: #dc2626; }

/* ── Vote button ── */
.vote-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid;
  cursor: pointer;
  transition: background .18s, border-color .18s, box-shadow .18s, transform .15s;
}
.vote-btn svg { width: 14px; height: 14px; }

.vote-btn:hover { transform: scale(1.1); }

.vote-inactive {
  background: #f0f9f0;
  border-color: #86efac;
  color: #16a34a;
}
.vote-inactive:hover {
  background: #dcfce7;
  border-color: #22c55e;
  box-shadow: 0 2px 8px rgba(34,197,94,.2);
}

.vote-active {
  background: #22c55e;
  border-color: #16a34a;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(34,197,94,.25);
}
.vote-active:hover {
  background: #f87171;
  border-color: #dc2626;
  box-shadow: 0 2px 8px rgba(248,113,113,.25);
}

/* ── Skeleton ── */
.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.skeleton-row {
  height: 52px;
  border-bottom: 1px solid #eef5fb;
  background: linear-gradient(90deg, #f4f9fd 25%, #eef5fb 50%, #f4f9fd 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.skeleton-row:last-child { border-bottom: none; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .witnesses-layout { padding: 1rem 1rem 3rem; }
  .page-title { font-size: 1.5rem; }
  .w-table th, .w-table td { padding: .5rem .65rem; }
  .col-fee, .col-miss, .col-since { display: none; }
}

@media (max-width: 500px) {
  .witnesses-layout { padding: .75rem .75rem 2.5rem; }
  .page-title { font-size: 1.3rem; }
  .w-table th, .w-table td { padding: .45rem .5rem; font-size: .75rem; }
  .w-name { font-size: .78rem; }
  .w-avatar { width: 26px; height: 26px; }
  .col-approval { display: none; }
}
</style>
