<template>
  <div class="beneficiaries">
    <div class="title">
      <div class="beneficiary">Beneficiary</div>
      <div class="weight">Weight</div>
      <div class="value">Value</div>
    </div>
    <div v-for="(b, i) in beneficiaries" :key="i" class="data">
      <div class="row">
        <div class="beneficiary">
          <router-link :to="EXPLORER + '@' + b.account">@{{ b.account }}</router-link>
        </div>
        <div class="weight">{{ b.bene_weight }}</div>
        <div class="value">{{ b.bene_value }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'

export default {
  name: 'Beneficiaries',

  props: {
    data: { type: Array, required: true },
    payout: { type: Object, required: true },
  },

  data() {
    return {
      beneficiaries: [],
      EXPLORER: Config.EXPLORER,
    }
  },

  created() {
    this.computeBeneficiaries(this.data, this.payout)
  },

  methods: {
    computeBeneficiaries(data, payout) {
      const total_payout_sbd = parseFloat(payout.total)
      const total_payout_author_sbd = payout.old_post ? parseFloat(payout.author) : 0.75 * total_payout_sbd
      this.beneficiaries = data.map(b => ({
        ...b,
        bene_weight: (b.weight / 100).toFixed(2) + '%',
        bene_value: (total_payout_author_sbd * parseInt(b.weight) / 10000).toFixed(3) + ' ' + Config.SBD,
      }))
    },
  },
}
</script>

<style scoped>
.title { display: block; width: 100%; border: solid 1px #8a8a8a; color: #a0a0a0; background-color: white; padding: 6px 10px; }
.row { display: block; width: 100%; border: solid 1px #8a8a8a; border-top-width: 0px; background-color: white; padding: 6px 10px; }
.beneficiary { width: 40%; display: inline-block; }
.weight { width: 30%; display: inline-block; text-align: right; }
.value { width: 30%; display: inline-block; text-align: right; }
</style>
