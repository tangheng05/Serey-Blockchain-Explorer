<template>
  <div>
    <AppHeader ref="appHeader" @login="onLogin" @logout="onLogout" />
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <h2>Proposals</h2>
          <div v-if="steemdao.name">Total fund: {{steemdao.sbd_balance}}</div>
          <div v-if="steemdao.name">Daily budget: {{steemdao.daily_budget}}</div>
          <div v-if="steemdao.name">Budget for the next hour: {{steemdao.hourly_budget}}</div>
        </div>
        <div v-if="refAccount" class="col-md-6 text-end">
          <div class="big-image-profile" :style="{ backgroundImage: 'url(' + refAccount.image + ')' }"></div>
          <h3>@{{refAccount.name}}</h3>
          <div>{{refAccount.votes_sp}}</div>
          <div>{{refAccount.votes_description}}</div>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-md-2 me-2 mt-1">
          <input type="text" placeholder="Account" v-model="checkVotesAccount" @keyup.enter="checkVotes" class="form-control me-2" :class="{'is-invalid': error.check_votes_account}"/>
          <div v-if="error.check_votes_account" class="invalid-feedback">{{ errorText.check_votes_account }}</div>
        </div>
        <div class="col-md-2 mt-1">
          <button class="btn btn-primary" @click="checkVotes">Check votes</button>
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-12 text-end">
          <select v-model="sort_order">
            <option value="votes">Sort by votes</option>
            <option value="start_date">Sort by start date</option>
            <option value="end_date">Sort by end date</option>
            <option value="total_days">Sort by total days</option>
            <option value="id">Sort by id</option>
            <option value="status">Sort by status</option>
            <option value="creator">Sort by creator</option>
            <option value="receiver">Sort by receiver</option>
            <option value="daily_pay">Sort by daily pay</option>
            <option value="total_pay">Sort by total pay</option>
          </select>
        </div>
      </div>
      <div class="card mb-2">
        <ul class="list-group list-group-flush">
          <li v-for="(p,index) in proposals" :key="index"
            class="list-group-item"
            :class="{
              'total-funding':   p.funding_percent==1,
              'partial-funding': p.funding_percent >0 && p.funding_percent < 1,
              'no-funding':      p.funding_percent <=0
            }"
            @click="selectProposal(index)"
          >
            <div class="row">
              <div class="col-md-3">
                <div class="image-profile me-2" :style="{ backgroundImage: 'url(' + p.image + ')' }"></div>
                <span>{{p.creator}} <span v-if="p.creator !== p.receiver">(receiver @{{p.receiver}})</span></span>
                <div><router-link :to="p.url">{{p.subject}}</router-link></div>
                <div>
                  <small>id #{{p.id}}</small>
                  <span class="badge ms-2" :class="{'bg-primary':p.active,'bg-warning':!p.active}">{{p.status}}</span>
                </div>
              </div>
              <div class="col-md-4">From {{p.start_date}} to {{p.end_date}} ({{p.total_time}})</div>
              <div class="col-md-2">{{p.daily_pay}} daily</div>
              <div class="col-md-2">{{p.votes_sp}}</div>
              <div class="col-md-1 text-end">
                <button class="btn" @click.stop="toggleVote(index)" :class="{'btn-primary':p.newVote, 'btn-secondary':!p.newVote}">
                  <font-awesome-icon icon="check"/>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div v-if="authStore.logged" class="row mt-4">
        <div class="form-group col-12">
          <button @click="save" class="btn btn-primary btn-large me-2" :disabled="saving"><div v-if="saving" class="mini loader"></div>Save</button>
          <button @click="reset" class="btn btn-secondary btn-large">Reset</button>
        </div>
      </div>
      <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{alertsStore.infoText}}</div>
      <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
      <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{alertsStore.dangerText}}</div>
    </div>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader'
import Utils from '@/utils/utils.js'
import Config from '@/config.js'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'

export default {
  name: 'ProposalsPage',
  components: { AppHeader },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    const authStore = useAuthStore()
    const router = useRouter()
    return { ...chainProps, ...rpc, alertsStore, authStore, router }
  },

  data() {
    return {
      proposals: [],
      sort_order: 'votes',
      steemdao: {},
      saving: false,
      checkVotesAccount: '',
      refAccount: null,
      user_votes: false,
      error: { check_votes_account: false },
      errorText: { check_votes_account: '' },
    }
  },

  async created() {
    await this.getChainProperties()
    this.getProposals()
  },

  watch: {
    sort_order(new_order) { this.sortBy(new_order) },
  },

  methods: {
    async getSteemDao() {
      try {
        const accounts = await this.steem_database_call('get_accounts', [['steem.dao']])
        this.steemdao = accounts[0]
        this.steemdao.daily_budget = (parseFloat(this.steemdao.sbd_balance) / 100).toFixed(3) + ' ' + Config.SBD
        this.steemdao.hourly_budget = (parseFloat(this.steemdao.sbd_balance) / (24 * 100)).toFixed(3) + ' ' + Config.SBD
      } catch (error) {
        this.alertsStore.showDanger('Problems loading steem.dao')
        throw error
      }
    },

    async getProposals() {
      this.proposals = []
      await this.getSteemDao()
      const proposals = await this.steem_database_call('list_proposals', [['', 0], 100, 'by_creator'])
      for (const p of proposals) {
        const delta_t = new Date(p.end_date) - new Date(p.start_date)
        p.url = Config.EXPLORER + '@' + p.creator + '/' + p.permlink
        p.image = 'https://steemitimages.com/u/' + p.creator + '/avatar/small'
        p.votes_sp = this.witnessVotes2sp(p.total_votes)
        p.vote = false
        p.newVote = false
        p.total_time = Utils.textTime(delta_t)
        p.total_pay = (parseFloat(p.daily_pay) * delta_t / (1000 * 60 * 60 * 24)).toFixed(3) + ' ' + Config.SBD
        p.active = this.isActive(p)
        p.status = p.active ? 'started' : 'upcoming'
        this.proposals.push(p)
      }
      this.sortPayments()
      this.sortBy(this.sort_order)
      if (this.authStore.logged) this.loadVotesFromAccount()
      this.loadVotesNoActive()
    },

    sortPayments() {
      this.sortBy('votes')
      let budget = parseFloat(this.steemdao.sbd_balance) / 100
      for (const p of this.proposals) {
        if (p.status === 'upcoming') { p.funding_percent = -1; continue }
        const daily_payment = parseFloat(p.daily_pay)
        if (daily_payment <= budget) {
          p.funding_percent = 1
          budget -= daily_payment
        } else {
          p.funding_percent = budget / daily_payment
          budget = 0
        }
      }
    },

    sortBy(type) {
      switch (type) {
        case 'votes':
          this.proposals.sort((a, b) => parseInt(b.total_votes) - parseInt(a.total_votes)); return
        case 'start_date':
          this.proposals.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); return
        case 'end_date':
          this.proposals.sort((a, b) => new Date(a.end_date) - new Date(b.end_date)); return
        case 'total_days':
          this.proposals.sort((a, b) =>
            (new Date(b.end_date) - new Date(b.start_date)) - (new Date(a.end_date) - new Date(a.start_date))); return
        case 'creator':
          this.proposals.sort((a, b) => a.creator.localeCompare(b.creator)); return
        case 'receiver':
          this.proposals.sort((a, b) => a.receiver.localeCompare(b.receiver)); return
        case 'daily_pay':
          this.proposals.sort((a, b) => parseFloat(b.daily_pay) - parseFloat(a.daily_pay)); return
        case 'total_pay':
          this.proposals.sort((a, b) =>
            (new Date(b.end_date) - new Date(b.start_date)) * parseFloat(b.daily_pay) -
            (new Date(a.end_date) - new Date(a.start_date)) * parseFloat(a.daily_pay)); return
        case 'status':
          this.proposals.sort((a, b) => {
            const activeA = this.isActive(a), activeB = this.isActive(b)
            if (activeA === activeB) return parseInt(b.total_votes) - parseInt(a.total_votes)
            return activeA ? -1 : 1
          }); return
        case 'id':
          this.proposals.sort((a, b) => parseInt(a.id) - parseInt(b.id)); return
        default:
          throw new Error(`The type '${type}' for sort does not exist`)
      }
    },

    isActive(proposal) {
      const now = Date.now()
      return now <= new Date(proposal.end_date + 'Z') && now >= new Date(proposal.start_date + 'Z')
    },

    async loadVotesNoActive() {
      for (let i = 0; i < this.proposals.length; i++) {
        const proposal = this.proposals[i]
        if (this.isActive(proposal)) continue
        proposal.total_votes = 0
        let from = ''
        let break_while = false
        const voters = []
        while (!break_while) {
          const votes = await this.steem_database_call('list_proposal_votes', [[proposal.id, from], 100, 'by_proposal_voter'])
          if (votes.length === 0) break
          if (votes.length === 1) {
            break_while = true
            if (votes[0].proposal.id === proposal.id) voters.push(votes[0].voter)
          } else {
            for (let j = 0; j < votes.length - 1; j++) {
              if (votes[j].proposal.id !== proposal.id) { break_while = true; break }
              voters.push(votes[j].voter)
            }
          }
          from = votes[votes.length - 1].voter
        }
        const accounts = await this.steem_database_call('get_accounts', [voters])
        for (const account of accounts) {
          proposal.total_votes += parseInt(this.witness_vote_weight(account))
        }
        proposal.votes_sp = this.witnessVotes2sp(proposal.total_votes)
        this.proposals[i] = { ...proposal }
      }
      this.sortPayments()
      this.sortBy(this.sort_order)
    },

    witness_vote_weight(account) {
      if (account.proxy !== '') return 0
      return this.no_proxy_vote_weight(account) + this.proxy_vote_weight(account)
    },

    no_proxy_vote_weight(account) {
      return Math.floor(parseFloat(account.vesting_shares) * 1e6)
    },

    proxy_vote_weight(account) {
      return account.proxied_vsf_votes.reduce((t, v) => t + parseInt(v), 0)
    },

    calculate_vote(account) {
      const vote = {
        voter: account.name,
        votes: this.witness_vote_weight(account),
        no_proxy_votes: this.no_proxy_vote_weight(account),
        proxy_votes: this.proxy_vote_weight(account),
      }
      if (account.proxy === '') {
        vote.votes_sp = this.witnessVotes2sp(vote.votes)
        vote.votes_description = vote.proxy_votes > 0
          ? `(${this.witnessVotes2sp(vote.no_proxy_votes)} + ${this.witnessVotes2sp(vote.proxy_votes)} proxy)`
          : ''
      } else {
        vote.votes_sp = this.witnessVotes2sp(0)
        vote.votes_description = `(${this.witnessVotes2sp(vote.no_proxy_votes)}`
        if (vote.proxy_votes > 0) vote.votes_description += ` + ${this.witnessVotes2sp(vote.proxy_votes)} proxy,`
        vote.votes_description += ` proxied to @${account.proxy})`
      }
      return vote
    },

    async checkVotes() {
      this.user_votes = false
      this.error.check_votes_account = false
      try {
        await this.loadVotesFromAccount(this.checkVotesAccount)
      } catch (error) {
        this.error.check_votes_account = true
        this.errorText.check_votes_account = error.message
        throw error
      }
    },

    async loadVotesFromAccount(accountName) {
      if (!accountName) {
        accountName = this.authStore.user
        this.user_votes = true
      }
      this.clearVotes()
      const accounts = await this.steem_database_call('get_accounts', [[accountName]])
      if (!accounts || accounts.length === 0) throw new Error(`@${accountName} does not exist`)
      this.refAccount = accounts[0]
      this.refAccount.image = 'https://steemitimages.com/u/' + accountName + '/avatar/small'
      const vote = this.calculate_vote(this.refAccount)
      this.refAccount.votes_sp = vote.votes_sp
      this.refAccount.votes_description = vote.votes_description

      const account_votes = await this.steem_database_call('list_proposal_votes', [[accountName, 0], 100, 'by_voter_proposal'])
      for (const av of account_votes) {
        if (av.voter !== accountName) break
        const index = this.proposals.findIndex(p => p.id === av.proposal.id)
        if (index >= 0) {
          this.proposals[index] = { ...this.proposals[index], vote: true, newVote: true }
        }
      }
    },

    selectProposal(index) {
      const proposal = this.proposals[index]
      this.router.push({ name: 'Proposal', params: { id: proposal.id } })
    },

    toggleVote(index) {
      if (this.refAccount) {
        if (!this.authStore.logged) return
        if (this.refAccount.name !== this.authStore.user) return
      }
      const p = { ...this.proposals[index] }
      p.newVote = !p.newVote
      this.proposals[index] = p
    },

    save() {
      const user = this.authStore.user
      const privKey = this.authStore.keys.active ?? this.authStore.keys.owner

      if (!privKey) {
        this.alertsStore.showDanger('Please login with master, owner, or active key')
        return
      }

      const approve_ids = []
      const unapprove_ids = []
      for (const p of this.proposals) {
        if (p.newVote !== p.vote) {
          if (p.newVote) approve_ids.push(p.id)
          else unapprove_ids.push(p.id)
        }
      }

      if (approve_ids.length === 0 && unapprove_ids.length === 0) {
        this.alertsStore.showDanger('Nothing to change')
        return
      }

      const ops = []
      approve_ids.sort((a, b) => a - b)
      unapprove_ids.sort((a, b) => a - b)

      for (let i = 0; i < approve_ids.length; i++) {
        if (i % Config.STEEM_PROPOSAL_MAX_IDS_NUMBER === 0)
          ops.push(['update_proposal_votes', { voter: user, proposal_ids: [], approve: true, extensions: [] }])
        ops[ops.length - 1][1].proposal_ids.push(approve_ids[i])
      }
      for (let i = 0; i < unapprove_ids.length; i++) {
        if (i % Config.STEEM_PROPOSAL_MAX_IDS_NUMBER === 0)
          ops.push(['update_proposal_votes', { voter: user, proposal_ids: [], approve: false, extensions: [] }])
        ops[ops.length - 1][1].proposal_ids.push(unapprove_ids[i])
      }

      this.saving = true
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()

      this.steem_broadcast_sendOperations(ops, privKey)
        .then(result => {
          this.saving = false
          this.alertsStore.showSuccess(`Votes saved! Block ${result.block_num}`)
          this.loadVotesFromAccount()
        })
        .catch(error => {
          this.saving = false
          this.alertsStore.showDanger(error.message)
          throw error
        })
    },

    reset() {
      this.proposals = this.proposals.map(p => ({ ...p, newVote: p.vote }))
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()
    },

    clearVotes() {
      this.proposals = this.proposals.map(p => ({ ...p, vote: false, newVote: false }))
    },

    onLogin() {
      this.loadVotesFromAccount()
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()
    },

    onLogout() {
      this.clearVotes()
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()
    },
  },
}
</script>

<style scoped>
.big-image-profile {
  display: inline-block;
  height: 3.5rem;
  width: 3.5rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 50%;
  vertical-align: middle;
}

.image-profile {
  display: inline-block;
  height: 2rem;
  width: 2rem;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 50%;
  vertical-align: middle;
}

.total-funding { background-color: #e8ffef; }
.partial-funding { background-color: #e3e2f7; }
.no-funding { background-color: #fff8e8; }
</style>
