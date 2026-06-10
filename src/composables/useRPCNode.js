import { ref } from 'vue'
import { Client } from 'dsteem'
import Config from '@/config.js'
import { useChainStore } from '@/stores/chain.js'
import { useAlertsStore } from '@/stores/alerts.js'

export function useRPCNode() {
  const sending = ref(false)
  const aborting = ref(false)
  const abortNodeConnection = ref(false)

  const chainStore = useChainStore()
  const alertsStore = useAlertsStore()

  const onNodeProgress = {
    abort() {
      return abortNodeConnection.value
    },
    onInit() {
      abortNodeConnection.value = false
    },
    onFail(event) {
      const number = event.fails > 1 ? ` (${event.fails})` : ''
      alertsStore.showInfo('Connection problems. Trying to reconnect' + number + '...')
    },
    onChangeNode(event) {
      alertsStore.showInfo('Changing to node ' + event.rpc_node)
    },
    onFailRound(event) {
      const number = event.failRounds > 1 ? ` (${event.failRounds})` : ''
      alertsStore.showInfo('Connection problems with all RPC nodes. Trying again' + number + '...')
    },
    onSuccess() {
      alertsStore.hideInfo()
    },
    onError(error) {
      alertsStore.hideInfo()
      alertsStore.showDanger(error.message)
    },
    onAbort() {
      alertsStore.hideInfo()
      aborting.value = false
    },
  }

  function RPCnode_initClient(address) {
    const addr = address || chainStore.rpc_node
    const opts = {
      addressPrefix: Config.STEEM_ADDRESS_PREFIX,
      timeout: Config.DSTEEM_TIMEOUT,
    }
    if (Config.STEEM_CHAIN_ID) opts.chainId = Config.STEEM_CHAIN_ID
    return new Client(addr, opts)
  }

  function RPCnode_fail(event, error) {
    console.log(`Fail RPC node: ${error.message}`)
    event.status = 'fail'
    event.fails++
    if (event.fails >= chainStore.max_fails) {
      let id = Config.RPC_NODES.findIndex((rpc) => rpc === event.rpc_node) + 1
      event.status = 'change_node'
      if (id === Config.RPC_NODES.length) {
        console.log('Fail round RPC node')
        event.status = 'fail_round'
        id = 0
        event.fail_rounds++
        if (event.fail_rounds >= chainStore.max_fail_rounds) {
          const err = new Error('Connection error with the RPC node')
          err.name = 'RPCFailRounds'
          throw err
        }
      }
      event.rpc_node = Config.RPC_NODES[id]
      event.fails = 0
      console.log('Changing to node ' + event.rpc_node)
    }
    return event
  }

  async function RPCnode_request(request, lambda) {
    if (lambda.onInit) lambda.onInit()

    const event = {
      status: 'init',
      rpc_node: chainStore.rpc_node,
      fails: 0,
      fail_rounds: 0,
    }
    let lastStableRPC = chainStore.rpc_node

    while (true) {
      try {
        if (lambda.abort && lambda.abort()) break

        let client = RPCnode_initClient(event.rpc_node)
        if (lastStableRPC !== chainStore.rpc_node) {
          lastStableRPC = chainStore.rpc_node
          client = RPCnode_initClient(lastStableRPC)
        }

        const response = await request(client)
        chainStore.rpc_node = event.rpc_node

        if (lambda.onSuccess) lambda.onSuccess(response)
        return response
      } catch (error) {
        if (error.name === 'RPCError') {
          if (lambda.onError) lambda.onError(error)
          throw error
        }
        try {
          RPCnode_fail(event, error)
        } catch (err) {
          if (lambda.onError) lambda.onError(err)
          throw err
        }
        if (lambda.onFail && event.status === 'fail') lambda.onFail(event)
        if (lambda.onChangeNode && event.status === 'change_node') lambda.onChangeNode(event)
        if (lambda.onFailRound && event.status === 'fail_round') lambda.onFailRound(event)
      }
    }

    if (lambda.onAbort) lambda.onAbort(event)
    const err = new Error('Connection aborted')
    err.name = 'Abort'
    throw err
  }

  async function steem_database_call(method, params) {
    return RPCnode_request(
      async (client) => client.database.call(method, params),
      onNodeProgress,
    )
  }

  async function steem_broadcast_sendOperations(operations, privKey) {
    return RPCnode_request(
      async (client) => client.broadcast.sendOperations(operations, privKey),
      onNodeProgress,
    )
  }

  async function steem_broadcast_send(trx) {
    return RPCnode_request(
      async (client) => client.broadcast.send(trx),
      onNodeProgress,
    )
  }

  return {
    sending,
    aborting,
    abortNodeConnection,
    onNodeProgress,
    steem_database_call,
    steem_broadcast_sendOperations,
    steem_broadcast_send,
  }
}
