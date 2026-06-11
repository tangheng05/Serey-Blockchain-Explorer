<template>
  <div class="home-page">
    <AppHeader ref="appHeader" />

    <div class="home-layout">

      <!-- ── LEFT SIDEBAR: Chain stats ── -->
      <aside class="home-sidebar">

        <template v-if="exists.globals">
          <div class="s-card"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 60 } }"
          >
            <div class="card-eyebrow">Current Supply</div>
            <div class="stat-figure">{{ chain.current_supply }}</div>
            <div class="stat-sub">{{ chain.current_sbd_supply }}</div>
            <div class="stat-divider"></div>
            <div class="stat-row">
              <span class="stat-label">Virtual</span>
              <span class="stat-value">{{ chain.virtual_supply }}</span>
            </div>
          </div>

          <div class="s-card"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 120 } }"
          >
            <div class="card-eyebrow">Serey Price</div>
            <div v-if="sereyPrice" class="stat-figure">{{ sereyPrice }} <span class="stat-currency">USD</span></div>
            <div v-else class="stat-figure muted">—</div>
          </div>

          <!-- Inflation card hidden
          <div class="s-card"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 180 } }"
          >
            <div class="card-eyebrow">Inflation</div>
            <div class="stat-figure">{{ chain.current_inflation_rate }}</div>
            <div class="stat-sub">Annual rate</div>
            <div class="stat-divider"></div>
            <div class="stat-row">
              <span class="stat-label">Per day</span>
              <span class="stat-value">{{ chain.new_steem_per_day }}</span>
            </div>
          </div>
          -->

          <div class="s-card"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 240 } }"
          >
            <div class="card-eyebrow">Stake</div>
            <div class="stat-figure">{{ chain.total_vesting_fund_steem }}</div>
            <div class="stat-divider"></div>
            <div class="stat-row">
              <span class="stat-label">% of virtual</span>
              <span class="stat-value">{{ chain.sp_percent ? chain.sp_percent.toFixed(2) : '0' }}%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Shares</span>
              <span class="stat-value mono">{{ chain.total_vesting_shares }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Per MVESTS</span>
              <span class="stat-value mono">{{ chain.steem_per_mvests ? chain.steem_per_mvests.toFixed(3) : '0' }} {{ STEEM_SYMBOL }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="s-card skeleton-card tall"></div>
          <div class="s-card skeleton-card medium"></div>
          <div class="s-card skeleton-card medium"></div>
          <div class="s-card skeleton-card medium"></div>
        </template>

        <template v-if="exists.reward">
          <div class="s-card"
            v-motion
            :initial="{ opacity: 0, x: -24 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 300 } }"
          >
            <div class="card-eyebrow">Reward Fund</div>
            <div class="stat-figure">{{ chain.reward_balance }} <span class="stat-currency">{{ STEEM_SYMBOL }}</span></div>
            <div class="stat-divider"></div>
            <div class="stat-row">
              <span class="stat-label">Per day</span>
              <span class="stat-value mono">{{ chain.reward_balance_day }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Vote / 1k {{ SP_SYMBOL }}</span>
              <span class="stat-value mono">{{ chain.vote_value_1000_sp ? chain.vote_value_1000_sp.toFixed(3) : '0' }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">% of virtual</span>
              <span class="stat-value">{{ chain.reward_percent ? chain.reward_percent.toFixed(2) : '0' }}%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Recent claims</span>
              <span class="stat-value mono small">{{ chain.recent_claims }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="s-card skeleton-card medium"></div>
        </template>

      </aside>

      <!-- ── CENTER: Last Blocks ── -->
      <main class="home-main">
        <div v-if="alertsStore.info"    class="page-alert info">{{ alertsStore.infoText }}</div>
        <div v-if="alertsStore.success" class="page-alert success" v-html="alertsStore.successText"></div>
        <div v-if="alertsStore.danger"  class="page-alert danger">{{ alertsStore.dangerText }}</div>

        <!-- ── Homepage Search ── -->
        <form class="hs-form" @submit.prevent="handleSearch"
          v-motion
          :initial="{ opacity: 0, y: -10 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26, delay: 20 } }"
        >
          <svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="hsQuery"
            class="hs-input"
            type="text"
            placeholder="Search users or paste a link to verify ownership"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="hs-btn" type="submit">Search</button>
        </form>

        <h2 class="section-hdg"
          v-motion
          :initial="{ opacity: 0, y: -10 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26, delay: 40 } }"
        >
          <span class="accent-dot"></span> Last Blocks
        </h2>

        <div v-if="lastBlocks.length > 0" class="block-list">
          <transition-group name="block-slide" tag="div">
            <div
              v-for="b in lastBlocks"
              :key="b.block_num"
              class="block-row"
            >
              <div class="block-num-wrap">
                <router-link :to="EXPLORER + 'b/' + b.block_num" class="block-num">#{{ b.block_num }}</router-link>
              </div>
              <div class="block-txs">
                <template v-if="b.loaded">
                  <span class="tx-count">{{ b.size_txs }}</span>
                  <span class="tx-label">{{ b.size_txs === 1 ? 'transaction' : 'transactions' }}</span>
                  <span v-if="b.size_posts > 0" class="tx-posts">· {{ b.size_posts }} post{{ b.size_posts > 1 ? 's' : '' }}</span>
                </template>
                <span v-else class="loading-dot">···</span>
              </div>
              <div class="block-witness-wrap">
                <span class="witness-label">witness</span>
                <router-link :to="EXPLORER + '@' + b.witness" class="witness-name">{{ b.witness }}</router-link>
              </div>
            </div>
          </transition-group>
        </div>
        <div v-else class="skeleton-blocks">
          <div v-for="i in 10" :key="i" class="skeleton-row"></div>
        </div>
      </main>

      <!-- ── RIGHT: Witness Schedule ── -->
      <aside class="home-schedule">
        <h2 class="section-hdg"
          v-motion
          :initial="{ opacity: 0, y: -10 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26, delay: 80 } }"
        >
          <span class="accent-dot"></span> Schedule
        </h2>

        <div v-if="exists.schedule" class="schedule-list">
          <transition-group name="schedule-slide" tag="div">
            <div
              v-for="(wit, idx) in schedule"
              :key="wit"
              class="schedule-item"
              :class="{ active: idx === 0 }"
            >
              <span v-if="idx === 0" class="schedule-badge">Next</span>
              <router-link :to="EXPLORER + '@' + wit" class="schedule-name">{{ wit }}</router-link>
            </div>
          </transition-group>
        </div>
        <div v-else class="skeleton-schedule">
          <div v-for="i in 21" :key="i" class="skeleton-schedule-item"></div>
        </div>
      </aside>

    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import Utils from '@/utils/utils.js'
import CardData from '@/components/explorer/CardData'
import Trx from '@/components/explorer/Trx'
import AppHeader from '@/components/layout/AppHeader'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import axios from 'axios'

export default {
  name: 'Home',

  components: { CardData, Trx, AppHeader },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      lastBlocks: [],
      schedule: [],
      sereyPrice: null,
      exists: { globals: false, reward: false, schedule: false },
      ints: {},
      first_time: true,
      last_block_num: 0,
      wait_more_time: false,
      EXPLORER: Config.EXPLORER,
      hsQuery: '',
    }
  },

  async created() {
    this.chain.feed_price = 0
    this.chain.witnesses_price = 0
    this.chain.haircut_price = 0
    this.chain.sp_percent = 0
    this.chain.steem_per_mvests = 0
    this.chain.sbd_percent = 0
    this.chain.reward_percent = 0
    this.chain.vote_value_1000_sp = 0

    await this.getChainProperties(true)
    this.getExtendedChainProperties()
    this.exists.reward = true
    this.exists.globals = true

    await this.getWitnessSchedule()

    this.ints.blocks = setInterval(this.fetchBlocks, 3000)
    this.ints.chainprops = setInterval(async () => {
      await this.getChainProperties(true)
      this.getExtendedChainProperties()
      this.getWitnessSchedule()
    }, 12000)

    axios.get('https://global-api.serey.io/api/v1/general/get_serey_price')
      .then(res => { this.sereyPrice = res.data.price })
      .catch(() => {})
  },

  beforeUnmount() {
    clearInterval(this.ints.chainprops)
    clearInterval(this.ints.blocks)
  },

  methods: {
    handleSearch() {
      const raw = this.hsQuery.trim()
      if (!raw) return
      this.hsQuery = ''

      // Serey blog URL: /authors/{account}/{permlink}
      const urlMatch = raw.match(/\/authors\/([^/]+)\/([^/?#]+)/)
      if (urlMatch) {
        this.$router.push(`/explorer/@${urlMatch[1]}/${urlMatch[2]}`)
        return
      }

      // Generic serey.io/@account/permlink URL
      const atUrlMatch = raw.match(/@([^/]+)\/([^/?#]+)/)
      if (atUrlMatch) {
        this.$router.push(`/explorer/@${atUrlMatch[1]}/${atUrlMatch[2]}`)
        return
      }

      const s = raw.replace(/^@/, '')
      if (s.length === 40)       this.$router.push(`/explorer/tx/${s}`)
      else if (/^\d+$/.test(s)) this.$router.push(`/explorer/b/${s}`)
      else                       this.$router.push(`/explorer/@${s}`)
    },

    async getWitnessSchedule() {
      const witness_schedule = await this.steem_database_call('get_witness_schedule')

      if (this.first_time) this.last_block_num = this.chain.head_block_number
      this.first_time = false
      this.exists.schedule = true

      if (this.schedule.length === 0) {
        this.schedule = witness_schedule.current_shuffled_witnesses
        return
      }

      const current_witness = this.lastBlocks.length > 0 ? this.lastBlocks[0].witness : ''
      const round = witness_schedule.current_shuffled_witnesses
      const id = round.indexOf(current_witness)
      if (id === -1) return

      const newSchedule = []
      for (let i = id + 1; i < round.length; i++) newSchedule.push(round[i])
      for (let j = 0; j < id; j++) newSchedule.push(round[j])
      newSchedule.push(round[id])
      this.schedule = newSchedule
    },

    getExtendedChainProperties() {
      const current_inflation_rate = Utils.getInflationRate(this.chain.head_block_number)
      this.chain.current_inflation_rate = current_inflation_rate / 100 + '%'
      this.chain.new_steem_per_day = (Config.STEEM_BLOCKS_PER_DAY * parseFloat(this.chain.virtual_supply) * (current_inflation_rate / 10000) / Config.STEEM_BLOCKS_PER_YEAR).toFixed(3) + ' ' + Config.STEEM
      this.chain.sp_percent = parseFloat(this.chain.total_vesting_fund_steem) * 100 / parseFloat(this.chain.virtual_supply)
      this.chain.sbd_percent = parseFloat(this.chain.current_sbd_supply) / this.chain.feed_price * 100 / parseFloat(this.chain.virtual_supply)
      this.chain.sbd_per_rshare = this.chain.steem_per_rshare * this.chain.feed_price
      this.chain.reward_percent = parseFloat(this.chain.reward_balance) * 100 / parseFloat(this.chain.virtual_supply)
      this.chain.reward_balance_day = (parseFloat(this.chain.reward_balance) / 15).toFixed(3) + ' ' + Config.STEEM
      this.chain.vote_value_1000_sp = (1 / 50) * 1000 * this.chain.steem_per_rshare * 1e12 / this.chain.steem_per_mvests * this.chain.feed_price
    },

    fetchBlocks() {
      if (this.last_block_num === 0) return
      if (this.wait_more_time) { this.wait_more_time = false; return }

      const SIZE_BLOCKS = 10
      let last_block_recorded = this.lastBlocks.length > 0
        ? this.lastBlocks[0]
        : { block_num: this.last_block_num - SIZE_BLOCKS, timestamp_milis: Date.now(), loaded: false }

      const n = this.last_block_num - last_block_recorded.block_num
      const newBlocks = []
      for (let i = 1; i <= n; i++) newBlocks.push(this.last_block_num - n + i)
      this.last_block_num++

      newBlocks.forEach(num => {
        const b = {
          block_num: num,
          timestamp_milis: last_block_recorded.timestamp_milis + (num - last_block_recorded.block_num) * 3000,
          time_ago: '',
          size_txs: 0,
          size_posts: 0,
          witness: '',
          loaded: false,
        }
        this.lastBlocks.unshift(b)
        if (this.lastBlocks.length > SIZE_BLOCKS) this.lastBlocks.pop()
        this.getBlock(b)
      })
    },

    getBlock(b) {
      this.steem_database_call('get_block', [b.block_num]).then(resultBlock => {
        if (!resultBlock) {
          this.wait_more_time = true
          setTimeout(() => this.getBlock(b), 3000)
          return
        }
        b.size_txs = resultBlock.transactions.length
        b.size_posts = resultBlock.transactions.filter(tx => tx.operations[0][0] === 'comment' && tx.operations[0][1].parent_author === '').length
        b.timestamp_milis = new Date(resultBlock.timestamp + 'Z').getTime()
        b.witness = resultBlock.witness
        b.loaded = true
        const pos = this.lastBlocks.findIndex(blk => blk.block_num === b.block_num)
        if (pos >= 0) {
          this.lastBlocks[pos] = b
          if (pos === 0 && b.witness === this.schedule[0]) this.schedule.shift()
        }
      }).catch(console.error)
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* ── Page shell ── */
.home-page {
  background: #eef5fb;
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}

/* ── 3-column grid ── */
.home-layout {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
  display: grid;
  grid-template-columns: 260px 1fr 160px;
  gap: 1.5rem 2rem;
  align-items: start;
}

/* ── Shared card ── */
.s-card {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
  border: 1px solid #c8dff0;
  padding: 1.25rem 1.4rem;
  transition: box-shadow .25s, transform .25s;
}
.s-card:hover {
  box-shadow: 0 2px 8px rgba(14,14,82,.06), 0 8px 32px rgba(14,14,82,.08);
  transform: translateY(-2px);
}
.s-card + .s-card { margin-top: .85rem; }

/* ── Sidebar ── */
.home-sidebar {
  position: sticky;
  top: 1.5rem;
}

/* ── Card internals ── */
.card-eyebrow {
  font-size: .63rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #5878a0;
  margin-bottom: .55rem;
}

.stat-figure {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0e0e52;
  line-height: 1.2;
  word-break: break-all;
}
.stat-figure.muted { color: #5878a0; }
.stat-currency {
  font-size: .68rem;
  font-weight: 700;
  color: #5878a0;
  letter-spacing: .06em;
  margin-left: .2rem;
  font-family: 'Outfit', sans-serif;
}

.stat-sub {
  font-size: .72rem;
  color: #5878a0;
  font-family: 'JetBrains Mono', monospace;
  margin-top: .2rem;
  word-break: break-all;
}

.stat-divider {
  height: 1px;
  background: #c8dff0;
  margin: .75rem 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: .5rem;
  padding: .28rem 0;
  font-size: .76rem;
  border-bottom: 1px solid #eef5fb;
}
.stat-row:last-child { border-bottom: none; }
.stat-label { color: #5878a0; flex-shrink: 0; }
.stat-value {
  color: #0e0e52;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}
.stat-value.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: .7rem;
}
.stat-value.small { font-size: .65rem; }

/* ── Skeleton cards ── */
.skeleton-card {
  animation: shimmer 1.6s ease-in-out infinite;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  border: none;
}
.skeleton-card.tall   { height: 160px; }
.skeleton-card.medium { height: 110px; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Section heading ── */
.section-hdg {
  display: flex;
  align-items: center;
  gap: .6rem;
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #0e0e52;
  margin: 0 0 1rem;
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

/* ── Homepage Search ── */
.hs-form {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #a8c8e8;
  border-radius: 10px;
  padding: .45rem .6rem .45rem .9rem;
  gap: .5rem;
  margin-bottom: 1.25rem;
  transition: border-color .2s, box-shadow .2s;
}
.hs-form:focus-within {
  border-color: #449dd1;
  box-shadow: 0 0 0 3px rgba(68,157,209,.12);
}
.hs-icon {
  width: 15px;
  height: 15px;
  color: #5878a0;
  flex-shrink: 0;
}
.hs-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: .875rem;
  color: #0e0e52;
  min-width: 0;
  padding: .35rem 0;
}
.hs-input::placeholder { color: #8aa4c0; }
.hs-btn {
  background: #0e0e52;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: .8rem;
  font-weight: 600;
  padding: .42rem 1rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s;
  flex-shrink: 0;
}
.hs-btn:hover { background: #192bc2; }

/* ── Block list ── */
.home-main { min-width: 0; }

.block-list { display: flex; flex-direction: column; gap: .5rem; overflow: hidden; }

.block-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #c8dff0;
  border-radius: 12px;
  padding: .75rem 1.1rem;
  transition: box-shadow .2s, transform .2s, border-color .2s;
}
.block-row:hover {
  border-color: #449dd1;
  box-shadow: 0 2px 12px rgba(68,157,209,.14);
}

.block-num-wrap { flex-shrink: 0; }
.block-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: .9rem;
  font-weight: 700;
  color: #192bc2;
  text-decoration: none;
  transition: color .15s;
}
.block-num:hover { color: #449dd1; }

.block-txs {
  font-size: .8rem;
  color: #5878a0;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tx-count {
  font-weight: 700;
  color: #0e0e52;
  font-family: 'JetBrains Mono', monospace;
  margin-right: .25rem;
}
.tx-label { color: #5878a0; }
.tx-posts { color: #449dd1; margin-left: .4rem; }
.loading-dot {
  font-family: 'JetBrains Mono', monospace;
  color: #b8d4ef;
  letter-spacing: .1em;
}

.block-witness-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
.witness-label {
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #b8d4ef;
  font-family: 'Outfit', sans-serif;
}
.witness-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: .78rem;
  font-weight: 600;
  color: #192bc2;
  text-decoration: none;
  transition: color .15s;
}
.witness-name:hover { color: #449dd1; }

/* ── Skeleton blocks ── */
.skeleton-blocks { display: flex; flex-direction: column; gap: .5rem; }
.skeleton-row {
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

/* ── Schedule ── */
.home-schedule { min-width: 0; }

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: .35rem;
  max-height: 750px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c8dff0 transparent;
  padding-right: 2px;
}
.schedule-list::-webkit-scrollbar { width: 4px; }
.schedule-list::-webkit-scrollbar-track { background: transparent; }
.schedule-list::-webkit-scrollbar-thumb { background: #c8dff0; border-radius: 4px; }

.schedule-item {
  display: flex;
  align-items: center;
  gap: .45rem;
  background: #ffffff;
  border: 1px solid #c8dff0;
  border-radius: 8px;
  padding: .35rem .6rem;
  transition: border-color .2s, box-shadow .2s;
}
.schedule-item.active {
  border-color: #449dd1;
  background: #f0f8ff;
  box-shadow: 0 2px 8px rgba(68,157,209,.14);
}
.schedule-item:hover {
  border-color: #449dd1;
}

.schedule-badge {
  font-size: .55rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #ffffff;
  background: #449dd1;
  padding: .1em .4em;
  border-radius: 3px;
  flex-shrink: 0;
  font-family: 'Outfit', sans-serif;
}

.schedule-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem;
  font-weight: 500;
  color: #0e0e52;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color .15s;
}
.schedule-name:hover { color: #449dd1; }

/* ── Skeleton schedule ── */
.skeleton-schedule { display: flex; flex-direction: column; gap: .35rem; }
.skeleton-schedule-item {
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
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

/* ── Block transition ── */
.block-slide-enter-active { transition: opacity .4s ease, transform .4s cubic-bezier(.34,1.26,.64,1); }
.block-slide-enter-from   { opacity: 0; transform: translateY(-12px); }
.block-slide-leave-active { transition: opacity .2s ease; }
.block-slide-leave-to     { opacity: 0; }

/* ── Schedule transition ── */
.schedule-slide-enter-active { transition: opacity .3s ease; }
.schedule-slide-enter-from   { opacity: 0; }
.schedule-slide-leave-active { transition: opacity .2s ease; position: absolute; }
.schedule-slide-leave-to     { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .home-layout {
    grid-template-columns: 200px 1fr 140px;
    gap: 1rem 1.25rem;
    padding: 1.5rem 1rem 4rem;
  }
}

@media (max-width: 768px) {
  .home-layout {
    grid-template-columns: 1fr;
    padding: 1rem 1rem 3rem;
    gap: 1rem;
  }
  .home-sidebar {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .75rem;
  }
  .home-sidebar .s-card + .s-card { margin-top: 0; }
  .home-schedule { order: 3; }
  .schedule-list { max-height: 300px; }
}

@media (max-width: 500px) {
  .home-layout { padding: .75rem .75rem 2.5rem; }
  .home-sidebar { grid-template-columns: 1fr; }
  .stat-figure { font-size: .95rem; }
  .block-row { padding: .6rem .75rem; gap: .6rem; }
  .block-num { font-size: .82rem; }
  .block-txs { font-size: .75rem; }
  .witness-name { font-size: .72rem; }
}
</style>
