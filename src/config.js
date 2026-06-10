const config = {
  production: {
    RPC_NODES: ['wss://api.serey.io'],
    EFTG_HARDFORK_0_1: false,
  },
  acceptance: {
    RPC_NODES: ['https://api.blkcc.xyz'],
    EFTG_HARDFORK_0_1: false,
  },
  development: {
    RPC_NODES: ['https://api.serey.io/'],
    EFTG_HARDFORK_0_1: true,
  },
  testnet: {
    RPC_NODES: ['https://testnet.steemitdev.com'],
    EFTG_HARDFORK_0_1: false,
  },
}

const environment = import.meta.env.MODE || 'development'
const finalConfig = config[environment] || config.development

const PAGE_AFTER_LOGIN = '/'
const PAGE_AFTER_LOGOUT = '/'

const SBD = 'Serey'
const STEEM = 'Serey'
const SP = 'SP'
const VESTS = 'VESTS'

const HARDFORK = 21

const EXPLORER = '/explorer/'
const DSTEEM_TIMEOUT = 5000

const STEEM_ADDRESS_PREFIX = 'SRY'
const STEEM_100_PERCENT = 10000
const STEEM_VOTE_REGENERATION_SECONDS = 5 * 24 * 60 * 60
const STEEM_INFLATION_RATE_START_PERCENT = 978
const STEEM_INFLATION_NARROWING_PERIOD = 250000
const STEEM_INFLATION_RATE_STOP_PERCENT = 95
const STEEM_BLOCKS_PER_YEAR = (365 * 24 * 60 * 60) / 3
const STEEM_BLOCKS_PER_DAY = (24 * 60 * 60) / 3
const STEEM_SBD_START_PERCENT = 900
const STEEM_SBD_STOP_PERCENT = 1000
const STEEM_CHAIN_ID = '5205c25d3e87cb3e8e527e6fbbf324b7b2b9fe7a7192c604ce5b174d08987324'
const STEEM_PROPOSAL_MAX_IDS_NUMBER = 5

const MAP = {
  TOP_WITNESSES: 40,
  INI_POS: [40, 0],
  INI_ZOOM: 1,
}

const APP_VERSION = 'sereyexplorer/3.0.0'

export default {
  RPC_NODES: finalConfig.RPC_NODES,

  PAGE_AFTER_LOGIN,
  PAGE_AFTER_LOGOUT,

  SBD,
  STEEM,
  SP,
  VESTS,
  HARDFORK,

  EFTG_HARDFORK_0_1: finalConfig.EFTG_HARDFORK_0_1,

  EXPLORER,
  DSTEEM_TIMEOUT,

  STEEM_ADDRESS_PREFIX,
  STEEM_100_PERCENT,
  STEEM_VOTE_REGENERATION_SECONDS,
  STEEM_INFLATION_RATE_START_PERCENT,
  STEEM_INFLATION_NARROWING_PERIOD,
  STEEM_INFLATION_RATE_STOP_PERCENT,
  STEEM_BLOCKS_PER_YEAR,
  STEEM_BLOCKS_PER_DAY,
  STEEM_SBD_START_PERCENT,
  STEEM_SBD_STOP_PERCENT,
  STEEM_CHAIN_ID,
  STEEM_PROPOSAL_MAX_IDS_NUMBER,

  MAP,
  APP_VERSION,
}
