import { reactive } from 'vue'
import Config from '@/config.js'
import { useChainStore } from '@/stores/chain.js'
import { useRPCNode } from '@/composables/useRPCNode.js'

export function useChainProperties() {
  const chainStore = useChainStore()
  const { steem_database_call } = useRPCNode()

  const chain = reactive({
    feed_price: -1,
    steem_per_mvests: 0,
    reward_balance: 0,
    recent_claims: 1,
    sbd_per_rshare: 0,
    steem_per_rshare: 0,
    haircut_price: -1,
    gap: 0,
    gap_sbd: 0,
  })

  function updateRS() {
    chain.steem_per_rshare = chain.reward_balance / chain.recent_claims
    chain.sbd_per_rshare = chain.steem_per_rshare * chain.feed_price
    chainStore.steem_per_rshare = chain.steem_per_rshare
    chainStore.sbd_per_rshare = chain.sbd_per_rshare
  }

  async function getChainProperties(force = false) {
    if (!force && chainStore.steem_per_mvests) {
      Object.assign(chain, chainStore.$state)
      return
    }

    const rewardFund = await steem_database_call('get_reward_fund', ['post'])
    chain.reward_balance = parseFloat(rewardFund.reward_balance)
    chain.recent_claims = parseInt(rewardFund.recent_claims)
    chainStore.reward_balance = chain.reward_balance
    chainStore.recent_claims = chain.recent_claims
    updateRS()

    const globals = await steem_database_call('get_dynamic_global_properties')
    Object.assign(chain, globals)
    chain.steem_per_mvests =
      (parseFloat(globals.total_vesting_fund_steem) * 1000000) /
      parseFloat(globals.total_vesting_shares)
    chain.haircut_price =
      (9 * parseFloat(globals.current_sbd_supply)) / parseFloat(globals.current_supply)

    chainStore.steem_per_mvests = chain.steem_per_mvests

    chain.gap = (chain.reward_balance / chain.recent_claims) * 2 * 2e12
    chain.gap_sbd = chain.gap * chain.feed_price

    updateRS()
  }

  function vests2sp(vests) {
    return (
      ((chain.steem_per_mvests * parseFloat(vests)) / 1000000).toFixed(3) +
      ' ' +
      Config.SP
    )
  }

  function witnessVotes2sp(votes) {
    votes = parseInt(votes)
    const sp = (votes / 1e12) * chain.steem_per_mvests
    if (sp < 1e3) return `${sp.toFixed(2)} ${Config.SP}`
    if (sp < 1e6) return `${(sp / 1e3).toFixed(2)}k ${Config.SP}`
    if (sp < 1e9) return `${(sp / 1e6).toFixed(2)} million ${Config.SP}`
    return `${(sp / 1e9).toFixed(2)} billion ${Config.SP}`
  }

  return {
    chain,
    getChainProperties,
    updateRS,
    vests2sp,
    witnessVotes2sp,
    STEEM_SYMBOL: Config.STEEM,
    SBD_SYMBOL: Config.SBD,
    VESTS_SYMBOL: Config.VESTS,
    SP_SYMBOL: Config.SP,
    STEEM_SBD_START_PERCENT: Config.STEEM_SBD_START_PERCENT,
    STEEM_SBD_STOP_PERCENT: Config.STEEM_SBD_STOP_PERCENT,
  }
}
