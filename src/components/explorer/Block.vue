<template>
  <div class="block">
    <AppHeader ref="appHeader" />
    <div class="container">
      <div v-if="exists">
        <div class="row">
          <div class="col-md-12">
            <h1>Block {{ $route.params.id }}</h1>
          </div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <h2>Block info</h2>
            <card-data :data="blockGenerals" />
          </div>
          <div class="col-md-9">
            <h2>{{ block.transactions.length }} Transactions</h2>
            <div v-for="(tx, index) in block.transactions" :key="index">
              <trx :tx="tx" />
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
    return {
      block: {},
      blockGenerals: {},
      exists: false,
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
