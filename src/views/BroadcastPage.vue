<template>
  <div>
    <b-modal v-model="showModalSignature" hide-footer title="Signature">
      <div v-if="signatures.length>0">
        <label class="col-form-label">Signature</label>
        <div class="hash">{{signatures[sigSelected].signature}}</div>
        <label class="col-form-label">Public key</label>
        <div class="hash">{{signatures[sigSelected].public_key}}</div>
        <label class="col-form-label mt-3">Signed by</label>
        <div v-if="signatures[sigSelected].signed_by !== ''">@{{signatures[sigSelected].signed_by}}</div>
        <div v-else>Unknown account</div>
        <label class="col-form-label mt-3">Authorities</label>
        <div v-if="signatures[sigSelected].authorities.length > 0" class="mb-3">
          <span v-for="auth in signatures[sigSelected].authorities" :key="auth">{{auth}}. </span>
        </div>
        <div v-else class="mb-3">Unknown</div>
        <button class="btn btn-primary me-3" @click="showModalSignature = false">close</button>
        <button class="btn btn-secondary" @click="removeSignature">remove</button>
      </div>
      <div v-else>No signatures</div>
    </b-modal>

    <b-modal v-model="showModalImportFlag" hide-footer title="Import transaction">
      <textarea class="form-control" v-model="trx_import" rows="10"/>
      <button class="btn btn-primary mt-3 mb-3" @click="do_import">import</button>
      <div v-if="alertImport.danger" class="alert alert-danger" role="alert">{{alertImport.dangerText}}</div>
    </b-modal>

    <b-modal v-model="showModalExportFlag" hide-footer title="Export transaction">
      <textarea class="form-control" v-model="trx_export" rows="10" disabled/>
      <button class="btn btn-primary mt-3" @click="copy_trx">copy</button>
    </b-modal>

    <b-modal v-model="showModalOptionalFieldsFlag" hide-footer title="Optional fields">
      <div v-for="(pname,index) in operationModalOptionalFields.optional" :key="index" class="row mb-3">
        <input class="form-control col-1 offset-1" type="checkbox" v-model="operationModalOptionalFields.params[pname].use_it"/>
        <label class="col-form-label col-10">{{pname}}</label>
      </div>
      <button class="btn btn-primary mt-3 mb-3" @click="showModalOptionalFieldsFlag = false">close</button>
    </b-modal>

    <AppHeader ref="appHeader" />
    <div class="container">
      <div class="row mb-3">
        <h2 class="col-6">Broadcast</h2>
        <div class="col">
          <div class="text-end">
            <button class="btn btn-primary" @click="showModalImportFlag = true">import</button>
          </div>
        </div>
      </div>
      <div v-if="signatures.length==0">
        <div class="form-group row mt-3">
          <label class="col-md-9 col-sm-6 col-form-label text-end">Expiration</label>
          <div class="col-md-3 col-sm-6">
            <select class="form-control" v-model="expireTime">
              <option v-for="(opt,key) in expiration_options" :key="key" :value="opt.value">{{opt.text}}</option>
            </select>
          </div>
        </div>
      </div>
      <div v-else>
        <label class="col-form-label col-12 text-end" :class="{'text-danger':hasExpired}">{{leftTime}}</label>
        <label class="col-form-label col-12 text-end">{{leftTime2}}</label>
      </div>
      <div v-for="(operation, opIndex) in trx" :key="opIndex" class="card border-dark mb-5">
        <div class="card-header">{{operation.name}}</div>
        <div class="card-body">
          <div class="mb-3 text-break">{{operation.description}}</div>
          <div v-if="operation.optional.length>0" class="row mb-2">
            <div class="col text-end">
              <button class="btn btn-secondary" @click="showModalOptionalFieldsAction(opIndex)" :disabled="signatures.length>0">Optional fields</button>
            </div>
          </div>
          <div v-for="(param,pname,pindex) in operation.params" :key="pindex">
            <div v-if="param.use_it" class="form-group row">
              <label class="col-md-2 col-form-label">{{param.name}}</label>
              <div v-if="param.typeUI==='textarea'" class="col">
                <textarea class="form-control"
                  v-model="param.value" :rows="param.rows" :disabled="signatures.length>0"/>
              </div>
              <div v-else-if="param.typeUI==='text'" class="col">
                <input class="form-control" type="text"
                  v-model="param.value" :placeholder="param.placeholder" :disabled="signatures.length>0"/>
              </div>
              <div v-else-if="param.typeUI==='checkbox'" class="col">
                <input class="form-control" type="checkbox"
                  v-model="param.value" :placeholder="param.placeholder" :disabled="signatures.length>0"/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row mt-5">
        <div class="col-md-8">
          <select v-model="operation_selected" class="form-control">
            <option v-for="(operation, name, index) in operations" :key="index" :value="name">{{operation.name}}</option>
          </select>
        </div>
        <div class="col-md-4">
          <button class="btn btn-primary" @click="addOperation(operation_selected)">Add operation</button>
        </div>
      </div>
      <div class="mt-5 mb-2">
        <h4 class="d-inline me-2">Signatures</h4>
        <button class="btn btn-secondary" @click="reloadSignatures"><font-awesome-icon icon="sync"/></button>
      </div>
      <div class="row">
        <div class="col-12">
          <div class="card mb-2">
            <ul class="list-group list-group-flush">
              <li v-for="(sig,index) in signatures" :key="index" class="list-group-item" @click="selectSignature(index)">
                <div class="image-profile me-2" :style="{ backgroundImage: 'url(' + sig.image + ')' }"></div><span>{{sig.display}}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="form-group row mt-3">
        <label class="col-md-2 col-form-label">Signature</label>
        <input class="col-md-9 form-control" type="text" v-model="signature" placeholder="Signature"/>
        <div class="col-md-1">
          <button class="btn btn-primary" @click="addSignature(signature)">Add</button>
        </div>
      </div>
      <div class="form-group row">
        <label class="col-md-2 col-form-label">Private Key</label>
        <input class="col-md-9 form-control" type="password" v-model="privkey" placeholder="Private key"/>
        <div class="col-md-1">
          <button class="btn btn-primary" @click="sign(false)">Sign</button>
        </div>
      </div>
      <div class="form-group mt-3 mb-4">
        <button class="btn btn-primary btn-large me-2" @click="broadcast" :disabled="sending"><div v-if="sending" class="mini loader"/>broadcast</button>
        <button class="btn btn-secondary" @click="do_export">export</button>
      </div>
      <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{alertsStore.infoText}}</div>
      <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
      <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{alertsStore.dangerText}}</div>
    </div>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader'
import { PrivateKey, cryptoUtils, Signature, utils } from 'dsteem'
import Config from '@/config.js'
import Operations from '@/utils/operations.js'
import Utils from '@/utils/utils.js'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'

export default {
  name: 'BroadcastPage',
  components: { AppHeader },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      operations: Operations,
      operation_selected: '',
      signature: '',
      privkey: '',
      headers: null,
      headersAux: null,
      expireTime: 60*60*1000,
      leftTime: '',
      leftTime2: '',
      hasExpired: false,
      trx: [],
      signatures: [],
      sigSelected: 0,
      sending: false,
      EXPLORER: Config.EXPLORER,
      trx_import: '',
      trx_export: '',
      alertImport: { danger: false, dangerText: '' },
      expiration_options: [
        {value:       1*60*1000, text:'1 minute'},
        {value:      10*60*1000, text:'10 minutes'},
        {value:      30*60*1000, text:'30 minutes'},
        {value:      60*60*1000, text:'1 hour'},
        {value:    8*60*60*1000, text:'8 hours'},
        {value:   24*60*60*1000, text:'1 day'},
        {value: 3*24*60*60*1000, text:'3 days'},
      ],
      operationModalOptionalFields: {},
      showModalSignature: false,
      showModalImportFlag: false,
      showModalExportFlag: false,
      showModalOptionalFieldsFlag: false,
    }
  },

  async created() {
    await this.getChainProperties()
    this.operations = Operations
    setInterval(() => {
      if (!this.headers) return
      const diff = new Date(this.headers.expiration + 'Z') - Date.now()
      if (diff > 0) {
        this.hasExpired = false
        this.leftTime = `Expires in ${Utils.textTime(diff)}`
        if (diff <= 60*60*1000) {
          this.leftTime2 = ''
        } else {
          const timeToBroadcast = new Date(new Date(this.headers.expiration + 'Z').getTime() - 60*60*1000).toISOString().slice(0, -5)
          this.leftTime2 = `It can only be broadcasted with one hour to expire, that is, after ${timeToBroadcast} UTC`
        }
      } else {
        this.leftTime = 'Transaction expired'
        this.leftTime2 = ''
        this.hasExpired = true
      }
    }, 1000)
    this.addHeaders()
    setInterval(() => { this.addHeaders() }, 60000)
  },

  methods: {
    selectSignature(index) {
      this.sigSelected = index
      this.showModalSignature = true
    },

    showModalOptionalFieldsAction(index) {
      this.operationModalOptionalFields = this.trx[index]
      this.showModalOptionalFieldsFlag = true
    },

    addOperation(op_selected) {
      const newOperation = JSON.parse(JSON.stringify(this.operations[op_selected]))
      this.trx = [...this.trx, newOperation]
    },

    removeSignature() {
      this.signatures.splice(this.sigSelected, 1)
      this.sigSelected = 0
      this.showModalSignature = false
    },

    async reloadSignatures() {
      const signatures = this.signatures
      this.signatures = []
      for (const s of signatures) {
        await this.addSignature(s.signature)
      }
    },

    async addSignature(sig) {
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      try {
        if (!this.headers) throw new Error('No headers defined')
        const trx = this.buildTransaction()
        trx.signatures = [sig]
        const keys = this.getSignatureKeys(trx)
        let display = keys[0]
        let signed_by = ''
        let authorities = []
        let image = ''
        const account = await this.searchAccountKey(keys[0])
        if (account && account.name) {
          signed_by = account.name
          image = account.image
          display = '@' + signed_by
          if (account.authorities) {
            authorities = account.authorities
            for (const auth of authorities) display = display + ' ' + auth
          }
        }
        this.signatures.push({ signature: sig, public_key: keys[0], display, signed_by, authorities, image })
      } catch (error) {
        this.alertsStore.showDanger(error.message)
        throw error
      }
    },

    async searchAccountKey(key) {
      key = key.toString()
      const account = { name: null, authorities: [], image: '' }
      try {
        if (!navigator.onLine) return account
        const accounts = await this.steem_database_call('get_key_references', [[key]])
        if (!accounts || accounts.length === 0) return null
        account.name = accounts[0][0]
        const fullAccounts = await this.steem_database_call('get_accounts', [[account.name]])
        if (!fullAccounts || fullAccounts.length === 0) return account
        for (const role of ['owner', 'active', 'posting']) {
          fullAccounts[0][role].key_auths.forEach(k => {
            if (key === k[0]) account.authorities.push(role)
          })
        }
        if (account.authorities.length > 0 && fullAccounts[0].json_metadata) {
          const metadata = JSON.parse(fullAccounts[0].json_metadata)
          account.image = Utils.getProfileImage(metadata)
        }
      } catch (error) {
        console.log(error)
      }
      return account
    },

    buildTransaction() {
      const operations = []
      for (const op of this.trx) {
        let operation
        if (op.operation.includes('steem_engine_')) {
          operation = this.buildOperationSteemEngine(op)
        } else {
          operation = [op.operation, {}]
          for (const key in op.params) {
            const param = op.params[key]
            if (param.use_it) operation[1][key] = this.paramParse(param.value, param.type)
          }
          if (op.operation === 'witness_set_properties')
            operation = utils.buildWitnessUpdateOp(operation[1].owner, operation[1].props)
        }
        operations.push(operation)
      }
      return {
        ref_block_num: this.headers ? this.headers.ref_block_num : 0,
        ref_block_prefix: this.headers ? this.headers.ref_block_prefix : 0,
        expiration: this.headers ? this.headers.expiration : new Date(Date.now() + parseInt(this.expireTime)).toISOString().slice(0, -5),
        operations,
        extensions: [],
        signatures: [],
      }
    },

    buildOperationSteemEngine(op) {
      const contractPayload = {}
      for (const key in op.params) {
        if (key === '_account') continue
        contractPayload[key] = this.paramParse(op.params[key].value, op.params[key].type)
      }
      return ['custom_json', {
        required_auths: [op.params._account.value],
        required_posting_auths: [],
        id: 'ssc-mainnet1',
        json: JSON.stringify({ contractName: op.contract, contractAction: op.action, contractPayload }),
      }]
    },

    paramParse(value, type) {
      switch (type) {
        case 'asset': case 'account': case 'string': case 'public_key': case 'time': case 'textarea':
          return value
        case 'boolean':
          return (typeof value === 'string' && value === 'true') || (typeof value === 'boolean' && value)
        case 'buffer':
          return Buffer.from(value)
        case 'number':
          return parseInt(value)
        case 'float-string':
          if (isNaN(value)) throw new Error('Incorrect amount')
          return value
        case 'json':
          try { JSON.parse(value) } catch { throw new Error('Invalid json format') }
          return value
        case 'object':
          try { return JSON.parse(value) } catch { throw new Error('Invalid json format') }
        default:
          throw new Error(`The param type ${type} is unknown`)
      }
    },

    paramParseInv(value, type) {
      switch (type) {
        case 'asset': case 'account': case 'string': case 'public_key': case 'time': case 'textarea':
          return value
        case 'boolean':
          return value ? 'true' : 'false'
        case 'buffer':
          return value
        case 'number':
          return value + ''
        case 'json':
          return value
        case 'object':
          return JSON.stringify(value)
        default:
          throw new Error(`The param type ${type} is unknown`)
      }
    },

    sign(skip) {
      try {
        if (!skip && this.signatures.length === 0) {
          this.addHeaders().then(() => { this.sign(true) })
          return
        }
        this.alertsStore.hideSuccess()
        this.alertsStore.hideDanger()
        const trx = this.buildTransaction()
        let privkey
        try {
          privkey = PrivateKey.fromString(this.privkey)
        } catch {
          throw new Error('Error reading the private key')
        }
        const chainId = Buffer.from(Config.STEEM_CHAIN_ID, 'hex')
        const digest = cryptoUtils.transactionDigest(trx, chainId)
        const sig = privkey.sign(digest)
        this.addSignature(sig.toString())
      } catch (error) {
        this.alertsStore.showDanger(error.message)
        throw error
      }
    },

    async broadcast() {
      try {
        this.alertsStore.hideDanger()
        this.alertsStore.hideSuccess()
        this.sending = true
        if (this.signatures.length === 0) throw new Error('Please sign the transaction')
        const trx = this.buildTransaction()
        this.signatures.forEach(sig => { trx.signatures.push(sig.signature) })
        const result = await this.steem_broadcast_send(trx)
        this.alertsStore.showSuccess(`Transaction sent successfully — block ${result.block_num}, id: ${result.id}`)
        this.sending = false
      } catch (error) {
        this.alertsStore.showDanger(error.message)
        this.sending = false
        throw error
      }
    },

    async addHeaders(where = 'principal') {
      if (this.signatures.length > 0) return
      let ref_block_num, ref_block_prefix, expiration
      if (navigator.onLine) {
        const dgp = await this.steem_database_call('get_dynamic_global_properties')
        ref_block_num = dgp.head_block_number & 0xFFFF
        ref_block_prefix = Buffer.from(dgp.head_block_id, 'hex').readUInt32LE(4)
        expiration = new Date(new Date(dgp.time + 'Z').getTime() + parseInt(this.expireTime)).toISOString().slice(0, -5)
      } else {
        if (where === 'principal' && !this.headersAux)
          throw new Error('Please connect to internet to get headers before signing offline')
        ref_block_num = this.headersAux.ref_block_num
        ref_block_prefix = this.headersAux.ref_block_prefix
        expiration = new Date(Date.now() + parseInt(this.expireTime)).toISOString().slice(0, -5)
      }
      const headers = { ref_block_num, ref_block_prefix, expiration }
      if (where !== 'aux') this.headers = headers
      this.headersAux = headers
    },

    getSignatureKeys(trx) {
      const chainId = Buffer.from(Config.STEEM_CHAIN_ID, 'hex')
      const digest = cryptoUtils.transactionDigest(trx, chainId)
      return trx.signatures.map(sig => Signature.fromString(sig).recover(digest))
    },

    do_import() {
      try {
        this.alertImport.danger = false
        const trx = JSON.parse(this.trx_import)
        this.getSignatureKeys(trx)
        this.headers = {
          ref_block_num: trx.ref_block_num,
          ref_block_prefix: trx.ref_block_prefix,
          expiration: trx.expiration,
        }
        this.trx = []
        for (const op of trx.operations) {
          const op_name = op[0]
          this.addOperation(op_name)
          const operation = this.trx[this.trx.length - 1]
          for (const key in operation.params) {
            const param = operation.params[key]
            if (typeof op[1][key] !== 'undefined') {
              param.use_it = true
              param.value = this.paramParseInv(op[1][key], param.type)
            } else {
              param.use_it = false
            }
          }
        }
        this.signatures = []
        for (const sig of trx.signatures) {
          this.addSignature(sig)
        }
        this.showModalImportFlag = false
      } catch (error) {
        this.alertImport.danger = true
        this.alertImport.dangerText = error.message
        throw error
      }
    },

    do_export() {
      try {
        this.alertsStore.hideDanger()
        this.alertsStore.hideSuccess()
        const trx = this.buildTransaction()
        this.signatures.forEach(sig => { trx.signatures.push(sig.signature) })
        this.trx_export = JSON.stringify(trx, null, 2)
        this.showModalExportFlag = true
      } catch (error) {
        this.alertsStore.showDanger(error.message)
        throw error
      }
    },

    copy_trx() {
      Utils.copyTextToClipboard(this.trx_export)
    },
  },
}
</script>

<style scoped>
.hash {
  font-family: monospace;
  overflow-wrap: break-word;
}
</style>
