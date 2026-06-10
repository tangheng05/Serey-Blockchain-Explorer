<template>
  <div class="post-page">
    <!-- Reading progress bar -->
    <div class="progress-bar" :style="{ transform: `scaleX(${readProgress / 100})` }"></div>

    <AppHeader ref="appHeader" />

    <!-- Loading skeleton -->
    <Transition name="fade-out" mode="out-in">
      <div v-if="!exists" class="skeleton-layout" key="skeleton">
        <div class="skeleton-sidebar">
          <div class="skeleton-card tall"></div>
          <div class="skeleton-card medium"></div>
          <div class="skeleton-card medium"></div>
        </div>
        <div class="skeleton-main">
          <div class="skeleton-title"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w-full"></div>
            <div class="skeleton-line w-4/5"></div>
            <div class="skeleton-line w-full"></div>
            <div class="skeleton-line w-3/4"></div>
            <div class="skeleton-line w-full"></div>
            <div class="skeleton-line w-2/3"></div>
            <div class="skeleton-img"></div>
            <div class="skeleton-line w-full"></div>
            <div class="skeleton-line w-5/6"></div>
            <div class="skeleton-line w-full"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main content -->
    <Transition name="fade-in" mode="out-in">
      <div v-if="exists" class="post-layout" key="content">

        <!-- ── SIDEBAR ── -->
        <aside class="post-sidebar">
          <div
            class="s-card s-author"
            v-motion
            :initial="{ opacity: 0, x: -28 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 80 } }"
          >
            <div class="author-avatar" :style="authorAvatarStyle"></div>
            <router-link :to="EXPLORER + '@' + post.author" class="author-handle">@{{ post.author }}</router-link>
            <a :href="`https://serey.io/authors/${post.author}/${post.permlink}`" target="_blank" rel="noopener" class="btn-serey">
              View on Serey.io ↗
            </a>
          </div>

          <div
            class="s-card s-payout"
            v-motion
            :initial="{ opacity: 0, x: -28 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 180 } }"
          >
            <div class="payout-eyebrow">{{ payout.old_post ? 'Post Rewards' : 'Pending Rewards' }}</div>
            <div class="payout-figure">{{ payout.total }}</div>
            <div class="payout-sub">${{ (parseFloat(payout.total) * (sereyPrice || 0)).toFixed(2) }} USD</div>
            <hr class="payout-hr" />
            <div v-for="(val, key) in payout.card" :key="key" class="payout-line">
              <span class="pl-key">{{ key }}</span>
              <span class="pl-val">{{ val }}</span>
            </div>
          </div>

          <div
            class="s-card s-meta"
            v-motion
            :initial="{ opacity: 0, x: -28 }"
            :enter="{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22, delay: 280 } }"
          >
            <div class="meta-eyebrow">{{ post.depth === 0 ? 'Post Info' : 'Comment Info' }}</div>
            <div class="meta-line"><span>Category</span><strong>{{ post.parent_permlink }}</strong></div>
            <div class="meta-line"><span>ID</span><strong>#{{ post.id }}</strong></div>
            <div class="meta-line"><span>Published</span><strong>{{ formatDate(post.created) }}</strong></div>
            <div class="meta-line"><span>Net Votes</span><strong>{{ post.net_votes }}</strong></div>
            <div class="meta-line"><span>Replies</span><strong>{{ post.children }}</strong></div>
          </div>
        </aside>

        <!-- ── MAIN ── -->
        <main class="post-main">
          <div v-if="alertsStore.danger" class="page-alert danger">{{ alertsStore.dangerText }}</div>
          <div v-if="alertsStore.info" class="page-alert info">{{ alertsStore.infoText }}</div>

          <!-- Title -->
          <header
            class="post-hero"
            v-motion
            :initial="{ opacity: 0, y: 24 }"
            :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 120 } }"
          >
            <h1 v-if="post.depth === 0" class="post-title">{{ post.title }}</h1>
            <template v-else>
              <h1 class="post-title">Comment</h1>
              <div class="comment-breadcrumbs">
                <router-link v-if="post.depth > 1" :to="EXPLORER + '@' + post.parent_author + '/' + post.parent_permlink">← Parent Comment</router-link>
                <router-link :to="EXPLORER + '@' + post.root_author + '/' + post.root_permlink">↑ Root Post</router-link>
              </div>
            </template>
          </header>

          <!-- Content Passport — single row strip -->
          <div
            class="passport-bar"
            v-motion
            :initial="{ opacity: 0, y: 16 }"
            :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26, delay: 200 } }"
          >
            <div class="pb-brand">
              <svg class="pb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span class="pb-title">Content Passport</span>
            </div>

            <div class="pb-fields">
              <div class="pb-field">
                <span class="pb-key">Author</span>
                <router-link :to="EXPLORER + '@' + post.author" class="pb-val link">@{{ post.author }}</router-link>
              </div>
              <div class="pb-dot">·</div>
              <div class="pb-field">
                <span class="pb-key">Published</span>
                <span class="pb-val">{{ formatDate(post.created) }}</span>
              </div>
              <div class="pb-dot">·</div>
              <div class="pb-field">
                <span class="pb-key">Hash</span>
                <span class="pb-chip intact">✓ Intact</span>
              </div>
              <div class="pb-dot">·</div>
              <div class="pb-field">
                <span class="pb-key">AI</span>
                <span :class="['pb-chip', passportMeta.aiGenerated === true ? 'ai-yes' : passportMeta.aiGenerated === false ? 'ai-no' : 'unknown']">
                  {{ passportMeta.aiGenerated === true ? 'Yes' : passportMeta.aiGenerated === false ? 'No' : 'Unknown' }}
                </span>
              </div>
              <div class="pb-dot">·</div>
              <div class="pb-field">
                <span class="pb-key">TX</span>
                <span class="pb-val mono">#{{ post.id }}</span>
              </div>
            </div>

            <div class="pb-verified">
              <span class="pb-pulse"></span>
              On-Chain Verified
            </div>
          </div>

          <!-- Body -->
          <article
            class="post-body"
            v-motion
            :initial="{ opacity: 0, y: 30 }"
            :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 26, delay: 280 } }"
            v-html="postDetail ? postDetail.description : post.body"
          ></article>

          <div class="post-divider"></div>

          <!-- Votes -->
          <section
            class="vote-section"
            v-motion
            :initial="{ opacity: 0, y: 40 }"
            :visible-once="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26, delay: 60 } }"
          >
            <h3 class="section-hdg">
              <span class="accent-dot"></span>
              {{ postDetail ? postDetail.voter_count : (post.active_votes || []).length }} Votes
            </h3>
            <votes :data="post.active_votes || []" :dataApi="postDetail ? postDetail.voters : []" :payout="payout" />
          </section>

          <template v-if="post.beneficiaries && post.beneficiaries.length > 0">
            <div class="post-divider"></div>
            <section
              class="bene-section"
              v-motion
              :initial="{ opacity: 0, y: 40 }"
              :visible-once="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } }"
            >
              <h3 class="section-hdg"><span class="accent-dot"></span> Beneficiaries</h3>
              <beneficiaries :data="post.beneficiaries" :payout="payout" />
            </section>
          </template>

          <div class="post-divider"></div>
          <section class="raw-section">
            <button class="raw-btn" @click="showRaw = !showRaw">
              <span class="raw-chevron" :class="{ open: showRaw }">›</span>
              {{ showRaw ? 'Hide' : 'Show' }} Raw Blockchain Data
            </button>
            <Transition name="raw-expand">
              <div v-if="showRaw" class="raw-body">
                <card-data :data="postGenerals" />
                <card-data :data="post.json_metadata" />
              </div>
            </Transition>
          </section>
        </main>

      </div>
    </Transition>
  </div>
</template>

<script>
import Config from '@/config.js'
import AppHeader from '@/components/layout/AppHeader'
import CardData from '@/components/explorer/CardData'
import Votes from '@/components/explorer/Votes'
import Beneficiaries from '@/components/explorer/Beneficiaries'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import axios from 'axios'

export default {
  name: 'Post',
  components: { AppHeader, CardData, Votes, Beneficiaries },

  setup() {
    const chainProps = useChainProperties()
    const rpc = useRPCNode()
    const alertsStore = useAlertsStore()
    return { ...chainProps, ...rpc, alertsStore }
  },

  data() {
    return {
      post: {},
      postDetail: null,
      postGenerals: {},
      payout: { total: '', card: {} },
      sereyPrice: null,
      exists: false,
      showRaw: false,
      readProgress: 0,
      authorAvatar: '',
      EXPLORER: Config.EXPLORER,
    }
  },

  computed: {
    authorAvatarStyle() {
      const url = this.authorAvatar || `https://steemitimages.com/u/${this.post.author}/avatar`
      return { backgroundImage: `url(${url})` }
    },

    passportMeta() {
      let meta = {}
      try { meta = JSON.parse(this.post.json_metadata || '{}') } catch (e) { /* */ }
      const aiGenerated =
        'ai_generated' in meta ? Boolean(meta.ai_generated) :
        'ai' in meta ? Boolean(meta.ai) :
        null
      return { aiGenerated }
    },

  },

  watch: { '$route': 'fetchData' },

  async created() {
    await this.getChainProperties()
    this.fetchData()
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  },

  methods: {
    onScroll() {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      this.readProgress = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr + 'Z').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    },

    formatTime(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr + 'Z').toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    },

    async fetchAuthorAvatar(author) {
      try {
        const res = await axios.get(`https://global-api.serey.io/api/v2/accounts/details-by-username/${author}`)
        const account = res.data?.account || {}
        this.authorAvatar =
          account.profile_url     ||
          account.profile_picture ||
          account.avatar          ||
          `https://steemitimages.com/u/${author}/avatar`
      } catch (e) {
        this.authorAvatar = `https://steemitimages.com/u/${author}/avatar`
      }
    },

    async fetchData() {
      const author = this.$route.params.account
      const permlink = this.$route.params.permlink
      this.exists = false
      this.readProgress = 0
      this.authorAvatar = ''

      const [postDetailRes, result] = await Promise.allSettled([
        axios.get(`https://global-api.serey.io/api/v1/sereyweb/getDetailByPermlink?permlink=${permlink}&authorName=${author}`),
        this.steem_database_call('get_content', [author, permlink]),
      ])

      if (postDetailRes.status === 'fulfilled') {
        this.postDetail = postDetailRes.value.data.content
      }

      if (result.status !== 'fulfilled') return
      const post = result.value
      this.post = post

      // Avatar fetched fire-and-forget — updates reactively when done
      this.fetchAuthorAvatar(author)

      const no_keys = ['body', 'json_metadata', 'beneficiaries', 'active_votes', 'replies', 'body_length', 'reblogged_by']
      const pst = {}
      for (const key in post) {
        if (!no_keys.includes(key)) pst[key] = post[key]
      }
      this.postGenerals = pst

      this.payout.old_post = (new Date()) - (new Date(post.cashout_time + 'Z')) > 0
      this.payout.net_rshares = post.net_rshares
      if (this.payout.old_post) {
        this.payout.total = (parseFloat(post.total_payout_value) + parseFloat(post.curator_payout_value)).toFixed(3) + ' ' + Config.SBD
        this.payout.author = post.total_payout_value
        this.payout.curator = post.curator_payout_value
      } else {
        this.payout.total = post.pending_payout_value
        this.payout.total_vote_weight = post.total_vote_weight
      }
      this.payoutCard()

      try {
        const priceRes = await axios.get('https://global-api.serey.io/api/v1/general/get_serey_price')
        this.sereyPrice = priceRes.data.price
      } catch (e) { /* */ }

      this.exists = true
    },

    payoutCard() {
      const total_payout_sbd = parseFloat(this.payout.total)
      let total_payout_author_sbd = 0
      let total_payout_curator_sbd = 0
      let total_payout_reward_pool_sbd = 0
      const forward_curation_remainder = this.HARDFORK <= 19

      if (this.payout.old_post) {
        total_payout_author_sbd = parseFloat(this.payout.author)
        total_payout_curator_sbd = parseFloat(this.payout.curator)
      } else {
        total_payout_author_sbd = 0.75 * total_payout_sbd
        total_payout_curator_sbd = 0.25 * total_payout_sbd
        const curation_remainder = total_payout_curator_sbd * (this.post.total_vote_weight - (this.post.active_votes || []).reduce((t, v) => t + v.weight, 0)) / this.post.total_vote_weight
        total_payout_curator_sbd -= curation_remainder
        if (forward_curation_remainder) total_payout_author_sbd += curation_remainder
        else total_payout_reward_pool_sbd = curation_remainder
      }

      const total_weight_beneficiaries = (this.post.beneficiaries || []).reduce((t, b) => t + parseInt(b.weight), 0)
      const total_payout_beneficiaries_sbd = total_payout_author_sbd * total_weight_beneficiaries / 10000
      total_payout_author_sbd -= total_payout_beneficiaries_sbd

      this.payout.card = {
        Author: total_payout_author_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_author_sbd / total_payout_sbd).toFixed(2) + '%)',
        Curators: total_payout_curator_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_curator_sbd / total_payout_sbd).toFixed(2) + '%)',
        Beneficiaries: total_payout_beneficiaries_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_beneficiaries_sbd / total_payout_sbd).toFixed(2) + '%)',
      }
      if (total_payout_reward_pool_sbd > 0) {
        this.payout.card.Reward_Pool = total_payout_reward_pool_sbd.toFixed(3) + ' ' + Config.SBD + ' (' + (100 * total_payout_reward_pool_sbd / total_payout_sbd).toFixed(2) + '%)'
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

/* ── Reading progress bar ── */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #0d9488, #10b981, #5eead4);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 9999;
  transition: transform .1s linear;
  border-radius: 0 2px 2px 0;
}

/* ── Design tokens ── */
/* accent:   #0d9488  teal-600                    */
/* accent-2: #059669  emerald-600 (gradient end)  */
/* bg:       #f1f5f9  slate-100                   */
/* card:     #ffffff                               */
/* text:     #0f172a  slate-900                   */
/* muted:    #64748b  slate-500                   */
/* border:   #e2e8f0  slate-200                   */

/* ── Page shell ── */
.post-page {
  background: #f1f5f9;
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}

/* ── Skeleton loading ── */
.skeleton-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}
.skeleton-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.skeleton-main { display: flex; flex-direction: column; gap: 1.25rem; }

.skeleton-card {
  border-radius: 12px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.skeleton-card.tall   { height: 180px; }
.skeleton-card.medium { height: 140px; }

.skeleton-title {
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  width: 75%;
}

.skeleton-body {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.skeleton-img {
  height: 280px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  margin: .5rem 0;
}
.skeleton-line.w-full  { width: 100%; }
.skeleton-line.w-4\/5  { width: 80%; }
.skeleton-line.w-3\/4  { width: 75%; }
.skeleton-line.w-2\/3  { width: 67%; }
.skeleton-line.w-5\/6  { width: 83%; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Layout ── */
.post-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

/* ── Sidebar ── */
.post-sidebar {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.s-card {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06);
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: box-shadow .25s, transform .25s;
}
.s-card:hover {
  box-shadow: 0 2px 8px rgba(15,23,42,.06), 0 8px 32px rgba(15,23,42,.08);
  transform: translateY(-2px);
}

.s-author { text-align: center; }

.author-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #e2e8f0;
  margin: 0 auto 1rem;
  border: 3px solid #0d9488;
  box-shadow: 0 0 0 5px rgba(13,148,136,.1);
  transition: box-shadow .25s, transform .25s;
}
.author-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 0 7px rgba(13,148,136,.18);
}

.author-handle {
  display: block;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: #0f172a;
  text-decoration: none;
  margin-bottom: .9rem;
  transition: color .2s;
}
.author-handle:hover { color: #0d9488; }

.btn-serey {
  display: block;
  background: linear-gradient(135deg, #0d9488, #059669);
  color: #fff;
  padding: .55rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-family: 'Outfit', sans-serif;
  font-size: .82rem;
  font-weight: 600;
  letter-spacing: .02em;
  transition: opacity .2s, transform .15s, box-shadow .2s;
}
.btn-serey:hover {
  color: #fff;
  opacity: .9;
  transform: translateY(-2px);
  box-shadow: 0 4px 18px rgba(13,148,136,.35);
}

/* Payout card */
.payout-eyebrow {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: .5rem;
  font-family: 'Outfit', sans-serif;
}
.payout-figure {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.55rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.1;
  margin-bottom: .2rem;
  letter-spacing: -.02em;
}
.payout-sub { font-size: .78rem; color: #64748b; margin-bottom: .75rem; font-family: 'JetBrains Mono', monospace; }
.payout-hr  { border: none; border-top: 1px solid #e2e8f0; margin: .75rem 0; }
.payout-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: .5rem;
  padding: .3rem 0;
  font-size: .76rem;
  border-bottom: 1px solid #f1f5f9;
  font-family: 'Outfit', sans-serif;
}
.payout-line:last-child { border-bottom: none; }
.pl-key { color: #64748b; flex-shrink: 0; }
.pl-val { color: #0f172a; font-weight: 600; text-align: right; font-family: 'JetBrains Mono', monospace; font-size: .72rem; }

/* Meta card */
.meta-eyebrow {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: .75rem;
  font-family: 'Outfit', sans-serif;
}
.meta-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: .5rem;
  padding: .38rem 0;
  font-size: .8rem;
  border-bottom: 1px solid #f1f5f9;
  font-family: 'Outfit', sans-serif;
}
.meta-line:last-child { border-bottom: none; }
.meta-line span { color: #64748b; flex-shrink: 0; }
.meta-line strong { color: #0f172a; font-weight: 600; text-align: right; word-break: break-all; font-family: 'JetBrains Mono', monospace; font-size: .75rem; }

/* ── Main content ── */
.post-main { min-width: 0; }

.page-alert {
  border-radius: 10px;
  padding: .75rem 1.1rem;
  margin-bottom: 1.25rem;
  font-size: .88rem;
  font-family: 'Outfit', sans-serif;
}
.page-alert.danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.page-alert.info   { background: #f0fdfc; color: #0f766e; border: 1px solid #99f6e4; }

/* Post hero */
.post-hero { margin-bottom: 1.25rem; }

.post-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
  margin: 0 0 .5rem;
  letter-spacing: -.03em;
}

.comment-breadcrumbs {
  display: flex;
  gap: 1.5rem;
  margin-top: .5rem;
}
.comment-breadcrumbs a {
  font-size: .88rem;
  color: #0d9488;
  text-decoration: none;
  font-weight: 500;
  font-family: 'Outfit', sans-serif;
}
.comment-breadcrumbs a:hover { text-decoration: underline; }

/* ── Post body typography ── */
.post-body {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06);
  border: 1px solid #e2e8f0;
  padding: 2.5rem;
  font-family: 'Lora', serif;
  font-size: 1.05rem;
  line-height: 1.82;
  color: #1e293b;
}

.post-body :deep(h1),
.post-body :deep(h2),
.post-body :deep(h3),
.post-body :deep(h4) {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  color: #0f172a;
  margin-top: 1.6em;
  margin-bottom: .5em;
  line-height: 1.2;
  letter-spacing: -.02em;
}
.post-body :deep(h1) { font-size: 2rem; }
.post-body :deep(h2) { font-size: 1.6rem; }
.post-body :deep(h3) { font-size: 1.3rem; }

.post-body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 1.75rem auto;
  display: block;
  box-shadow: 0 4px 24px rgba(15,23,42,.1);
  transition: transform .3s ease, box-shadow .3s ease;
}
.post-body :deep(img:hover) {
  transform: scale(1.01);
  box-shadow: 0 8px 40px rgba(15,23,42,.15);
}

.post-body :deep(a) { color: #0d9488; text-underline-offset: 3px; }
.post-body :deep(p) { margin-bottom: 1.25em; }

.post-body :deep(blockquote) {
  border-left: 4px solid #0d9488;
  padding: 1rem 1.5rem;
  margin: 1.75rem 0;
  background: #f0fdfc;
  border-radius: 0 10px 10px 0;
  font-style: italic;
  color: #475569;
}
.post-body :deep(code) {
  background: #f1f5f9;
  padding: .15em .4em;
  border-radius: 4px;
  font-size: .875em;
  font-family: 'JetBrains Mono', monospace;
  color: #0f766e;
}
.post-body :deep(pre) {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
  font-size: .875rem;
  margin: 1.75rem 0;
  font-family: 'JetBrains Mono', monospace;
}
.post-body :deep(pre code) { background: none; color: inherit; padding: 0; }
.post-body :deep(table) { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: .9rem; }
.post-body :deep(th) {
  background: #f8fafc;
  padding: .6rem .9rem;
  text-align: left;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: .72rem;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
}
.post-body :deep(td) { padding: .6rem .9rem; border-bottom: 1px solid #f1f5f9; }
.post-body :deep(ul), .post-body :deep(ol) { padding-left: 1.5rem; margin-bottom: 1.25em; }
.post-body :deep(li) { margin-bottom: .4em; }

/* Divider */
.post-divider { height: 1px; background: #e2e8f0; margin: 2.5rem 0; }

/* Section heading */
.section-hdg {
  display: flex;
  align-items: center;
  gap: .65rem;
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
  letter-spacing: -.01em;
}
.accent-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d9488, #059669);
  flex-shrink: 0;
}

/* ── Content Passport — dark certificate strip ── */
.passport-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: #0f172a;
  border-radius: 10px;
  padding: 0;
  margin-bottom: 1rem;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  flex-wrap: nowrap;
  min-height: 44px;
}

/* Left brand tab */
.pb-brand {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .6rem 1rem;
  background: linear-gradient(135deg, #0d9488, #059669);
  flex-shrink: 0;
  align-self: stretch;
}
.pb-icon {
  width: 13px;
  height: 13px;
  color: #fff;
  flex-shrink: 0;
}
.pb-title {
  font-weight: 700;
  font-size: .65rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
}

/* Fields row */
.pb-fields {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 .75rem;
  flex: 1;
  overflow: hidden;
  flex-wrap: nowrap;
}

.pb-field {
  display: flex;
  align-items: center;
  gap: .3rem;
  flex-shrink: 0;
}

.pb-dot {
  color: #334155;
  font-size: .85rem;
  margin: 0 .55rem;
  flex-shrink: 0;
  line-height: 1;
}

.pb-key {
  color: #64748b;
  font-size: .67rem;
  font-weight: 500;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.pb-val {
  color: #e7e5e0;
  font-weight: 600;
  font-size: .78rem;
  white-space: nowrap;
}
.pb-val.link {
  color: #5eead4;
  text-decoration: none;
  transition: color .15s;
}
.pb-val.link:hover { color: #99f6e4; }
.pb-val.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem;
  font-weight: 400;
  color: #94a3b8;
}

/* Status chips */
.pb-chip {
  display: inline-flex;
  align-items: center;
  padding: .15em .5em;
  border-radius: 4px;
  font-size: .67rem;
  font-weight: 700;
  letter-spacing: .04em;
  white-space: nowrap;
  font-family: 'Outfit', sans-serif;
}
.pb-chip.intact  { background: rgba(13,148,136,.3);  color: #5eead4; }
.pb-chip.ai-yes  { background: rgba(29,78,216,.25);  color: #93c5fd; }
.pb-chip.ai-no   { background: rgba(13,148,136,.3);  color: #5eead4; }
.pb-chip.unknown { background: rgba(100,116,139,.2); color: #94a3b8; }

/* Right verified badge */
.pb-verified {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: 0 1rem;
  font-size: .67rem;
  font-weight: 700;
  color: #5eead4;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  border-left: 1px solid #334155;
  align-self: stretch;
  font-family: 'Outfit', sans-serif;
}

.pb-pulse {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0d9488;
  position: relative;
  flex-shrink: 0;
}
.pb-pulse::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: rgba(13,148,136,.4);
  animation: badge-ripple 1.8s ease-out infinite;
}
@keyframes badge-ripple {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* ── Raw section ── */
.raw-btn {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: .5rem 1.1rem;
  font-size: .8rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: border-color .2s, color .2s, transform .15s, box-shadow .2s;
}
.raw-btn:hover {
  border-color: #0d9488;
  color: #0d9488;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(13,148,136,.15);
}

.raw-chevron {
  display: inline-block;
  font-size: 1rem;
  transition: transform .25s cubic-bezier(.34,1.56,.64,1);
  line-height: 1;
}
.raw-chevron.open { transform: rotate(90deg); }

.raw-body { margin-top: 1rem; }

/* ── Vue transitions ── */
.fade-out-leave-active { transition: opacity .25s ease, transform .3s ease; }
.fade-out-leave-to     { opacity: 0; transform: translateY(-8px); }

.fade-in-enter-active { transition: opacity .35s ease; }
.fade-in-enter-from   { opacity: 0; }

.raw-expand-enter-active {
  transition: opacity .3s ease, transform .35s cubic-bezier(.34,1.26,.64,1);
}
.raw-expand-enter-from { opacity: 0; transform: translateY(-10px); }
.raw-expand-leave-active { transition: opacity .2s ease, transform .2s ease; }
.raw-expand-leave-to   { opacity: 0; transform: translateY(-6px); }

/* ── Responsive ── */
@media (max-width: 900px) {
  .skeleton-layout,
  .post-layout {
    grid-template-columns: 1fr;
    padding: 1.25rem 1rem 3rem;
  }
  .skeleton-sidebar,
  .post-sidebar {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .75rem;
  }
  .s-author { grid-column: 1 / -1; }
  .post-body { padding: 1.5rem; }
  .passport-card { padding: 1.25rem 1.5rem; }
}

@media (max-width: 600px) {
  .skeleton-sidebar,
  .post-sidebar { grid-template-columns: 1fr; }
  .post-title { font-size: 1.75rem; }
  .post-body { padding: 1.25rem; font-size: .97rem; }
  .passport-card { padding: 1.1rem; }
  .pp-label { width: auto; }
  .passport-list li { flex-wrap: wrap; gap: .4rem; }
}
</style>
