<template>
  <div class="home">
    <AppHeader ref="appHeader" />
    <div class="container">
      <h1>Serey Explorer</h1>
      <div class="row">
        <div class="col-md-3">
          <div v-if="exists.globals">
            <div class="card">
              <div class="title">Current supply</div><br>
              {{ chain.current_supply }}<br>
              {{ chain.current_sbd_supply }}<br>
              <hr>virtual {{ chain.virtual_supply }}
            </div>
            <div v-if="sereyPrice" class="card">
              <div class="title">Serey Price</div>
              <br>{{ sereyPrice }} &nbsp;$
            </div>
            <div class="card">
              <div class="title">Inflation</div><br>
              Annual rate: {{ chain.current_inflation_rate }}<br>
              ({{ chain.new_steem_per_day }} per day)
            </div>
            <div class="card">
              <div class="title">Stake</div><br>
              Fund: {{ chain.total_vesting_fund_steem }}<br>
              ({{ chain.sp_percent ? chain.sp_percent.toFixed(2) : '0' }}% of virtual sup.)<br>
              Shares: {{ chain.total_vesting_shares }}<br>
              <hr>
              {{ chain.steem_per_mvests ? chain.steem_per_mvests.toFixed(3) : '0' }} {{ STEEM_SYMBOL }} per m{{ VESTS_SYMBOL }}
            </div>
          </div>
          <div v-else>
            <div class="loader"></div>
          </div>
          <div v-if="exists.globals && exists.reward">
            <div class="card">
              <div class="title">Reward fund</div><br>
              {{ chain.reward_balance }} {{ STEEM_SYMBOL }}<br>
              ({{ chain.reward_percent ? chain.reward_percent.toFixed(2) : '0' }}% of virtual sup.)<br>
              for next 15 days<br>
              <hr>
              {{ chain.reward_balance_day }} per day<br>
              vote of {{ chain.vote_value_1000_sp ? chain.vote_value_1000_sp.toFixed(3) : '0' }} per 1000 {{ SP_SYMBOL }}<br>
              <hr>
              recent claims {{ chain.recent_claims }}
            </div>
          </div>
          <div v-else>
            <div class="loader"></div>
          </div>
        </div>
        <div class="col-md-9">
          <div class="last-blocks">
            <div v-if="lastBlocks.length > 0">
              <h2>Last Blocks</h2>
              <transition-group name="list-blocks" tag="div" class="block-group">
                <div v-for="b in lastBlocks" :key="b.block_num" class="list-blocks-item">
                  <div class="block-left">
                    <router-link :to="EXPLORER + 'b/' + b.block_num">{{ b.block_num }}</router-link>
                    <span v-if="b.loaded">
                      - {{ b.size_txs }} transactions
                      <span v-if="b.size_posts > 0">({{ b.size_posts }} posts)</span>
                    </span>
                    <span v-else>loading...</span>
                  </div>
                  <div class="block-right">
                    <span class="small">witness</span><br>
                    <router-link :to="EXPLORER + '@' + b.witness">{{ b.witness }}</router-link>
                  </div>
                </div>
              </transition-group>
            </div>
            <div v-else>
              <div class="loader"></div>
            </div>
          </div>
          <div v-if="exists.schedule" class="schedule">
            <h2>Schedule</h2>
            <transition-group name="list-schedule" tag="div">
              <div v-for="wit in schedule" :key="wit" class="list-schedule-item">
                {{ wit }}
              </div>
            </transition-group>
          </div>
          <div v-else>
            <div class="loader"></div>
          </div>
        </div>
      </div>
      <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{ alertsStore.infoText }}</div>
      <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
      <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{ alertsStore.dangerText }}</div>
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
.last-blocks {
  width: calc(100% - 8rem - 60px);
  display: inline-block;
  vertical-align: top;
}
.schedule {
  width: 8rem;
  display: inline-block;
  vertical-align: top;
  margin-left: 10px;
}
.block-left {
  display: inline-block;
  margin: auto 0px;
  width: 70%;
}
.block-right {
  display: inline-block;
  width: 30%;
  margin: auto 0px;
  text-align: right;
}
.small { font-size: 0.8rem; }
.card {
  display: block;
  text-align: right;
  font-family: monospace;
  font-size: 1.2rem;
  background-color: white;
  border: solid 1px #dcdcdc;
  padding: 8px 10px;
  border-radius: 5px;
  margin: 10px auto;
}
.title { font-weight: bold; font-size: 1.3rem; }
.block-group { height: 51rem; }
.list-blocks-item {
  transition: all 3s;
  border: solid 1px #dcdcdc;
  border-radius: 5px;
  margin: 10px auto;
  padding: 8px 10px;
  display: block;
  background-color: white;
  height: 4rem;
}
.list-blocks-enter-active, .list-blocks-leave-active { opacity: 0; }
.list-schedule-item {
  transition: all 1s;
  border: solid 1px #dcdcdc;
  border-radius: 5px;
  margin: 3px auto;
  padding: 3px 5px;
  display: block;
  background-color: white;
}
.list-schedule-enter-active { opacity: 0; }
.list-schedule-leave-active { opacity: 0; transform: translateX(-8rem); position: absolute; }
.green { color: green; }
.orange { color: orange; }
.red { color: red; }
</style>
