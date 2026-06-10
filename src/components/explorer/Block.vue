<template>
  <div class="block-page">
    <AppHeader ref="appHeader" />

    <div class="block-layout">

      <div v-if="!exists" class="block-body">
        <div class="sk-sidebar">
          <div class="sk-card tall"></div>
        </div>
        <div class="sk-main">
          <div v-for="i in 6" :key="i" class="sk-row"></div>
        </div>
      </div>

      <template v-else>
        <div class="page-header"
          v-motion :initial="{ opacity:0, y:-10 }" :enter="{ opacity:1, y:0, transition:{ type:'spring', stiffness:300, damping:26, delay:40 } }"
        >
          <div class="page-eyebrow">Serey Blockchain</div>
          <h1 class="page-title">Block <span class="mono">#{{ $route.params.id }}</span></h1>
        </div>

        <div class="block-body">
          <!-- Sidebar: block info -->
          <aside class="block-sidebar"
            v-motion :initial="{ opacity:0, x:-24 }" :enter="{ opacity:1, x:0, transition:{ type:'spring', stiffness:280, damping:22, delay:80 } }"
          >
            <div class="section-eyebrow">Block Info</div>
            <div class="s-card"><card-data :data="blockGenerals" /></div>
          </aside>

          <!-- Main: transactions -->
          <main class="block-main"
            v-motion :initial="{ opacity:0, y:16 }" :enter="{ opacity:1, y:0, transition:{ type:'spring', stiffness:260, damping:24, delay:100 } }"
          >
            <div v-if="alertsStore.info"    class="page-alert info">{{ alertsStore.infoText }}</div>
            <div v-if="alertsStore.success" class="page-alert success" v-html="alertsStore.successText"></div>
            <div v-if="alertsStore.danger"  class="page-alert danger">{{ alertsStore.dangerText }}</div>

            <h3 class="section-hdg"><span class="accent-dot"></span> {{ block.transactions.length }} Transactions</h3>
            <div v-if="block.transactions.length > 0">
              <div v-for="(tx, index) in block.transactions" :key="index">
                <trx :tx="tx" />
              </div>
            </div>
            <div v-else class="empty-note">No transactions in this block.</div>
          </main>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
import CardData from '@/components/explorer/CardData'
import Trx from '@/components/explorer/Trx'
import AppHeader from '@/components/layout/AppHeader'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'

export default {
  name: 'Block',
  components: { AppHeader, CardData, Trx },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return { block: {}, blockGenerals: {}, exists: false }
  },

  watch: { '$route': 'fetchData' },

  async created() {
    await this.getChainProperties()
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const blocknum = this.$route.params.id
      const result = await this.steem_database_call('get_block', [blocknum])
      for (let i = 0; i < result.transactions.length; i++) {
        if (!result.transactions[i].transaction_id) result.transactions[i].transaction_id = result.transaction_ids[i]
        if (!result.transactions[i].block_num) result.transactions[i].block_num = blocknum
      }
      this.block = result
      const no_keys = ['extensions', 'transaction_ids', 'transactions']
      const blk = {}
      for (const key in this.block) {
        if (!no_keys.includes(key)) blk[key] = this.block[key]
      }
      this.blockGenerals = blk
      this.exists = true
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.block-page { background: #eef5fb; min-height: 100vh; font-family: 'Outfit', sans-serif; }

.block-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
}

.page-header { margin-bottom: 1.5rem; }
.page-eyebrow { font-size: .63rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #5878a0; margin-bottom: .3rem; }
.page-title { font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 800; color: #0e0e52; margin: 0; letter-spacing: -.03em; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; }

.block-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
}

.block-sidebar { display: flex; flex-direction: column; gap: .5rem; position: sticky; top: 1.5rem; }

.section-eyebrow { font-size: .62rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #5878a0; margin-bottom: .4rem; }

.s-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #c8dff0;
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
  overflow: hidden;
}

.block-main { min-width: 0; }

.section-hdg {
  display: flex; align-items: center; gap: .6rem;
  font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 700;
  color: #0e0e52; margin: 0 0 .85rem; letter-spacing: -.01em;
}
.accent-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #449dd1; flex-shrink: 0; }

.empty-note { color: #5878a0; font-size: .85rem; padding: 1rem 0; }

.page-alert { border-radius: 10px; padding: .7rem 1rem; margin-bottom: 1rem; font-size: .85rem; font-family: 'Outfit', sans-serif; }
.page-alert.info    { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }
.page-alert.success { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
.page-alert.danger  { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Skeletons */
.block-body.sk-sidebar { display: flex; flex-direction: column; gap: .75rem; }
.sk-card { border-radius: 12px; background: linear-gradient(90deg,#c8dff0 25%,#eef5fb 50%,#c8dff0 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
.sk-card.tall { height: 220px; }
.sk-main { display: flex; flex-direction: column; gap: .5rem; }
.sk-row { height: 48px; border-radius: 10px; background: linear-gradient(90deg,#c8dff0 25%,#eef5fb 50%,#c8dff0 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 768px) {
  .block-layout { padding: 1rem 1rem 3rem; }
  .block-body { grid-template-columns: 1fr; gap: 1rem; }
  .block-sidebar { position: static; }
  .page-title { font-size: 1.4rem; }
}
</style>
