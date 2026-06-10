<template>
  <div>
    <AppHeader ref="appHeader" @login="onLogin" @logout="onLogout" />
    <div class="container">
      <h2>{{proposal.subject}}</h2>
      <div class="row mt-3 mb-2">
        <div class="col-2">Creator</div>
        <div class="col-10">
          <div class="image-profile me-2" :style="{ backgroundImage: 'url(' + proposal.image + ')' }"></div>
          <span>{{proposal.creator}}</span>
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Receiver</div>
        <div class="col-10">
          <div class="image-profile me-2" :style="{ backgroundImage: 'url(' + proposal.image_receiver + ')' }"></div>
          <span>{{proposal.receiver}}</span>
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Subject</div>
        <div class="col-10">
          <router-link :to="proposal.url">{{proposal.subject}}</router-link>
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Start date</div>
        <div class="col-10">{{proposal.start_date}}</div>
      </div>
      <div class="row mb-2">
        <div class="col-2">End date</div>
        <div class="col-10">{{proposal.end_date}}</div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Total days</div>
        <div class="col-10">{{proposal.total_time}}</div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Daily pay</div>
        <div class="col-10">{{proposal.daily_pay}}</div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Total pay</div>
        <div class="col-10">{{proposal.total_pay}}</div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Status</div>
        <div class="col-10">{{proposal.status}} {{proposal.status_extended}}</div>
      </div>
      <div class="row mb-2">
        <div class="col-2">Votes</div>
        <div class="col-10">{{proposal.votes_sp}}</div>
      </div>
      <div v-if="authStore.logged" class="row mt-4">
        <div class="form-group col-12">
          <button @click="vote" class="btn btn-primary btn-large me-2" :disabled="saving"><div v-if="saving" class="mini loader"></div>{{display_button}}</button>
        </div>
      </div>
      <div v-if="alertsStore.info" class="alert alert-info" role="alert">{{alertsStore.infoText}}</div>
      <div v-if="alertsStore.success" class="alert alert-success" role="alert" v-html="alertsStore.successText"></div>
      <div v-if="alertsStore.danger" class="alert alert-danger" role="alert">{{alertsStore.dangerText}}</div>

      <h3 class="mt-5">{{votes.length}} Votes</h3>
      <div class="row mb-3">
        <div class="col-12 text-end">
          <select v-model="sort_order">
            <option value="votes">Sort by votes</option>
            <option value="name">Sort by name</option>
          </select>
        </div>
      </div>
      <div class="card mb-2">
        <ul class="list-group list-group-flush">
          <li v-for="(vote,index) in votes" :key="index" class="list-group-item">
            <div class="row">
              <div class="col-3">@{{vote.voter}}</div>
              <div class="col-2">{{vote.votes_sp}}</div>
              <div class="col-7">{{vote.votes_description}}</div>
            </div>
          </li>
        </ul>
      </div>
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

export default {
  name: 'ProposalPage',
  components: { AppHeader },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    const authStore = useAuthStore()
    return { ...chainProps, ...rpc, alertsStore, authStore }
  },

  data() {
    return {
      proposal: { url: '' },
      votes: [],
      sort_order: 'votes',
      display_button: 'Vote',
      saving: false,
    }
  },

  async created() {
    await this.getChainProperties()
    await this.getProposal()
  },

  watch: {
    sort_order(new_order) { this.sortBy(new_order) },
  },

  methods: {
    async getProposal() {
      const id = this.$route.params.id
      const proposals = await this.steem_database_call('find_proposals', [[id]])
      if (!proposals || proposals.length === 0) {
        this.alertsStore.showDanger(`Proposal number #${id} does not exist`)
        return
      }
      const proposal = proposals[0]
      const delta_t = new Date(proposal.end_date) - new Date(proposal.start_date)
      proposal.url = Config.EXPLORER + '@' + proposal.creator + '/' + proposal.permlink
      proposal.image = 'https://steemitimages.com/u/' + proposal.creator + '/avatar/small'
      proposal.image_receiver = 'https://steemitimages.com/u/' + proposal.receiver + '/avatar/small'
      proposal.votes_sp = this.witnessVotes2sp(proposal.total_votes)
      proposal.vote = false
      proposal.newVote = false
      proposal.total_time = Utils.textTime(delta_t)
      proposal.total_pay = (parseFloat(proposal.daily_pay) * delta_t / (1000 * 60 * 60 * 24)).toFixed(3) + ' ' + Config.SBD
      proposal.active = this.isActive(proposal)
      if (proposal.active) {
        proposal.status = 'active'
        proposal.status_extended = ''
      } else {
        proposal.status = 'inactive'
        proposal.status_extended = `(becomes active in ${Utils.textTime(new Date(proposal.start_date + 'Z') - Date.now())})`
      }
      this.proposal = proposal

      if (this.authStore.logged) this.loadVotesFromAccount()
      this.loadVotes()
    },

    sortBy(type) {
      switch (type) {
        case 'votes':
          this.votes.sort((a, b) => parseInt(b.votes) - parseInt(a.votes))
          return
        case 'name':
          this.votes.sort((a, b) => a.voter.localeCompare(b.voter))
          return
        default:
          throw new Error(`The type '${type}' for sort does not exist`)
      }
    },

    isActive(proposal) {
      const now = Date.now()
      return now <= new Date(proposal.end_date + 'Z') && now >= new Date(proposal.start_date + 'Z')
    },

    async loadVotes() {
      const proposal = this.proposal
      proposal.total_votes = 0
      let from = ''
      let break_while = false
      const voters = []
      while (!break_while) {
        const votes = await this.steem_database_call('list_proposal_votes', [[proposal.id, from], 100, 'by_proposal_voter'])
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
      this.votes = []
      const accounts = await this.steem_database_call('get_accounts', [voters])
      for (const account of accounts) {
        const vote = this.calculate_vote(account)
        this.votes.push(vote)
        proposal.total_votes += vote.votes
      }
      proposal.votes_sp = this.witnessVotes2sp(proposal.total_votes)
      this.proposal = { ...proposal }
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
        if (vote.proxy_votes > 0)
          vote.votes_description += ` + ${this.witnessVotes2sp(vote.proxy_votes)} proxy,`
        vote.votes_description += ` proxied to @${account.proxy})`
      }
      return vote
    },

    async loadVotesFromAccount() {
      const user = this.authStore.user
      const id = this.$route.params.id
      const account_votes = await this.steem_database_call('list_proposal_votes', [[user, id], 1, 'by_voter_proposal'])
      if (!account_votes || account_votes.length === 0) {
        this.proposal.vote = false
        this.display_button = 'Vote'
      } else {
        this.proposal.vote = true
        this.display_button = 'Remove vote'
      }
    },

    vote() {
      const user = this.authStore.user
      const activeKey = this.authStore.keys.active
      const ownerKey = this.authStore.keys.owner
      const id = this.$route.params.id
      const privKey = activeKey ?? ownerKey

      if (!privKey) {
        this.alertsStore.showDanger('Please login with master, owner, or active key')
        return
      }

      const ops = [['update_proposal_votes', {
        voter: user,
        proposal_ids: [id],
        approve: !this.proposal.vote,
        extensions: [],
      }]]

      this.saving = true
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()

      this.steem_broadcast_sendOperations(ops, privKey)
        .then(result => {
          this.saving = false
          this.alertsStore.showSuccess(`Vote saved! Block ${result.block_num}`)
          this.loadVotesFromAccount()
        })
        .catch(error => {
          this.saving = false
          this.alertsStore.showDanger(error.message)
          throw error
        })
    },

    onLogin() {
      this.loadVotesFromAccount()
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()
    },

    onLogout() {
      this.alertsStore.hideSuccess()
      this.alertsStore.hideDanger()
      this.alertsStore.hideInfo()
    },
  },
}
</script>

<style scoped>
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
</style>
