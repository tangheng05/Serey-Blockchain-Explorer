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

        <!-- ── CONTENT PASSPORT — spans full width, top row ── -->
        <div
          class="passport-bar"
          v-motion
          :initial="{ opacity: 0, y: -12 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26, delay: 60 } }"
        >
          <div class="pb-brand">
            <svg class="pb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span class="pb-title">Content Ownership</span>
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

          <button class="pb-share" @click="sharePost">
            <span class="pb-share-inner">
              <svg class="pb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </span>
          </button>
        </div>

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
              <span>View on Serey.io ↗</span>
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

          <!-- Title + Body — single card -->
          <div
            class="post-card"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 100 } }"
          >
            <header v-if="post.depth !== 0 || post.title" class="post-hero">
              <h1 v-if="post.depth === 0" class="post-title">{{ post.title }}</h1>
              <template v-else>
                <h1 class="post-title">Comment</h1>
                <div class="comment-breadcrumbs">
                  <router-link v-if="post.depth > 1" :to="EXPLORER + '@' + post.parent_author + '/' + post.parent_permlink">← Parent Comment</router-link>
                  <router-link :to="EXPLORER + '@' + post.root_author + '/' + post.root_permlink">↑ Root Post</router-link>
                </div>
              </template>
            </header>
            <article class="post-body" v-html="postDetail ? postDetail.description : post.body"></article>
          </div>

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
    sharePost() {
      if (navigator.share) {
        navigator.share({ title: this.post?.title || 'Serey Post', url: window.location.href })
      } else {
        navigator.clipboard.writeText(window.location.href)
      }
    },

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
  background: linear-gradient(90deg, #150578, #192bc2, #449dd1, #78c0e0);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 9999;
  transition: transform .1s linear;
  border-radius: 0 2px 2px 0;
}

/* ── Design tokens — Blue Lagoon palette ── */
/* accent:   #449dd1  Blue Bell                   */
/* accent-2: #192bc2  Persian Blue (gradient end) */
/* accent-3: #78c0e0  Sky Blue (light)            */
/* navy:     #150578  Navy                        */
/* twilight: #0e0e52  Deep Twilight (text/dark)   */
/* bg:       #eef5fb  light blue-tinted           */
/* card:     #ffffff                               */
/* muted:    #5878a0  blue-muted                  */
/* border:   #c8dff0  blue-border                 */

/* ── Page shell ── */
.post-page {
  background: #eef5fb;
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
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.skeleton-card.tall   { height: 180px; }
.skeleton-card.medium { height: 140px; }

.skeleton-title {
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  width: 75%;
}

.skeleton-body {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #c8dff0;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
.skeleton-img {
  height: 280px;
  border-radius: 10px;
  background: linear-gradient(90deg, #c8dff0 25%, #eef5fb 50%, #c8dff0 75%);
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
  grid-template-rows: auto auto;
  gap: 1rem 2rem;
  align-items: start;
}

/* Passport spans both columns in the first row */
.post-layout > .passport-bar {
  grid-column: 1 / -1;
  grid-row: 1;
}

.post-layout > .post-sidebar {
  grid-column: 1;
  grid-row: 2;
}

.post-layout > .post-main {
  grid-column: 2;
  grid-row: 2;
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
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
  padding: 1.5rem;
  border: 1px solid #c8dff0;
  transition: box-shadow .25s, transform .25s;
}
.s-card:hover {
  box-shadow: 0 2px 8px rgba(14,14,82,.06), 0 8px 32px rgba(14,14,82,.08);
  transform: translateY(-2px);
}

.s-author { text-align: center; }

.author-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #c8dff0;
  margin: 0 auto 1rem;
  border: 3px solid #449dd1;
  box-shadow: 0 0 0 5px rgba(68,157,209,.15);
  transition: box-shadow .25s, transform .25s;
}
.author-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 0 7px rgba(68,157,209,.28);
}

.author-handle {
  display: block;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: #0e0e52;
  text-decoration: none;
  margin-bottom: .9rem;
  transition: color .2s;
}
.author-handle:hover { color: #449dd1; }

.btn-serey {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  background: #ffffff;
  color: #192bc2;
  padding: .6rem 1rem;
  border-radius: 10px;
  border: 1.5px solid #c8dff0;
  text-decoration: none;
  font-family: 'Outfit', sans-serif;
  font-size: .82rem;
  font-weight: 700;
  letter-spacing: .01em;
  box-shadow: 0 1px 4px rgba(14,14,82,.06);
  position: relative;
  overflow: hidden;
  transition: border-color .25s, box-shadow .25s, color .25s;
}
.btn-serey::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #dbeafe 0%, #93c5fd 50%, #78c0e0 100%);
  transform: translateX(-100%);
  transition: transform .35s cubic-bezier(.4,0,.2,1);
  z-index: 0;
}
.btn-serey:hover::before { transform: translateX(0); }
.btn-serey:hover {
  color: #0e0e52;
  border-color: #78c0e0;
  box-shadow: 0 4px 18px rgba(120,192,224,.3);
}
.btn-serey span, .btn-serey > * { position: relative; z-index: 1; }

/* Payout card */
.payout-eyebrow {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #5878a0;
  margin-bottom: .5rem;
  font-family: 'Outfit', sans-serif;
}
.payout-figure {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.55rem;
  font-weight: 600;
  color: #0e0e52;
  line-height: 1.1;
  margin-bottom: .2rem;
  letter-spacing: -.02em;
}
.payout-sub { font-size: .78rem; color: #5878a0; margin-bottom: .75rem; font-family: 'JetBrains Mono', monospace; }
.payout-hr  { border: none; border-top: 1px solid #c8dff0; margin: .75rem 0; }
.payout-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: .5rem;
  padding: .3rem 0;
  font-size: .76rem;
  border-bottom: 1px solid #eef5fb;
  font-family: 'Outfit', sans-serif;
}
.payout-line:last-child { border-bottom: none; }
.pl-key { color: #5878a0; flex-shrink: 0; }
.pl-val { color: #0e0e52; font-weight: 600; text-align: right; font-family: 'JetBrains Mono', monospace; font-size: .72rem; }

/* Meta card */
.meta-eyebrow {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #5878a0;
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
  border-bottom: 1px solid #eef5fb;
  font-family: 'Outfit', sans-serif;
}
.meta-line:last-child { border-bottom: none; }
.meta-line span { color: #5878a0; flex-shrink: 0; }
.meta-line strong { color: #0e0e52; font-weight: 600; text-align: right; word-break: break-all; font-family: 'JetBrains Mono', monospace; font-size: .75rem; }

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
.page-alert.info   { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }

/* ── Post card (title + body, single white card) ── */
.post-card {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
  border: 1px solid #c8dff0;
  overflow: hidden;
}

/* Post hero — title area inside the card */
.post-hero {
  padding: 2rem 2.5rem 1.5rem;
  border-bottom: 1px solid #eef5fb;
}

.post-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  color: #0e0e52;
  margin: 0;
  letter-spacing: -.03em;
}

.comment-breadcrumbs {
  display: flex;
  gap: 1.5rem;
  margin-top: .75rem;
}
.comment-breadcrumbs a {
  font-size: .88rem;
  color: #449dd1;
  text-decoration: none;
  font-weight: 500;
  font-family: 'Outfit', sans-serif;
}
.comment-breadcrumbs a:hover { text-decoration: underline; }

/* ── Post body typography ── */
.post-body {
  padding: 0.75rem 2.5rem 2.5rem;
  font-family: 'Lora', serif;
  font-size: 1.05rem;
  line-height: 1.82;
  color: #1a2e6e;
}

.post-body :deep(h1),
.post-body :deep(h2),
.post-body :deep(h3),
.post-body :deep(h4) {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  color: #0e0e52;
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
  margin: 1rem auto 1.75rem;
  display: block;
  box-shadow: 0 4px 24px rgba(21,5,120,.1);
  transition: transform .3s ease, box-shadow .3s ease;
}
.post-body :deep(img:hover) {
  transform: scale(1.01);
  box-shadow: 0 8px 40px rgba(21,5,120,.15);
}

.post-body :deep(a) { color: #449dd1; text-underline-offset: 3px; }
.post-body :deep(p) { margin-bottom: 1.25em; }

.post-body :deep(blockquote) {
  border-left: 4px solid #449dd1;
  padding: 1rem 1.5rem;
  margin: 1.75rem 0;
  background: #eff6ff;
  border-radius: 0 10px 10px 0;
  font-style: italic;
  color: #3b5c9e;
}
.post-body :deep(code) {
  background: #eef5fb;
  padding: .15em .4em;
  border-radius: 4px;
  font-size: .875em;
  font-family: 'JetBrains Mono', monospace;
  color: #1e40af;
}
.post-body :deep(pre) {
  background: #0e0e52;
  color: #bfdbfe;
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
  background: #f4f9fd;
  padding: .6rem .9rem;
  text-align: left;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: .72rem;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: #5878a0;
  border-bottom: 2px solid #c8dff0;
}
.post-body :deep(td) { padding: .6rem .9rem; border-bottom: 1px solid #eef5fb; }
.post-body :deep(ul), .post-body :deep(ol) { padding-left: 1.5rem; margin-bottom: 1.25em; }
.post-body :deep(li) { margin-bottom: .4em; }

/* Divider */
.post-divider { height: 1px; background: #c8dff0; margin: 2.5rem 0; }

/* Section heading */
.section-hdg {
  display: flex;
  align-items: center;
  gap: .65rem;
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #0e0e52;
  margin-bottom: 1rem;
  letter-spacing: -.01em;
}
.accent-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #449dd1, #192bc2);
  flex-shrink: 0;
}

@keyframes passport-glow {
  0%, 100% { box-shadow: 0 0 6px 1px rgba(220,20,60,.25), 0 2px 16px rgba(14,14,82,.08); }
  50%       { box-shadow: 0 0 14px 3px rgba(220,20,60,.45), 0 2px 16px rgba(14,14,82,.08); }
}

/* ── Content Passport ── */
.passport-bar {
  display: flex;
  align-items: stretch;
  border: 2.5px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #8b0000, #dc143c, #ff4444, #ffaaaa) border-box;
  border-radius: 12px;
  overflow: hidden;
  flex-wrap: nowrap;
  min-height: 52px;
  margin-bottom: 1rem;
  font-family: 'Outfit', sans-serif;
  animation: passport-glow 2.8s ease-in-out infinite;
  position: relative;
}

/* Left: deep navy brand label */
.pb-brand {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: 0 1.3rem;
  background: linear-gradient(150deg, #0e0e52 0%, #192bc2 100%);
  flex-shrink: 0;
}
.pb-icon {
  width: 15px;
  height: 15px;
  color: #78c0e0;
  flex-shrink: 0;
}
.pb-title {
  font-weight: 800;
  font-size: .68rem;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: #ffffff;
  white-space: nowrap;
}

/* Centre: data fields */
.pb-fields {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  flex: 1;
  overflow: hidden;
  flex-wrap: nowrap;
  gap: 0;
  border-left: 1px solid #c8dff0;
}

.pb-field {
  display: flex;
  align-items: center;
  gap: .32rem;
  flex-shrink: 0;
}

.pb-dot {
  color: #b8d4ef;
  font-size: .78rem;
  margin: 0 .65rem;
  flex-shrink: 0;
  user-select: none;
}

.pb-key {
  color: #5878a0;
  font-size: .67rem;
  font-weight: 800;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: .09em;
}

.pb-val {
  color: #0e0e52;
  font-weight: 800;
  font-size: .88rem;
  white-space: nowrap;
}
.pb-val.link {
  color: #192bc2;
  text-decoration: none;
  transition: color .15s;
}
.pb-val.link:hover { color: #449dd1; }
.pb-val.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: .78rem;
  font-weight: 700;
  color: #0e0e52;
}

/* Status chips */
.pb-chip {
  display: inline-flex;
  align-items: center;
  padding: .17em .55em;
  border-radius: 4px;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .05em;
  white-space: nowrap;
  font-family: 'Outfit', sans-serif;
}
.pb-chip.intact  { background: #192bc2; color: #ffffff; }
.pb-chip.ai-yes  { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
.pb-chip.ai-no   { background: #192bc2; color: #ffffff; }
.pb-chip.unknown { background: #eef5fb; color: #5878a0; border: 1px solid #c8dff0; }

/* Right: share button */
.pb-share {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: 0 1.4rem;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'Outfit', sans-serif;
  background: #f0f7ff;
  color: #192bc2;
  border: none;
  border-left: 1.5px solid #c8dff0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color .25s, border-color .25s;
}
.pb-share::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #dbeafe 0%, #93c5fd 50%, #78c0e0 100%);
  transform: translateX(100%);
  transition: transform .35s cubic-bezier(.4,0,.2,1);
  z-index: 0;
}
.pb-share:hover::before { transform: translateX(0); }
.pb-share:hover {
  color: #0e0e52;
  border-left-color: #78c0e0;
}
.pb-share-inner {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
}
.pb-share .pb-icon {
  color: #449dd1;
  width: 14px;
  height: 14px;
  transition: color .25s;
}
.pb-share:hover .pb-icon { color: #192bc2; }

/* ── Raw section ── */
.raw-btn {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  background: none;
  border: 1px solid #c8dff0;
  border-radius: 8px;
  padding: .5rem 1.1rem;
  font-size: .8rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  color: #5878a0;
  cursor: pointer;
  transition: border-color .2s, color .2s, transform .15s, box-shadow .2s;
}
.raw-btn:hover {
  border-color: #449dd1;
  color: #449dd1;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(68,157,209,.18);
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
    grid-template-rows: auto auto auto;
    padding: .75rem .75rem 3rem;
    gap: .85rem;
  }
  .post-layout > .passport-bar { grid-column: 1 !important; grid-row: 1; }
  .post-layout > .post-main    { grid-column: 1 !important; grid-row: 2; }
  .post-layout > .post-sidebar { grid-column: 1 !important; grid-row: 3; }

  /* Sidebar: two columns on tablet */
  .skeleton-sidebar,
  .post-sidebar {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .75rem;
  }
  .s-author { grid-column: 1 / -1; }

  /* Post card */
  .post-hero { padding: 1.1rem 1.1rem .9rem; }
  .post-body { padding: .6rem 1.1rem 1.4rem; }

  /* ── Passport bar ── */
  .passport-bar {
    flex-wrap: wrap;
    min-height: unset;
    border-radius: 10px;
    margin-bottom: 0;
  }
  .passport-bar::before { display: none; }

  /* Row 1: brand + share */
  .pb-brand {
    order: 1;
    flex: 1 1 auto;
    padding: .55rem .9rem;
    min-height: 40px;
  }
  .pb-share {
    order: 2;
    flex: 0 0 auto;
    padding: 0 .9rem;
    border-left: 1px solid rgba(255,255,255,.15);
    min-height: 40px;
  }

  /* Row 2: scrollable fields with fade hint */
  .pb-fields {
    order: 3;
    flex: 0 0 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: .55rem .9rem;
    border-top: 1px solid #c8dff0;
    border-left: none;
    background: #f4f9fd;
    gap: .5rem;
    mask-image: linear-gradient(to right, black 80%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
  }
  .pb-fields::-webkit-scrollbar { display: none; }
  .pb-dot { margin: 0 .3rem; }
}

@media (max-width: 600px) {
  .skeleton-sidebar,
  .post-sidebar { grid-template-columns: 1fr; }

  .post-layout { padding: .6rem .6rem 2.5rem; }

  .post-title { font-size: 1.45rem; }
  .post-hero  { padding: .9rem .9rem .75rem; }
  .post-body  { padding: .5rem .9rem 1.25rem; font-size: .95rem; line-height: 1.75; }

  /* Tighter passport bar */
  .pb-brand { padding: .5rem .75rem; }
  .pb-share { padding: 0 .75rem; }
  .pb-fields { padding: .5rem .75rem; }
  .pb-title  { font-size: .6rem; }
  .pb-key    { font-size: .6rem; }
  .pb-val    { font-size: .8rem; }
}
</style>
