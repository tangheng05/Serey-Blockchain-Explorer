<template>
  <div class="trx">
    <div class="tx-link">
      <router-link :to="EXPLORER + 'b/' + blockNum + '/' + trx_id">{{ trx_id.substring(0, 7) }}</router-link>
    </div>
    <span class="operation break-word">
      <div v-if="typeOp === 'curation_reward'">
        <router-link :to="EXPLORER + '@' + op.curator">{{ op.curator }}</router-link> curation reward: {{ vests2sp(op.reward) }} for <router-link :to="EXPLORER + link(op.comment_author, op.comment_permlink)">{{ linkCut(op.comment_author, op.comment_permlink) }}</router-link> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'vote'">
        <router-link :to="EXPLORER + '@' + op.voter">{{ op.voter }}</router-link> upvote <router-link :to="EXPLORER + link(op.author, op.permlink)">{{ linkCut(op.author, op.permlink) }}</router-link> ({{ (op.weight / 100).toFixed(2) }}%) - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'transfer'">
        <router-link :to="EXPLORER + '@' + op.from">{{ op.from }}</router-link> transfer {{ op.amount }} to <router-link :to="EXPLORER + '@' + op.to">{{ op.to }}</router-link>. Memo: <span class="memo">{{ op.memo }}</span> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'delegate_vesting_shares'">
        <router-link :to="EXPLORER + '@' + op.delegator">{{ op.delegator }}</router-link> delegate <router-link :to="EXPLORER + '@' + op.delegatee">{{ op.delegatee }}</router-link> {{ vests2sp(op.vesting_shares) }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'comment' && op.parent_author !== ''">
        <router-link :to="EXPLORER + '@' + op.author">{{ op.author }}</router-link> replied to <router-link :to="EXPLORER + link(op.parent_author, op.parent_permlink)">{{ linkCut(op.parent_author, op.parent_permlink) }}</router-link>. <span class="memo">{{ op.body ? op.body.substring(0, 140) + (op.body.length > 140 ? '...' : '') : '' }}</span> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'comment' && op.parent_author === ''">
        <router-link :to="EXPLORER + '@' + op.author">{{ op.author }}</router-link> authored a post: <router-link :to="EXPLORER + link(op.author, op.permlink)">{{ linkCut(op.author, op.permlink) }}</router-link> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'transfer_to_vesting'">
        <router-link :to="EXPLORER + '@' + op.from">{{ op.from }}</router-link> power up {{ op.amount }} to <router-link :to="EXPLORER + '@' + op.to">{{ op.to }}</router-link> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'withdraw_vesting'">
        <router-link :to="EXPLORER + '@' + op.account">{{ op.account }}</router-link> start power down {{ vests2sp(op.vesting_shares) }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'fill_vesting_withdraw'">
        <router-link :to="EXPLORER + '@' + op.from_account">{{ op.from_account }}</router-link> withdraw {{ op.withdrawn }} as {{ op.deposited }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'return_vesting_delegation'">
        <router-link :to="EXPLORER + '@' + op.account">{{ op.account }}</router-link> return of {{ vests2sp(op.vesting_shares) }} delegation - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'account_create'">
        <router-link :to="EXPLORER + '@' + op.creator">{{ op.creator }}</router-link> create account <router-link :to="EXPLORER + '@' + op.new_account_name">{{ op.new_account_name }}</router-link>. Fee: {{ op.fee }}. - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'producer_reward'">
        <router-link :to="EXPLORER + '@' + op.producer">{{ op.producer }}</router-link> producer reward: {{ vests2sp(op.vesting_shares) }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'feed_publish'">
        <router-link :to="EXPLORER + '@' + op.publisher">{{ op.publisher }}</router-link> feed price ${{ feedPrice }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'witness_update'">
        <router-link :to="EXPLORER + '@' + op.owner">{{ op.owner }}</router-link> update witness. Creation fee: {{ op.props ? op.props.account_creation_fee : '' }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'account_witness_vote'">
        <router-link :to="EXPLORER + '@' + op.account">{{ op.account }}</router-link><span v-if="op.approve"> approve</span><span v-else> unapprove</span> witness <router-link :to="EXPLORER + '@' + op.witness">{{ op.witness }}</router-link> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'claim_reward_balance'">
        <router-link :to="EXPLORER + '@' + op.account">{{ op.account }}</router-link> claim reward: {{ vests2sp(op.reward_vests) }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'custom_json' && op.id === 'follow' && Array.isArray(op.json) && op.json[0] === 'reblog'">
        <router-link :to="EXPLORER + '@' + op.json[1].account">{{ op.json[1].account }}</router-link> reblog <router-link :to="EXPLORER + link(op.json[1].author, op.json[1].permlink)">{{ linkCut(op.json[1].author, op.json[1].permlink) }}</router-link> - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'custom_json' && op.id === 'follow' && Array.isArray(op.json) && op.json[0] === 'follow'">
        <router-link :to="EXPLORER + '@' + op.json[1].follower">{{ op.json[1].follower }}</router-link>
        <span v-if="op.json[1].what && op.json[1].what.length > 0 && op.json[1].what[0] === 'blog'"> follow</span>
        <span v-else> unfollow</span> {{ op.json[1].following }} - {{ op.time }}
      </div>
      <div v-else-if="typeOp === 'custom_json'">
        <card-data :data="op.json" :title="'custom: ' + op.id" />
      </div>
      <div v-else>
        <card-data :data="op" :title="typeOp" />
      </div>
    </span>
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
  border: solid 1px #dcdcdc;
  border-radius: 5px;
  margin: 10px auto;
  display: block;
  background-color: white;
}
.trx:hover { box-shadow: 0px 0px 2px #72b4e8; }
.tx-link {
  float: right;
  font-size: 0.9rem;
  font-family: monospace;
  margin-left: 8px;
  padding: 5px;
  background-color: #f1ffc2;
}
.tx-link a { text-decoration: none; color: #8a8a8a; }
.operation { display: block; padding: 8px 10px; overflow-wrap: break-word; }
.operation a { text-decoration: none; }
.memo { color: #bb5050; font-family: monospace; font-size: larger; }
</style>
