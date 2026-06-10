<template>
  <div class="transaction">
    <AppHeader ref="appHeader" />
    <div class="container">
      <div v-if="exists">
        <div class="row">
          <h1 class="col-12">Transaction</h1>
          <h2 class="col-12">{{ $route.params.tx }}</h2>
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
  name: 'Tx',
  components: { AppHeader, CardData, Trx },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      tx: {},
      exists: false,
      EXPLORER: Config.EXPLORER,
    }
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
