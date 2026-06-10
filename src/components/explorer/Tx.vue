<template>
  <div class="tx-page">
    <AppHeader ref="appHeader" />
    <div class="tx-layout">

      <template v-if="!exists">
        <div class="sk-header"></div>
        <div class="sk-card"></div>
      </template>

      <template v-else>
        <div class="page-header"
          v-motion :initial="{ opacity:0, y:-10 }" :enter="{ opacity:1, y:0, transition:{ type:'spring', stiffness:300, damping:26, delay:40 } }"
        >
          <div class="page-eyebrow">Transaction lookup</div>
          <h1 class="page-title">Transaction</h1>
          <div class="tx-hash">{{ $route.params.tx }}</div>
        </div>

        <div class="content-card"
          v-motion :initial="{ opacity:0, y:16 }" :enter="{ opacity:1, y:0, transition:{ type:'spring', stiffness:260, damping:24, delay:80 } }"
        >
          <trx :tx="tx" />
        </div>

        <div class="raw-section"
          v-motion :initial="{ opacity:0, y:16 }" :enter="{ opacity:1, y:0, transition:{ type:'spring', stiffness:260, damping:24, delay:140 } }"
        >
          <button class="raw-btn" @click="showRaw = !showRaw">
            <span class="raw-chevron" :class="{ open: showRaw }">›</span>
            {{ showRaw ? 'Hide' : 'Show' }} Raw Data
          </button>
          <Transition name="raw-expand">
            <div v-if="showRaw" class="raw-body s-card">
              <card-data :data="tx" />
            </div>
          </Transition>
        </div>

        <div v-if="alertsStore.info"    class="page-alert info">{{ alertsStore.infoText }}</div>
        <div v-if="alertsStore.success" class="page-alert success" v-html="alertsStore.successText"></div>
        <div v-if="alertsStore.danger"  class="page-alert danger">{{ alertsStore.dangerText }}</div>
      </template>

    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import CardData from '@/components/explorer/CardData'
import Trx from '@/components/explorer/Trx'
import AppHeader from '@/components/layout/AppHeader'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'

export default {
  name: 'Tx',
  components: { AppHeader, CardData, Trx },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return { tx: {}, exists: false, showRaw: false, EXPLORER: Config.EXPLORER }
  },

  watch: { $route: 'fetchData' },

  async created() {
    await this.getChainProperties()
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const result = await this.steem_database_call('get_transaction', [this.$route.params.tx])
      this.tx = {
        operations: result.operations,
        transaction_id: this.$route.params.tx,
        blockNum: result.block_num,
        expiration: result.expiration,
      }
      this.exists = true
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.tx-page { background: #eef5fb; min-height: 100vh; font-family: 'Outfit', sans-serif; }
.tx-layout { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }

.page-header { margin-bottom: 1.5rem; }
.page-eyebrow { font-size: .63rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #5878a0; margin-bottom: .3rem; }
.page-title { font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 800; color: #0e0e52; margin: 0 0 .4rem; letter-spacing: -.03em; }
.tx-hash { font-family: 'JetBrains Mono', monospace; font-size: .75rem; color: #5878a0; word-break: break-all; }

.s-card { background: #ffffff; border-radius: 12px; border: 1px solid #c8dff0; box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06); overflow: hidden; }
.content-card { margin-bottom: 1rem; }

.raw-btn {
  display: inline-flex; align-items: center; gap: .45rem;
  background: none; border: 1px solid #c8dff0; border-radius: 8px;
  padding: .5rem 1.1rem; font-size: .8rem; font-family: 'Outfit', sans-serif;
  font-weight: 500; color: #5878a0; cursor: pointer; transition: border-color .2s, color .2s;
}
.raw-btn:hover { border-color: #449dd1; color: #449dd1; }
.raw-chevron { display: inline-block; font-size: 1rem; transition: transform .25s cubic-bezier(.34,1.56,.64,1); line-height: 1; }
.raw-chevron.open { transform: rotate(90deg); }
.raw-body { margin-top: .75rem; }

.raw-expand-enter-active { transition: opacity .3s ease, transform .3s cubic-bezier(.34,1.26,.64,1); }
.raw-expand-enter-from   { opacity: 0; transform: translateY(-8px); }
.raw-expand-leave-active { transition: opacity .2s ease; }
.raw-expand-leave-to     { opacity: 0; }

.page-alert { border-radius: 10px; padding: .7rem 1rem; margin-top: 1rem; font-size: .85rem; font-family: 'Outfit', sans-serif; }
.page-alert.info    { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }
.page-alert.success { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
.page-alert.danger  { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.sk-header { height: 72px; border-radius: 10px; margin-bottom: 1.5rem; background: linear-gradient(90deg,#c8dff0 25%,#eef5fb 50%,#c8dff0 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
.sk-card   { height: 120px; border-radius: 12px; background: linear-gradient(90deg,#c8dff0 25%,#eef5fb 50%,#c8dff0 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 600px) {
  .tx-layout { padding: 1rem 1rem 3rem; }
  .page-title { font-size: 1.4rem; }
  .tx-hash { font-size: .65rem; }
}
</style>
