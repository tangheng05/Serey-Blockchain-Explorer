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

          <span class="pb-arrow">›</span>

          <div class="pb-info-card">
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
              <div class="pb-field pb-hash-tip" @mouseenter="showHashTooltip" @mouseleave="hideHashTooltip">
                <span class="pb-key">Hash</span>
                <button
                  v-if="hashState.kind === 'fingerprint'"
                  class="pb-hash-val"
                  :class="{ copied: hashCopied }"
                  @click="copyHash"
                >{{ hashCopied ? 'Copied' : shortHash }}</button>
                <span v-else-if="hashState.kind === 'legacy'" class="pb-chip intact">✓ On chain</span>
                <span v-else-if="hashState.kind === 'unavailable'" class="pb-chip unknown">Not served</span>
                <span v-else class="pb-chip unknown">Not recorded</span>
              </div>
              <div class="pb-dot">·</div>
              <div v-if="permanence.has" class="pb-field pb-perm-tip" @mouseenter="showPermTooltip" @mouseleave="hidePermTooltip">
                <span class="pb-key">Storage</span>
                <span class="pb-chip permanent">∞ Permanent</span>
              </div>
              <div v-if="permanence.has" class="pb-dot">·</div>
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
        </div>

        <Teleport to="body">
          <div v-if="hashTip.show" class="pb-tip-box" :style="{ top: hashTip.y + 'px', left: hashTip.x + 'px' }">
            <template v-if="hashState.kind === 'fingerprint'">
              <strong>A fingerprint, not the text</strong>
              <p>
                The blockchain carries this value in place of the post's words. Anyone
                holding the text can check it against this and see it has not been altered;
                on its own it reveals nothing. Click to copy it in full.
              </p>
            </template>
            <template v-else-if="hashState.kind === 'legacy'">
              <strong>Text is on the chain</strong>
              <p>This post was published before Serey moved to storing a fingerprint, so its words are written into the block itself and cannot be removed.</p>
            </template>
            <template v-else-if="hashState.kind === 'unavailable'">
              <strong>This node does not serve content</strong>
              <p>
                The RPC node answered with the post's structure but none of its text or
                metadata, so the chain record cannot be read here. What is shown below comes
                from Serey's own storage.
              </p>
            </template>
            <template v-else>
              <strong>Nothing recorded</strong>
              <p>This post's block carries neither its text nor a fingerprint of it, so the chain has nothing to check the words against.</p>
            </template>
          </div>
        </Teleport>

        <Teleport to="body">
          <div v-if="permTip.show" class="pb-tip-box" :style="{ top: permTip.y + 'px', left: permTip.x + 'px' }">
            <strong>Stored permanently</strong>
            <p>This post's text and files were copied to Arweave, a public network with no delete. Not even Serey can remove them. See the copies below.</p>
          </div>
        </Teleport>

        <!-- ── PERMANENT COPIES — full width, directly under the passport bar ── -->
        <section
          v-if="permanence.has"
          class="perm-section"
          v-motion
          :initial="{ opacity: 0, y: -10 }"
          :enter="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26, delay: 120 } }"
        >
          <h3 class="section-hdg"><span class="accent-dot"></span> Permanent copies</h3>
          <p class="perm-lede">Copied to Arweave at publication. Nobody can remove them.</p>

          <div class="perm-list">
            <div v-if="permanence.text" class="perm-row">
              <div class="perm-what">
                <span class="perm-kind">Text</span>
                <span class="perm-name">title and body</span>
              </div>
              <div class="perm-hashes">
                <div v-if="permanence.text.sha256" class="perm-hash">
                  <span class="perm-hash-key">SHA-256</span>
                  <code>{{ permanence.text.sha256 }}</code>
                </div>
              </div>
              <a class="perm-open" :href="arweaveUrl(permanence.text.ar)" target="_blank" rel="noopener noreferrer">Open ↗</a>
            </div>

            <div v-for="file in permanence.media" :key="file.ar" class="perm-row">
              <div class="perm-what">
                <span class="perm-kind">File</span>
                <a v-if="file.url" class="perm-name link" :href="file.url" target="_blank" rel="noopener noreferrer">{{ fileName(file.url) }}</a>
                <span v-else class="perm-name">file</span>
              </div>
              <div class="perm-hashes">
                <div v-if="file.s5" class="perm-hash">
                  <span class="perm-hash-key">S5 CID</span>
                  <code>{{ file.s5 }}</code>
                </div>
              </div>
              <a class="perm-open" :href="arweaveUrl(file.ar)" target="_blank" rel="noopener noreferrer">Open ↗</a>
            </div>
          </div>
        </section>

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
            <header v-if="isComment || displayTitle || textRemoved" class="post-hero">
              <h1 v-if="!isComment && displayTitle" class="post-title">{{ displayTitle }}</h1>
              <template v-else-if="isComment">
                <h1 class="post-title">Comment</h1>
                <div class="comment-breadcrumbs">
                  <router-link v-if="post.depth > 1 && post.parent_author" :to="EXPLORER + '@' + post.parent_author + '/' + post.parent_permlink">← Parent Comment</router-link>
                  <router-link v-if="post.root_author && post.root_permlink" :to="EXPLORER + '@' + post.root_author + '/' + post.root_permlink">↑ Root Post</router-link>
                </div>
              </template>
              <template v-else>
                <h1 class="post-title removed">Text removed</h1>
                <p class="removed-note">Serey no longer serves this post's words. Its record stays on the chain.</p>
              </template>
            </header>

            <div v-if="postVideos.length" class="post-media">
              <video
                v-for="(src, i) in postVideos"
                :key="src"
                class="post-video"
                :src="src"
                :poster="i === 0 ? videoPoster : undefined"
                controls
                playsinline
                preload="metadata"
              ></video>
            </div>

            <article v-if="chainBody" class="post-body" v-html="chainBody"></article>

            <section v-if="serveyCopy" class="db-copy">
              <article class="post-body" v-html="serveyCopy"></article>
            </section>
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
              {{ (post.active_votes || []).length }} Votes
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
      hashTip: { show: false, x: 0, y: 0 },
      hashCopied: false,
      fromOperation: false,
      permTip: { show: false, x: 0, y: 0 },
    }
  },

  computed: {
    authorAvatarStyle() {
      const url = this.authorAvatar || `https://steemitimages.com/u/${this.post.author}/avatar`
      return { backgroundImage: `url(${url})` }
    },

    /*
    | The permanent copies, straight off the post's own metadata.
    |
    | A Forever post carries an `arweave` block written when every copy was
    | confirmed: the text's sha256 (the bytes the chain's commitment was
    | built over) and each file's S5 CID (its BLAKE3 content address), each
    | with the id of its Arweave copy. A post without the block is an
    | ordinary post and this section does not appear.
    */
    /*
    | What the chain actually carries for this post.
    |
    | Since the hash-only change a post's body on chain is a marker plus a
    | keyed fingerprint of the text, not the text: `serey\nc:<commitment>`,
    | with the same value in json_metadata. Older posts still carry their
    | prose and are left alone.
    */
    chainRecord() {
      let meta = {}
      try { meta = JSON.parse(this.post.json_metadata || '{}') } catch (e) { /* */ }
      const commitment = meta.content_commitment || meta.content_sha256 || null
      const hashOnly = Boolean(commitment) || meta.format === 'hash'
      return { hashOnly, commitment, bcVersion: meta.bc_version || null }
    },

    /*
    | Which of the three the chain actually holds for this post: a keyed
    | fingerprint of the text, the text itself (posts from before the
    | change), or nothing at all. The bar used to claim "Intact" for all
    | three without checking anything.
    */
    hashState() {
      if (this.chainRecord.commitment) return { kind: 'fingerprint', value: this.chainRecord.commitment }
      if ((this.post.body || '').trim()) return { kind: 'legacy', value: null }
      // Title, body and metadata all empty means the node answered without
      // any content, not that the post was published without any: every real
      // post carries metadata. Saying "not recorded" there would blame the
      // chain for what this node simply does not serve.
      if (!this.contentServed) return { kind: 'unavailable', value: null }
      return { kind: 'none', value: null }
    },

    // Does this node serve post content at all?
    contentServed() {
      const p = this.post || {}
      return Boolean((p.title || '').trim() || (p.body || '').trim() || (p.json_metadata || '').trim())
    },

    /*
    | The chain's title for a hash-only post is the marker word, not a
    | title -- printing it as the headline reads as a post called "serey".
    */
    // A reply is what the chain's depth says it is. Reading "no title" as
    // "this is a reply" pointed Root Post at @undefined the moment a post
    // had no text left to show.
    isComment() {
      return Number(this.post.depth) > 0
    },

    /*
    | On chain, with nothing readable left. A hash-only post keeps its words
    | off the chain, so its text comes from Serey's copy; once that copy is
    | taken down the post still exists -- author, timestamp, fingerprint, id
    | -- but there is no prose to print. That is worth saying plainly rather
    | than rendering an untitled page.
    */
    textRemoved() {
      if (this.isComment || !this.post.id) return false
      return !this.displayTitle && !this.chainBody && !this.serveyCopy && !this.postVideos.length
    },

    displayTitle() {
      const title = (this.post.title || '').trim()
      if (this.chainRecord.hashOnly && /^serey$/i.test(title)) {
        return (this.postDetail && this.postDetail.title) || ''
      }
      return title
    },

    shortHash() {
      const v = this.hashState.value || ''
      return v.length > 18 ? `${v.slice(0, 10)}…${v.slice(-6)}` : v
    },

    /*
    | What the chain itself carries, which is what an explorer is for.
    |
    | Empty for a hash-only post: its body is the marker plus a fingerprint,
    | not text, and printing that raw reads as a broken post. The block below
    | explains it instead.
    */
    chainBody() {
      const body = this.post.body || ''
      if (this.chainRecord.hashOnly && /^serey\s*\n?\s*c:/i.test(body.trim())) return ''
      return body
    },

    /*
    | Serey's own copy of the text, from the API. Shown under the chain
    | record and labelled as what it is: a database row, not a chain record.
    | For a hash-only post it is the only place the words exist, and it is
    | the copy a takedown destroys.
    */
    /*
    | A video post carries its file in the API's own `videos` field, never in
    | the post HTML: the description holds only the words. Rendering the body
    | alone left such a post looking like it had nothing in it but its title.
    */
    postVideos() {
      const list = (this.postDetail && this.postDetail.videos) || []
      return list.filter(url => typeof url === 'string' && url.trim())
    },

    // Serey generates a still for an uploaded video and files it under the
    // post's images; it is the right poster for the first player.
    videoPoster() {
      const list = (this.postDetail && this.postDetail.image_url) || []
      return list.find(url => typeof url === 'string' && url.trim()) || ''
    },

    serveyCopy() {
      const fromApi = this.postDetail && this.postDetail.description
      if (!fromApi) return ''
      // Shown whenever the chain is not already printing the same prose --
      // a hash-only post, or one whose chain record carries no body at all.
      if (this.chainBody) return ''
      return fromApi
    },

    permanence() {
      let meta = {}
      try { meta = JSON.parse(this.post.json_metadata || '{}') } catch (e) { /* */ }
      const block = meta && meta.arweave
      if (!block) return { has: false, text: null, media: [] }

      const text = block.post && block.post.ar ? block.post : null
      const media = (block.media || []).filter((m) => m && m.ar)
      return { has: Boolean(text || media.length), text, media }
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
    /*
    | The post's own comment operation, read back from the author's account
    | history and merged onto the record.
    |
    | An edit broadcasts another comment op for the same permlink, so the
    | newest one wins -- history comes back oldest first, and the last match
    | is what the chain settled on. `fromOperation` marks where it came from;
    | it is still chain data, just a different call.
    */
    async fillFromOperation(author, permlink) {
      let history
      try {
        history = await this.steem_database_call('get_account_history', [author, -1, 100])
      } catch (e) {
        return
      }
      if (!Array.isArray(history)) return

      let op = null
      for (const entry of history) {
        const o = entry && entry[1] && entry[1].op
        if (!o || o[0] !== 'comment') continue
        if (o[1].author === author && o[1].permlink === permlink) op = o[1]
      }
      if (!op) return

      this.post = {
        ...this.post,
        title: op.title || this.post.title,
        body: op.body || this.post.body,
        json_metadata: op.json_metadata || this.post.json_metadata,
      }
      this.fromOperation = true
    },

    async copyHash() {
      const value = this.hashState.value
      if (!value) return
      try {
        await navigator.clipboard.writeText(value)
      } catch (e) {
        return
      }
      this.hashCopied = true
      setTimeout(() => { this.hashCopied = false }, 1400)
    },
    arweaveUrl(id) {
      return `https://arweave.net/${id}`
    },
    fileName(url) {
      try { return decodeURIComponent(String(url).split('/').pop()) } catch (e) { return url }
    },
    showPermTooltip(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      this.permTip = { show: true, x: rect.left + rect.width / 2, y: rect.bottom + 10 }
    },
    hidePermTooltip() {
      this.permTip.show = false
    },
    showHashTooltip(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      this.hashTip = { show: true, x: rect.left + rect.width / 2, y: rect.bottom + 10 }
    },
    hideHashTooltip() {
      this.hashTip.show = false
    },

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

      // This node's content index answers with empty title, body and
      // metadata for every post, while the block that carries them is
      // intact. The operation itself is the chain record, so read that
      // instead rather than reporting nothing.
      if (!this.contentServed) await this.fillFromOperation(author, permlink)

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
  overflow-x: hidden;
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
  grid-template-rows: auto auto auto;
  gap: 1rem 2rem;
  align-items: start;
}

/* Passport spans both columns in the first row */
.post-layout > .passport-bar {
  grid-column: 1 / -1;
  grid-row: 1;
}

/* Permanent copies sits right under the passport, spanning both columns */
.post-layout > .perm-section {
  grid-column: 1 / -1;
  grid-row: 2;
}

.post-layout > .post-sidebar {
  grid-column: 1;
  grid-row: 3;
}

.post-layout > .post-main {
  grid-column: 2;
  grid-row: 3;
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
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
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


/* ── Content Passport ── */
.passport-bar {
  display: flex;
  align-items: stretch;
  gap: .75rem;
  flex-wrap: nowrap;
  margin-bottom: 1rem;
  font-family: 'Outfit', sans-serif;
}

/* Left: deep navy brand label — standalone card, no red border */
.pb-brand {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: 0 1.3rem;
  background: linear-gradient(150deg, #0e0e52 0%, #192bc2 100%);
  border-radius: 12px;
  flex-shrink: 0;
}

/* Right: info card with red gradient border + glow */
.pb-info-card {
  display: flex;
  align-items: stretch;
  flex: 1;
  border: 2.5px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(#dc143c, #dc143c) border-box;
  border-radius: 12px;
  min-height: 52px;
  box-shadow: 0 2px 16px rgba(14,14,82,.08);
}
.pb-arrow {
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  color: #192bc2;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
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
.pb-chip.unknown { background: #eef5fb; color: #5878a0; border: 1px solid #c8dff0; }
.pb-chip.permanent { background: #6d28d9; color: #ffffff; }

.pb-hash-val {
  padding: .17em .55em;
  border: 1px solid #c8dff0;
  border-radius: 4px;
  background: #eef5fb;
  color: #2c4a6b;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .01em;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.pb-hash-val:hover { background: #dbe9f6; }
.pb-hash-val.copied {
  background: #192bc2;
  border-color: #192bc2;
  color: #ffffff;
}

.post-title.removed { color: #5878a0; }

.removed-note {
  margin: .5rem 0 0;
  font-size: .86rem;
  color: #8aa4bf;
}

/* Video posts */
.post-media {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.35rem;
}

.post-video {
  display: block;
  width: 100%;
  max-height: 70vh;
  border-radius: 10px;
  background: #0b1220;
}

/* What the chain stores */
.db-copy {
  padding-top: 1.5rem;
  border-top: 1px solid #eef2f7;
}

/* Permanent copies */
.pb-perm-tip { cursor: default; }

.perm-section {
  padding: 1.15rem 1.35rem 1.35rem;
  background: #ffffff;
  border: 1px solid #c8dff0;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(14,14,82,.04), 0 4px 16px rgba(14,14,82,.06);
}

.perm-section .section-hdg { margin-bottom: .5rem; }

.perm-lede {
  margin: 0 0 .75rem;
  color: #7e97b4;
  font-size: .82rem;
}

.perm-list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.perm-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: .6rem .85rem;
  border: 1px solid #e6eef7;
  border-radius: 8px;
  background: #fbfcfe;
}

.perm-what {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  min-width: 11rem;
}

.perm-kind {
  font-family: 'Outfit', sans-serif;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: #5878a0;
}

.perm-name { color: #2c4a6b; font-size: .9rem; }
.perm-name.link { color: #192bc2; text-decoration: none; }
.perm-name.link:hover { text-decoration: underline; }

.perm-hashes { flex: 1 1 18rem; min-width: 0; }

.perm-hash {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  min-width: 0;
}

.perm-hash-key {
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .05em;
  color: #8aa4bf;
  white-space: nowrap;
}

.perm-hash code {
  font-size: .74rem;
  color: #5878a0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.perm-open {
  margin-left: auto;
  font-size: .8rem;
  font-weight: 700;
  color: #192bc2;
  text-decoration: none;
  white-space: nowrap;
}
.perm-open:hover { text-decoration: underline; }

/* Hash tooltip */
.pb-hash-tip { cursor: default; }

.pb-tip-box {
  position: fixed;
  transform: translateX(-50%);
  width: 230px;
  background: #0e0e52;
  color: #e8eeff;
  border-radius: 10px;
  padding: .75rem 1rem;
  font-size: .75rem;
  line-height: 1.5;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 6px 24px rgba(14,14,82,.25);
}
.pb-tip-box::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #0e0e52;
}
.pb-tip-box strong {
  display: block;
  color: #78c0e0;
  font-size: .78rem;
  margin-bottom: .35rem;
}
.pb-tip-box p { margin: 0; }

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
  border-radius: 0 9.5px 9.5px 0;
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
    grid-template-rows: auto auto auto auto;
    padding: .75rem .75rem 3rem;
    gap: .85rem;
  }
  .post-layout > .passport-bar  { grid-column: 1 !important; grid-row: 1; }
  .post-layout > .perm-section  { grid-column: 1 !important; grid-row: 2; }
  .post-layout > .post-main     { grid-column: 1 !important; grid-row: 3; }
  .post-layout > .post-sidebar  { grid-column: 1 !important; grid-row: 4; }

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
    flex-direction: column;
    margin-bottom: 0;
    gap: .5rem;
    width: 100%;
    min-width: 0;
  }
  .pb-arrow { display: none; }
  .pb-brand {
    flex: unset;
    padding: .55rem .9rem;
    min-height: 40px;
    border-radius: 10px;
  }
  .pb-info-card {
    flex-direction: column;
    min-height: unset;
    border-radius: 10px;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  /* Scrollable fields row */
  .pb-fields {
    flex: 1 1 auto;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: .55rem .9rem;
    border-left: none;
    background: #f4f9fd;
    gap: .5rem;
    mask-image: linear-gradient(to right, black 80%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
    justify-content: flex-start;
  }
  .pb-fields::-webkit-scrollbar { display: none; }
  .pb-dot { margin: 0 .3rem; }

  /* Share button at bottom of info card */
  .pb-share {
    flex: unset;
    width: 100%;
    padding: .5rem .9rem;
    min-height: 40px;
    border-left: none;
    border-top: 1.5px solid #c8dff0;
    border-radius: 0 0 9.5px 9.5px;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .skeleton-sidebar,
  .post-sidebar { grid-template-columns: 1fr; }

  .post-layout { padding: .6rem .6rem 2.5rem; }

  .post-title { font-size: 1.45rem; }
  .post-hero  { padding: .9rem .9rem .75rem; }
  .post-body  { padding: .5rem .9rem 1.25rem; font-size: .95rem; line-height: 1.75; }

  /* Tighter passport bar */
  .pb-brand  { padding: .5rem .75rem; }
  .pb-share  { padding: .45rem .75rem; }
  .pb-fields { padding: .5rem .75rem; }
  .pb-title  { font-size: .6rem; }
  .pb-key    { font-size: .6rem; }
  .pb-val    { font-size: .8rem; }
}
</style>
