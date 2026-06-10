<template>
  <div class="account-page">
    <AppHeader ref="appHeader" />

    <!-- Skeleton -->
    <div v-if="!exists.account" class="account-layout">
      <div class="skeleton-hero"></div>
      <div class="account-body">
        <div class="skeleton-sidebar">
          <div class="sk-card tall"></div>
          <div class="sk-card medium"></div>
          <div class="sk-card medium"></div>
        </div>
        <div class="skeleton-main">
          <div v-for="i in 10" :key="i" class="sk-row"></div>
        </div>
      </div>
    </div>

    <!-- Loaded -->
    <div v-else class="account-layout">

      <!-- Profile hero -->
      <div class="profile-hero">
        <div v-if="account.cover_image" class="cover-bg" :style="{ backgroundImage: 'url(' + account.cover_image + ')' }"></div>
        <div class="cover-overlay"></div>
        <div class="hero-inner"
          v-motion
          :initial="{ opacity: 0, y: -10 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24, delay: 60 } }"
        >
          <div class="hero-avatar" :style="{ backgroundImage: 'url(' + account.profile_image + ')' }"></div>
          <div class="hero-info">
            <h1 class="hero-name">@{{ account.name }}</h1>
            <div v-if="account.json_metadata && account.json_metadata.profile && account.json_metadata.profile.about" class="hero-bio">
              {{ account.json_metadata.profile.about }}
            </div>
          </div>
        </div>
      </div>

      <!-- Two-column body -->
      <div class="account-body">

        <!-- Sidebar -->
        <aside class="account-sidebar">

          <div class="s-section"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 100 } }"
          >
            <div class="section-eyebrow">Generals</div>
            <div class="s-card"><card-data :data="accountGenerals" /></div>
          </div>

          <div v-if="exists.voting_manabar" class="s-section"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 160 } }"
          >
            <div class="section-eyebrow">Voting Manabar</div>
            <div class="s-card"><card-data :data="account.voting_manabar" /></div>
          </div>

          <div class="s-section"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 200 } }"
          >
            <div class="section-eyebrow">Account Info</div>
            <div class="s-card"><card-data :data="accountGenerals2" /></div>
          </div>

          <div v-if="exists.witness" class="s-section"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 240 } }"
          >
            <div class="section-eyebrow">Witness Info</div>
            <div class="s-card">
              <card-data :data="witnessGenerals" />
              <div class="sub-eyebrow">Props</div>
              <card-data :data="witness.props" />
              <div class="sub-eyebrow">SBD Exchange Rate</div>
              <card-data :data="witness.sbd_exchange_rate" />
            </div>
          </div>

          <div class="s-section"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 280 } }"
          >
            <div class="section-eyebrow">Votes For</div>
            <div class="s-card"><card-data :data="account.witness_votes" typeCard="witnesses" :link="true" /></div>
          </div>

          <div class="s-section"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 320 } }"
          >
            <div class="section-eyebrow">Authorities</div>
            <div class="s-card">
              <template v-if="exists.witness">
                <div class="sub-eyebrow">Signing</div>
                <card-data :data="authorities.signing" />
              </template>
              <div class="sub-eyebrow">Owner</div>
              <card-data :data="authorities.owner" :link="true" />
              <div class="sub-eyebrow">Active</div>
              <card-data :data="authorities.active" :link="true" />
              <div class="sub-eyebrow">Posting</div>
              <card-data :data="authorities.posting" :link="true" />
              <div class="sub-eyebrow">Memo</div>
              <card-data :data="authorities.memo" />
            </div>
          </div>

        </aside>

        <!-- Main -->
        <main class="account-main">
          <div v-if="alertsStore.info"    class="page-alert info">{{ alertsStore.infoText }}</div>
          <div v-if="alertsStore.success" class="page-alert success" v-html="alertsStore.successText"></div>
          <div v-if="alertsStore.danger"  class="page-alert danger">{{ alertsStore.dangerText }}</div>

          <div v-if="exists.json_metadata" class="main-section"
            v-motion
            :initial="{ opacity: 0, y: 16 }"
            :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 120 } }"
          >
            <h3 class="section-hdg"><span class="accent-dot"></span> JSON Metadata</h3>
            <div class="s-card"><card-data :data="account.json_metadata" /></div>
          </div>

          <h3 class="section-hdg"
            v-motion
            :initial="{ opacity: 0, y: 10 }"
            :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 160 } }"
          >
            <span class="accent-dot"></span> Transactions
          </h3>

          <div v-if="exists.transactions">
            <div v-for="(tx, index) in transactions" :key="index">
              <trx :tx="tx" />
            </div>
          </div>
          <div v-else class="no-txs">No transactions found</div>

          <!-- Pagination -->
          <div v-if="pages.length > 1" class="pagination">
            <template v-for="(p, index) in pages" :key="index">
              <router-link v-if="p.link" :to="EXPLORER + p.link" class="page-btn">{{ p.text }}</router-link>
              <span v-else class="page-ellipsis">{{ p.text }}</span>
            </template>
          </div>
        </main>

      </div>
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
      limit: 20,
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

  watch: { '$route': 'fetchData' },

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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.account-page {
  background: #eef5fb;
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}

/* ── Profile hero ── */
.profile-hero {
  position: relative;
  height: 140px;
  background: #0e0e52;
  overflow: hidden;
}

.cover-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(14, 14, 82, 0.62);
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #1a2e6e;
  border: 3px solid rgba(68,157,209,.6);
  flex-shrink: 0;
}

.hero-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 .25rem;
  letter-spacing: -.02em;
}

.hero-bio {
  font-size: .82rem;
  color: rgba(255,255,255,.65);
  font-family: 'Outfit', sans-serif;
  line-height: 1.4;
  max-width: 500px;
}

/* ── Layout ── */
.account-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}

.account-body {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  align-items: start;
  margin-top: 1.5rem;
}

/* ── Sidebar ── */
.account-sidebar {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.s-section { display: flex; flex-direction: column; gap: .4rem; }

.section-eyebrow {
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #5878a0;
}

.sub-eyebrow {
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #b8d4ef;
  padding: .5rem .75rem .1rem;
}

.s-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #c8dff0;
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
  overflow: hidden;
}

/* ── Main ── */
.account-main { min-width: 0; }

.main-section { margin-bottom: 1.5rem; }

.section-hdg {
  display: flex;
  align-items: center;
  gap: .6rem;
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #0e0e52;
  margin: 0 0 .85rem;
  letter-spacing: -.01em;
}

.accent-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #449dd1;
  flex-shrink: 0;
}

.no-txs {
  color: #5878a0;
  font-size: .85rem;
  padding: 1rem 0;
}

/* ── Pagination ── */
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem;
  margin-top: 1.5rem;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 .6rem;
  background: #ffffff;
  border: 1px solid #c8dff0;
  border-radius: 7px;
  font-family: 'Outfit', sans-serif;
  font-size: .78rem;
  font-weight: 600;
  color: #192bc2;
  text-decoration: none;
  transition: background .15s, border-color .15s, color .15s;
}
.page-btn:hover {
  background: #eef5fb;
  border-color: #449dd1;
  color: #449dd1;
}
.page-btn.router-link-active {
  background: #192bc2;
  border-color: #192bc2;
  color: #ffffff;
}

.page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  color: #5878a0;
  font-size: .78rem;
}

/* ── Alerts ── */
.page-alert {
  border-radius: 10px;
  padding: .7rem 1rem;
  margin-bottom: 1rem;
  font-size: .85rem;
  font-family: 'Outfit', sans-serif;
}
.page-alert.info    { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }
.page-alert.success { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
.page-alert.danger  { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* ── Skeletons ── */
.skeleton-hero {
  height: 140px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

.skeleton-sidebar {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.sk-card {
  border-radius: 12px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.sk-card.tall   { height: 160px; }
.sk-card.medium { height: 110px; }

.skeleton-main { display: flex; flex-direction: column; gap: .5rem; }
.sk-row {
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .account-layout { padding: 0 1rem 3rem; }
  .account-body { grid-template-columns: 1fr; gap: 1rem; }
  .account-sidebar { position: static; }
}

@media (max-width: 600px) {
  .account-layout { padding: 0 .75rem 2.5rem; }
  .account-body { margin-top: 1rem; gap: .85rem; }
  .hero-name { font-size: 1.15rem; }
  .hero-bio  { font-size: .75rem; }
  .hero-avatar { width: 56px; height: 56px; }
  .profile-hero { height: 100px; }
  .page-title { font-size: 1.4rem; }
  .trx { flex-direction: column; align-items: flex-start; gap: .4rem; }
  .tx-time { float: none; margin-left: 0; margin-top: .1rem; }
}
</style>
