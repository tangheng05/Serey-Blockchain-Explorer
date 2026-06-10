<template>
  <div class="trx">
    <div class="tx-badge">
      <router-link v-if="!isVirtual" :to="EXPLORER + 'b/' + blockNum + '/' + trx_id" class="tx-id">{{ trx_id.substring(0, 7) }}</router-link>
      <span v-else class="tx-id virtual">virtual</span>
    </div>
    <div class="tx-body">
      <div v-if="typeOp === 'curation_reward'">
        <router-link :to="EXPLORER + '@' + op.curator" class="tx-link">{{ op.curator }}</router-link> curation reward: {{ vests2sp(op.reward) }} for <router-link :to="EXPLORER + link(op.comment_author, op.comment_permlink)" class="tx-link">{{ linkCut(op.comment_author, op.comment_permlink) }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'vote'">
        <router-link :to="EXPLORER + '@' + op.voter" class="tx-link">{{ op.voter }}</router-link> upvoted <router-link :to="EXPLORER + link(op.author, op.permlink)" class="tx-link">{{ linkCut(op.author, op.permlink) }}</router-link> ({{ (op.weight / 100).toFixed(2) }}%) <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'transfer'">
        <router-link :to="EXPLORER + '@' + op.from" class="tx-link">{{ op.from }}</router-link> transferred {{ op.amount }} to <router-link :to="EXPLORER + '@' + op.to" class="tx-link">{{ op.to }}</router-link><template v-if="op.memo"> · <span class="tx-memo">{{ op.memo }}</span></template> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'delegate_vesting_shares'">
        <router-link :to="EXPLORER + '@' + op.delegator" class="tx-link">{{ op.delegator }}</router-link> delegated {{ vests2sp(op.vesting_shares) }} to <router-link :to="EXPLORER + '@' + op.delegatee" class="tx-link">{{ op.delegatee }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'comment' && op.parent_author !== ''">
        <router-link :to="EXPLORER + '@' + op.author" class="tx-link">{{ op.author }}</router-link> replied to <router-link :to="EXPLORER + link(op.parent_author, op.parent_permlink)" class="tx-link">{{ linkCut(op.parent_author, op.parent_permlink) }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'comment' && op.parent_author === ''">
        <router-link :to="EXPLORER + '@' + op.author" class="tx-link">{{ op.author }}</router-link> authored a post: <router-link :to="EXPLORER + link(op.author, op.permlink)" class="tx-link">{{ linkCut(op.author, op.permlink) }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'transfer_to_vesting'">
        <router-link :to="EXPLORER + '@' + op.from" class="tx-link">{{ op.from }}</router-link> powered up {{ op.amount }} to <router-link :to="EXPLORER + '@' + op.to" class="tx-link">{{ op.to }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'withdraw_vesting'">
        <router-link :to="EXPLORER + '@' + op.account" class="tx-link">{{ op.account }}</router-link> started power down {{ vests2sp(op.vesting_shares) }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'fill_vesting_withdraw'">
        <router-link :to="EXPLORER + '@' + op.from_account" class="tx-link">{{ op.from_account }}</router-link> withdrew {{ op.withdrawn }} as {{ op.deposited }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'return_vesting_delegation'">
        <router-link :to="EXPLORER + '@' + op.account" class="tx-link">{{ op.account }}</router-link> return of {{ vests2sp(op.vesting_shares) }} delegation <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'account_create'">
        <router-link :to="EXPLORER + '@' + op.creator" class="tx-link">{{ op.creator }}</router-link> created account <router-link :to="EXPLORER + '@' + op.new_account_name" class="tx-link">{{ op.new_account_name }}</router-link> · fee: {{ op.fee }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'producer_reward'">
        <router-link :to="EXPLORER + '@' + op.producer" class="tx-link">{{ op.producer }}</router-link> producer reward: {{ vests2sp(op.vesting_shares) }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'feed_publish'">
        <router-link :to="EXPLORER + '@' + op.publisher" class="tx-link">{{ op.publisher }}</router-link> feed price ${{ feedPrice }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'witness_update'">
        <router-link :to="EXPLORER + '@' + op.owner" class="tx-link">{{ op.owner }}</router-link> updated witness · creation fee: {{ op.props ? op.props.account_creation_fee : '' }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'account_witness_vote'">
        <router-link :to="EXPLORER + '@' + op.account" class="tx-link">{{ op.account }}</router-link><span v-if="op.approve"> approved</span><span v-else> unapproved</span> witness <router-link :to="EXPLORER + '@' + op.witness" class="tx-link">{{ op.witness }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'claim_reward_balance'">
        <router-link :to="EXPLORER + '@' + op.account" class="tx-link">{{ op.account }}</router-link> claimed reward: {{ vests2sp(op.reward_vests) }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'custom_json' && op.id === 'follow' && Array.isArray(op.json) && op.json[0] === 'reblog'">
        <router-link :to="EXPLORER + '@' + op.json[1].account" class="tx-link">{{ op.json[1].account }}</router-link> reblogged <router-link :to="EXPLORER + link(op.json[1].author, op.json[1].permlink)" class="tx-link">{{ linkCut(op.json[1].author, op.json[1].permlink) }}</router-link> <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'custom_json' && op.id === 'follow' && Array.isArray(op.json) && op.json[0] === 'follow'">
        <router-link :to="EXPLORER + '@' + op.json[1].follower" class="tx-link">{{ op.json[1].follower }}</router-link>
        <span v-if="op.json[1].what && op.json[1].what.length > 0 && op.json[1].what[0] === 'blog'"> followed</span>
        <span v-else> unfollowed</span> {{ op.json[1].following }} <span class="tx-time">{{ op.time }}</span>
      </div>
      <div v-else-if="typeOp === 'custom_json'">
        <card-data :data="op.json" :title="'custom: ' + op.id" />
      </div>
      <div v-else>
        <card-data :data="op" :title="typeOp" />
      </div>
    </div>
  </div>
</template>

<script>
import CardData from '@/components/explorer/CardData'
import Config from '@/config.js'
import Utils from '@/utils/utils.js'
import { useChainProperties } from '@/composables/useChainProperties.js'

export default {
  name: 'Trx',
  components: { CardData },

  props: {
    tx: { type: [Array, Object], required: true },
  },

  setup() {
    const { chain, vests2sp, getChainProperties } = useChainProperties()
    return { chain, vests2sp, getChainProperties }
  },

  data() {
    return {
      typeOp: '',
      op: {},
      trx_id: '',
      blockNum: 0,
      EXPLORER: Config.EXPLORER,
    }
  },

  computed: {
    isVirtual() {
      return !this.trx_id || /^0+$/.test(this.trx_id)
    },
    feedPrice() {
      if (!this.op.exchange_rate) return ''
      const rate = this.op.exchange_rate
      return (parseFloat(rate.base) / parseFloat(rate.quote)).toFixed(3)
    },
  },

  watch: {
    tx(newTx) { this.processTx(newTx) },
  },

  async created() {
    await this.getChainProperties()
    this.processTx(this.tx)
  },

  methods: {
    link(author, permlink) { return '@' + author + '/' + permlink },
    linkCut(author, permlink) {
      const l = '@' + author + '/' + permlink
      return l.substring(0, 30) + (l.length > 30 ? '...' : '')
    },
    processTx(newTx) {
      let ope
      if (Array.isArray(newTx)) {
        this.typeOp = newTx[1].op[0]
        this.trx_id = newTx[1].trx_id
        this.blockNum = newTx[1].block
        ope = newTx[1].op[1]
        ope.time = Utils.getTimestamp(newTx[1].timestamp)
      } else {
        if (newTx.operations && newTx.operations.length > 0) {
          this.typeOp = newTx.operations[0][0]
          this.trx_id = newTx.transaction_id
          this.blockNum = newTx.block_num
          ope = newTx.operations[0][1]
          ope.time = Utils.getTimestamp(newTx.expiration)
        } else {
          this.typeOp = 'No operations'
          this.trx_id = newTx.transaction_id
          this.blockNum = newTx.block_num
          ope = {}
        }
      }
      if (this.typeOp === 'custom_json' && ope.json) {
        try { ope.json = JSON.parse(ope.json) } catch (e) { /* */ }
      }
      this.op = ope
    },
  },
}
</script>

<style scoped>
.trx {
  display: flex;
  align-items: center;
  gap: .85rem;
  background: #ffffff;
  border: 1px solid #c8dff0;
  border-radius: 10px;
  padding: .65rem 1rem;
  margin-bottom: .45rem;
  transition: border-color .18s, box-shadow .18s;
  font-family: 'Outfit', sans-serif;
}
.trx:hover {
  border-color: #449dd1;
  box-shadow: 0 2px 10px rgba(68,157,209,.12);
}

.tx-badge { flex-shrink: 0; }

.tx-id {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: .68rem;
  font-weight: 600;
  color: #5878a0;
  background: #eef5fb;
  border: 1px solid #c8dff0;
  border-radius: 6px;
  padding: .2em .55em;
  text-decoration: none;
  transition: color .15s, border-color .15s;
  white-space: nowrap;
}
.tx-id:hover { color: #192bc2; border-color: #449dd1; }

.tx-id.virtual {
  color: #5878a0;
  background: #f4f9fd;
  border-color: #c8dff0;
  cursor: default;
  font-style: italic;
}

.tx-body {
  flex: 1;
  font-size: .82rem;
  color: #0e0e52;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.tx-link {
  color: #192bc2;
  text-decoration: none;
  font-weight: 600;
  transition: color .15s;
}
.tx-link:hover { color: #449dd1; }

.tx-time {
  float: right;
  margin-left: 1rem;
  color: #5878a0;
  font-size: .72rem;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  flex-shrink: 0;
}

.tx-memo {
  color: #dc2626;
  font-family: 'JetBrains Mono', monospace;
  font-size: .78rem;
}
</style>
