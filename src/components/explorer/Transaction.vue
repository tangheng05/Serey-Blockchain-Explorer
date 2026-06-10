<template>
  <div class="transaction">
    <AppHeader ref="appHeader" />
    <div class="container">
      <div v-if="exists">
        <div class="row">
          <h1 class="col-12">Transaction</h1>
          <h2 class="col-12">{{ $route.params.tx }}</h2>
          <h3 class="col-12">(Block <router-link :to="EXPLORER + 'b/' + $route.params.id">{{ $route.params.id }}</router-link>)</h3>
          <trx :tx="tx" class="col-12" />
          <h2 class="col-12">Raw</h2>
          <card-data :data="tx" />
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
import CardData from '@/components/explorer/CardData'
import Trx from '@/components/explorer/Trx'
import AppHeader from '@/components/layout/AppHeader'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'

export default {
  name: 'Transaction',
  components: { AppHeader, CardData, Trx },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      block: {},
      tx: {},
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
      const blocknum = this.$route.params.id
      const result = await this.steem_database_call('get_block', [blocknum])
      for (let i = 0; i < result.transactions.length; i++) {
        if (!result.transactions[i].transaction_id) result.transactions[i].transaction_id = result.transaction_ids[i]
      }
      this.block = result
      const index = this.block.transaction_ids.indexOf(this.$route.params.tx)
      if (index >= 0) {
        this.tx = this.block.transactions[index]
        this.tx.block_num = blocknum
      } else {
        this.tx = { operations: [], transaction_id: this.$route.params.tx, block_num: blocknum }
      }
      this.exists = true
    },
  },
}
</script>
