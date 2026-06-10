import { defineStore } from 'pinia'
import Config from '@/config.js'

export const useChainStore = defineStore('chain', {
  state: () => ({
    feed_price: null,
    steem_per_mvests: null,
    reward_balance: null,
    recent_claims: null,
    sbd_per_rshare: null,
    steem_per_rshare: null,
    rpc_node: Config.RPC_NODES[0],
    max_fails: 1,
    max_fail_rounds: 1000000,
  }),
})
