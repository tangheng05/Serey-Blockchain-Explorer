<template>
  <div class="post-page">
    <!-- Reading progress bar -->
    <div class="progress-bar" :style="{ transform: `scaleX(${readProgress / 100})` }"></div>

    <AppHeader ref="appHeader" />

    <!-- Loading skeleton -->
    <Transition name="fade-out" mode="out-in">
      <div v-if="!exists && loadFailed" class="load-failed" key="failed">
        <p>This post could not be loaded. Check your connection and try again.</p>
        <button type="button" class="load-failed-btn" @click="fetchData">Retry</button>
      </div>
      <div v-else-if="!exists" class="skeleton-layout" key="skeleton">
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
              <div v-if="permanence.has || foreverPending" class="pb-field pb-perm-tip" @mouseenter="showPermTooltip" @mouseleave="hidePermTooltip">
                <span class="pb-key">Storage</span>
                <button v-if="archiving" type="button" class="pb-chip archiving" @click="scrollToPermanence"><span class="pulse-dot"></span>Archiving</button>
                <button v-else type="button" class="pb-chip permanent" @click="scrollToPermanence">∞ Permanent</button>
              </div>
              <div v-if="permanence.has || foreverPending" class="pb-dot">·</div>
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
            <template v-if="archiving">
              <strong>Being archived</strong>
              <p>This post's text and files have been sent to Arweave and are waiting for the network to confirm them. Once confirmed, nobody can remove them.</p>
            </template>
            <template v-else>
              <strong>Stored permanently</strong>
              <p>This post's text and files were copied to Arweave, a public network with no delete. Not even Serey can remove them. See the copies below.</p>
            </template>
          </div>
        </Teleport>

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
            <a :href="serreyLink" target="_blank" rel="noopener" class="btn-serey">
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
            <div class="meta-eyebrow">{{ podcast ? 'Episode Info' : post.depth === 0 ? 'Post Info' : 'Comment Info' }}</div>
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
            <header v-if="isComment || headline || textRemoved" class="post-hero">
              <h1 v-if="!isComment && headline" class="post-title">{{ headline }}</h1>
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

            <div v-if="podcast && podcast.audio" class="post-media post-media--audio">
              <audio class="post-audio" :src="podcast.audio" controls preload="metadata"></audio>
            </div>

            <div v-if="postImages.length" class="post-gallery">
              <div
                class="gallery-stage"
                :class="{ multi: postImages.length > 1 }"
                @touchstart.passive="onGalleryTouchStart"
                @touchend.passive="onGalleryTouchEnd"
              >
                <a
                  v-for="(src, i) in postImages"
                  v-show="i === galleryIndex"
                  :key="src"
                  class="gallery-slide"
                  :href="src"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img :src="src" :alt="`Image ${i + 1} of ${postImages.length}`" :loading="i === 0 ? 'eager' : 'lazy'" />
                </a>
                <template v-if="postImages.length > 1">
                  <span class="gallery-count">{{ galleryIndex + 1 }}/{{ postImages.length }}</span>
                  <button type="button" class="gallery-nav prev" :disabled="galleryIndex === 0" aria-label="Previous image" @click="showImage(galleryIndex - 1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button type="button" class="gallery-nav next" :disabled="galleryIndex === postImages.length - 1" aria-label="Next image" @click="showImage(galleryIndex + 1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                  <div class="gallery-dots">
                    <button
                      v-for="(src, i) in postImages"
                      :key="src"
                      type="button"
                      :class="{ active: i === galleryIndex }"
                      :aria-label="`Show image ${i + 1}`"
                      @click="showImage(i)"
                    ></button>
                  </div>
                </template>
              </div>
            </div>

            <article v-if="chainBody" class="post-body" v-html="chainBody"></article>

            <section v-if="serveyCopy" class="db-copy">
              <article class="post-body" v-html="serveyCopy"></article>
            </section>
          </div>

          <!-- Comments: each with its own fingerprint on chain -->
          <template v-if="!isComment">
            <div class="post-divider"></div>
            <section
              class="comment-section"
              v-motion
              :initial="{ opacity: 0, y: 40 }"
              :visible-once="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26, delay: 60 } }"
            >
              <h3 class="section-hdg">
                <span class="accent-dot"></span>
                {{ commentCount }} {{ commentCount === 1 ? 'Comment' : 'Comments' }}
              </h3>
              <post-comments
                :author="post.author"
                :permlink="post.permlink"
                :api-replies="apiReplies"
                :api-available="apiAvailable"
                @count="commentCount = $event"
              />
            </section>
          </template>

          <template v-if="permanence.has || foreverPending">
            <div class="post-divider"></div>
            <section
              ref="permSection"
              class="perm-section"
              v-motion
              :initial="{ opacity: 0, y: 18 }"
              :visible-once="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } }"
            >
              <h3 class="section-hdg">
                <span class="accent-dot"></span> Permanent copies
                <span v-if="archiving" class="perm-status archiving"><span class="pulse-dot"></span>Archiving</span>
                <span v-else-if="arweave.state === 'permanent'" class="perm-status confirmed">✓ Confirmed</span>
              </h3>
              <p v-if="foreverPending" class="perm-lede">
                Serey is copying this post's text and files to Arweave. Once every copy is accepted, the post is re-recorded on the chain with their IDs and they appear here. The page checks again automatically.
              </p>
              <p v-else-if="archiving" class="perm-lede">
                Uploaded and waiting for the Arweave network to confirm. This usually takes a few minutes; the page checks again automatically.
              </p>

              <div v-if="permanence.has" class="perm-list">
                <div v-if="permanence.text" class="perm-row">
                  <media-thumb kind="text" />
                  <div class="perm-what">
                    <span class="perm-name">
                      Post text
                      <span v-if="arweave.state !== 'unknown'" class="perm-state" :class="arweave.confirmed[permanence.text.ar] ? 'ok' : 'pending'">{{ arweave.confirmed[permanence.text.ar] ? 'Confirmed' : 'Pending' }}</span>
                    </span>
                    <span class="perm-sub">Title and body, exactly as published</span>
                  </div>
                  <div class="perm-hash">
                    <template v-if="permanence.text.sha256">
                      <span class="perm-hash-key">SHA-256 fingerprint</span>
                      <button
                        type="button"
                        class="perm-hash-val"
                        :class="{ copied: copiedPerm === permanence.text.sha256 }"
                        :title="permanence.text.sha256"
                        @click="copyPerm(permanence.text.sha256)"
                      >
                        <code>{{ shortDigest(permanence.text.sha256) }}</code>
                        <span class="perm-copy">{{ copiedPerm === permanence.text.sha256 ? 'Copied' : 'Copy' }}</span>
                      </button>
                    </template>
                  </div>
                  <a class="perm-open" :href="arweaveUrl(permanence.text.ar)" target="_blank" rel="noopener noreferrer">
                    View on Arweave
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
                  </a>
                </div>

                <div v-for="file in foreverFiles" :key="file.ar" class="perm-row">
                  <media-thumb :src="file.thumb" :kind="file.visual" :href="file.url" :title="fileName(file.url)" />
                  <div class="perm-what">
                    <span class="perm-name">
                      {{ file.label }}
                      <span v-if="arweave.state !== 'unknown'" class="perm-state" :class="arweave.confirmed[file.ar] ? 'ok' : 'pending'">{{ arweave.confirmed[file.ar] ? 'Confirmed' : 'Pending' }}</span>
                    </span>
                    <span class="perm-sub">Attached to the post</span>
                  </div>
                  <div class="perm-hash">
                    <template v-if="file.s5">
                      <span class="perm-hash-key">S5 content ID</span>
                      <button
                        type="button"
                        class="perm-hash-val"
                        :class="{ copied: copiedPerm === file.s5 }"
                        :title="file.s5"
                        @click="copyPerm(file.s5)"
                      >
                        <code>{{ shortDigest(file.s5) }}</code>
                        <span class="perm-copy">{{ copiedPerm === file.s5 ? 'Copied' : 'Copy' }}</span>
                      </button>
                    </template>
                  </div>
                  <a class="perm-open" :href="arweaveUrl(file.ar)" target="_blank" rel="noopener noreferrer">
                    View on Arweave
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
                  </a>
                </div>
              </div>

              <p v-if="permanence.has" class="perm-note">
                A matching fingerprint means the Arweave copy is identical to what was published. Click one to copy it.
              </p>
            </section>
          </template>

          <!-- Content IDs: the S5 address of each file, from Serey's storage -->
          <template v-if="mediaCids.length">
            <div class="post-divider"></div>
            <section
              class="perm-section"
              v-motion
              :initial="{ opacity: 0, y: 18 }"
              :visible-once="{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } }"
            >
              <h3 class="section-hdg"><span class="accent-dot"></span> Content IDs</h3>

              <div class="perm-list">
                <div v-for="row in mediaCids" :key="row.key" class="perm-row cid-row">
                  <media-thumb :src="row.thumb" :kind="row.visual" :href="row.url" :title="row.file" />
                  <div class="perm-what">
                    <span class="perm-name">{{ row.label }}</span>
                    <span class="perm-sub">{{ cidRowLabel(row) }}</span>
                  </div>
                  <div class="perm-hash">
                    <span class="perm-hash-key">S5 content ID</span>
                    <button
                      type="button"
                      class="perm-hash-val"
                      :class="{ copied: copiedPerm === row.cid }"
                      :title="row.cid"
                      @click="copyPerm(row.cid)"
                    >
                      <code>{{ shortDigest(row.cid) }}</code>
                      <span class="perm-copy">{{ copiedPerm === row.cid ? 'Copied' : 'Copy' }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <p class="perm-note">
                A content ID is an address made from the file's own bytes: it encodes the file's BLAKE3 hash. Hash a copy of the file and compare. A match means it is the file Serey stored. Click one to copy it.
              </p>
            </section>
          </template>

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
import PostComments from '@/components/explorer/PostComments'
import Beneficiaries from '@/components/explorer/Beneficiaries'
import { useChainProperties } from '@/composables/useChainProperties.js'
import { useRPCNode } from '@/composables/useRPCNode.js'
import { useAlertsStore } from '@/stores/alerts.js'
import MediaThumb from '@/components/explorer/MediaThumb'
import { cidRows, describeMedia, numberLabels } from '@/utils/mediaCids.js'
import axios from 'axios'

export default {
  name: 'Post',
  components: { AppHeader, CardData, Votes, Beneficiaries, PostComments, MediaThumb },

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
      forever: null,
      // What Serey's storage reports for each file of the post: [{ kind, file, s5_cid, s5_thumb_cid }].
      mediaProof: [],
      apiReplies: [],
      apiAvailable: false,
      commentCount: 0,
      postGenerals: {},
      payout: { total: '', card: {} },
      sereyPrice: null,
      exists: false,
      loadFailed: false,
      showRaw: false,
      readProgress: 0,
      authorAvatar: '',
      EXPLORER: Config.EXPLORER,
      hashTip: { show: false, x: 0, y: 0 },
      hashCopied: false,
      copiedPerm: null,
      // Whether Arweave has actually confirmed each copy. 'unknown' until the
      // gateway answers (or if it never does), then 'archiving' / 'permanent'.
      arweave: { state: 'unknown', confirmed: {} },
      fromOperation: false,
      permTip: { show: false, x: 0, y: 0 },
      galleryIndex: 0,
      // A podcast episode: Serey's episode row (audio or video file, cover, words) and
      // the episode's page on its show.
      podcast: null,
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
      return Number(this.post.depth) > 0 && !this.podcast
    },

    // Episodes carry { podcast: { id, community_id } } in their chain metadata.
    podcastRef() {
      let meta = {}
      try { meta = JSON.parse(this.post.json_metadata || '{}') } catch (e) { /* */ }
      const ref = meta && meta.podcast
      return ref && ref.id ? ref : null
    },

    serreyLink() {
      if (this.podcast) return this.podcast.link
      return `https://serey.io/authors/${this.post.author}/${this.post.permlink}`
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
      return !this.displayTitle && !this.chainBody && !this.serveyCopy && !this.postVideos.length && !this.postImages.length
    },

    displayTitle() {
      const title = (this.post.title || '').trim()
      if (this.chainRecord.hashOnly && /^serey$/i.test(title)) {
        return this.plainText(this.postDetail && this.postDetail.title)
      }
      return this.plainText(title)
    },

    /*
    | A gallery or video post has no title of its own: Serey fills the field
    | with the caption (or its opening), so printing both shows the same
    | words twice. The feed shows only the caption under the media; so does
    | this page. Articles keep their headline whatever their first line says.
    */
    headline() {
      const title = this.displayTitle
      if (!title || !(this.postImages.length || this.postVideos.length)) return title
      const letters = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
      const caption = letters(this.plainText(this.chainBody || this.serveyCopy))
      const head = letters(title)
      return head && caption.startsWith(head) ? '' : title
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
      return this.trimTrailingBlanks(body)
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

    /*
    | A gallery post, like a video post, keeps its pictures out of the HTML:
    | the API files them under `image_url` and the description is only the
    | caption. For an article the same field holds a re-hosted copy of its
    | cover, already printed inline under another URL, so it is shown only
    | when the body carries no images of its own. The chain's `arweave`
    | block lists the same files and stands in when the API is unreachable.
    */
    postImages() {
      if (this.postVideos.length) return []
      if (/<img\b/i.test(this.chainBody + this.serveyCopy)) return []

      const fromApi = (this.postDetail && this.postDetail.image_url) || []
      const fromChain = this.permanence.media.map(m => m.url).filter(url => this.isImage(url))
      const seen = new Set()
      return [...fromApi, ...fromChain].filter((url) => {
        if (typeof url !== 'string' || !url.trim() || seen.has(url)) return false
        seen.add(url)
        // Serey's stand-in cover for a post with no picture at all.
        return !/\/thumbnails\/thumbnail\.png$/i.test(url)
      })
    },

    serveyCopy() {
      const fromApi = this.postDetail && this.postDetail.description
      if (!fromApi) return ''
      // Shown whenever the chain is not already printing the same prose --
      // a hash-only post, or one whose chain record carries no body at all.
      if (this.chainBody) return ''
      return this.trimTrailingBlanks(fromApi)
    },

    archiving() {
      return (this.permanence.has && this.arweave.state === 'archiving') || this.foreverPending
    },

    // Serey has a Forever request but the chain edit carrying the ids has not landed yet.
    foreverPending() {
      return !this.permanence.has && Boolean(this.forever) && this.forever.status !== 'failed'
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

    // Addresses the page already knows, so a Content IDs row can link to its file.
    mediaUrls() {
      const d = this.postDetail || {}
      return [...(d.image_url || []), ...(d.videos || []), ...this.permanence.media.map(m => m.url)]
    },

    // Not on the chain for an ordinary post. A Forever post's `s5` ids are
    // already under Permanent copies, so they are left out here.
    mediaCids() {
      return cidRows(this.mediaProof, {
        urls: this.mediaUrls,
        shown: this.permanence.media.map(m => m.s5),
      })
    },

    // Permanent copies of files, drawn like the Content IDs rows.
    foreverFiles() {
      return numberLabels(this.permanence.media.map(m => ({ ...m, ...describeMedia(m.url) })))
    },

  },

  watch: { '$route': 'fetchData' },

  created() {
    // Chain properties are not needed to show a post; never let a slow or
    // failing call hold the page on the skeleton.
    this.getChainProperties().catch(() => { /* */ })
    this.fetchData()
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
    this.stopArweaveCheck()
    this.stopForeverPoll()
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
    /*
    | Ask the Arweave gateway which copies are actually in a block. The
    | chain's `arweave` block is written as soon as the upload is accepted,
    | which can be well before the network has mined it. Until every copy
    | has a block the post is still "archiving", the same state Serey shows.
    | Items are bundled, so /tx/<id>/status knows nothing about them; the
    | GraphQL index does.
    */
    async checkArweave() {
      const ids = [
        this.permanence.text && this.permanence.text.ar,
        ...this.permanence.media.map(m => m.ar),
      ].filter(Boolean)
      if (!ids.length) return

      const query = `{ transactions(ids: ${JSON.stringify(ids)}) { edges { node { id block { height } } } } }`
      let edges
      try {
        const res = await axios.post('https://arweave.net/graphql', { query }, { timeout: 15000 })
        edges = res.data && res.data.data && res.data.data.transactions && res.data.data.transactions.edges
      } catch (e) {
        return
      }
      if (!Array.isArray(edges)) return

      const confirmed = {}
      for (const { node } of edges) {
        if (node && node.block && node.block.height) confirmed[node.id] = true
      }
      const all = ids.every(id => confirmed[id])
      this.arweave = { state: all ? 'permanent' : 'archiving', confirmed }

      if (!all) this._arweaveTimer = setTimeout(() => this.checkArweave(), 60000)
    },
    stopArweaveCheck() {
      clearTimeout(this._arweaveTimer)
      this._arweaveTimer = null
    },
    async pollForever(author, permlink) {
      let res
      try {
        res = await this.fetchDetail(author, permlink)
      } catch (e) {
        this.scheduleForeverPoll(author, permlink)
        return
      }
      if (this.$route.params.account !== author || this.$route.params.permlink !== permlink) return
      this.forever = res.data.forever || null
      if (!this.forever || this.forever.status === 'failed') return

      if (this.forever.status === 'published') {
        try {
          const fresh = await this.steem_database_call('get_content', [author, permlink])
          this.post = { ...this.post, title: fresh.title, body: fresh.body, json_metadata: fresh.json_metadata }
          if (!this.contentServed) await this.fillFromOperation(author, permlink)
        } catch (e) { /* */ }
        if (this.permanence.has) {
          this.checkArweave()
          return
        }
        // A chain edit that failed never lands; stop asking after ~10 minutes.
        this._foreverChainTries = (this._foreverChainTries || 0) + 1
        if (this._foreverChainTries > 10) return
      }
      this.scheduleForeverPoll(author, permlink)
    },
    scheduleForeverPoll(author, permlink) {
      this._foreverTimer = setTimeout(() => this.pollForever(author, permlink), 60000)
    },
    stopForeverPoll() {
      clearTimeout(this._foreverTimer)
      this._foreverTimer = null
      this._foreverChainTries = 0
    },

    // Some clients store the title as editor HTML (`<p>…</p>`); a headline is
    // text, so drop the tags and decode entities. DOMParser runs no scripts.
    plainText(html) {
      const value = String(html || '')
      if (!/[<&]/.test(value)) return value.trim()
      const doc = new DOMParser().parseFromString(value, 'text/html')
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
    },

    // Editors leave `<p><br></p>` / `<p>&nbsp;</p>` at the end of a post;
    // each one renders as a blank line under the last real block.
    trimTrailingBlanks(html) {
      return String(html || '').replace(/(?:\s*<(p|div)[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>)+\s*$/gi, '')
    },
    arweaveUrl(id) {
      return `https://arweave.net/${id}`
    },
    isImage(url) {
      return /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(String(url || '').split('?')[0])
    },
    shortDigest(value) {
      const v = String(value || '')
      return v.length > 22 ? `${v.slice(0, 10)}…${v.slice(-8)}` : v
    },
    async copyPerm(value) {
      if (!value) return
      try {
        await navigator.clipboard.writeText(value)
      } catch (e) {
        return
      }
      this.copiedPerm = value
      clearTimeout(this._permCopyTimer)
      this._permCopyTimer = setTimeout(() => { this.copiedPerm = null }, 1400)
    },
    fileName(url) {
      try { return decodeURIComponent(String(url).split('/').pop()) } catch (e) { return url }
    },
    cidRowLabel(row) {
      return row.role === 'poster' ? 'Poster frame of the video' : 'Attached to the post'
    },
    // Fire-and-forget: any failure (older API, 404, storage down) just leaves
    // the section out.
    async loadMediaProof(author, permlink) {
      try {
        const res = await axios.get(
          `https://global-api.serey.io/api/v2/media-proof/posts/${encodeURIComponent(author)}/${encodeURIComponent(permlink)}`,
          { timeout: 10000 },
        )
        // The reader may have moved to another post meanwhile.
        if (this.$route.params.account !== author || this.$route.params.permlink !== permlink) return
        this.mediaProof = Array.isArray(res.data && res.data.media) ? res.data.media : []
      } catch (e) { /* the section stays out */ }
    },
    showPermTooltip(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      this.permTip = { show: true, x: rect.left + rect.width / 2, y: rect.bottom + 10 }
    },
    hidePermTooltip() {
      this.permTip.show = false
    },
    scrollToPermanence() {
      this.hidePermTooltip()
      const el = this.$refs.permSection
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    showHashTooltip(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      this.hashTip = { show: true, x: rect.left + rect.width / 2, y: rect.bottom + 10 }
    },
    hideHashTooltip() {
      this.hashTip.show = false
    },

    showImage(i) {
      this.galleryIndex = Math.max(0, Math.min(this.postImages.length - 1, i))
    },
    onGalleryTouchStart(e) {
      this._galleryTouchX = e.changedTouches[0].clientX
    },
    // A horizontal swipe of more than 40px turns the page, like the feed.
    onGalleryTouchEnd(e) {
      if (this._galleryTouchX == null) return
      const dx = e.changedTouches[0].clientX - this._galleryTouchX
      this._galleryTouchX = null
      if (Math.abs(dx) > 40) this.showImage(this.galleryIndex + (dx < 0 ? 1 : -1))
    },

    sharePost() {
      if (navigator.share) {
        navigator.share({ title: this.displayTitle || 'Serey Post', url: window.location.href })
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
      this.loadFailed = false
      this.readProgress = 0
      this.authorAvatar = ''
      this.galleryIndex = 0

      try {
        await this.loadPost(author, permlink)
      } catch (e) {
        console.error('Post load failed', e)
        this.loadFailed = true
      }
    },

    /*
    | Serey's copy of a podcast episode, shaped like a post's API copy so the page
    | renders it the same way: title, description, cover, and the uploaded file
    | (video in the player, audio in its own player). A members-only episode comes
    | without its file, so it shows the words only.
    */
    async loadPodcast(ref) {
      try {
        const res = await axios.get(`https://global-api.serey.io/api/v2/podcast/get-by-id/${encodeURIComponent(ref.id)}`, { timeout: 10000 })
        const ep = res.data && res.data.podcast
        if (!ep) return
        const escape = (t) => String(t || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
        const file = ep.content_url || ''
        this.postDetail = {
          title: ep.title || '',
          description: escape(ep.description).replace(/\n/g, '<br />'),
          videos: ep.content_type === 'video' && file ? [file] : [],
          image_url: ep.thumbnail_url ? [ep.thumbnail_url] : [],
        }
        this.apiAvailable = true
        this.podcast = {
          id: ep.id,
          audio: ep.content_type === 'audio' ? file : '',
          link: 'https://serey.io/podcast',
        }
        this.podcastShowLink(ep.community_id, ep.id)
      } catch (e) {
        // The chain record still shows; only Serey's copy is missing.
      }
    },

    // The episode on its own show's page; the global podcast page until the show is found.
    async podcastShowLink(communityId, episodeId) {
      try {
        const res = await axios.get('https://global-api.serey.io/api/v2/general/get-communities', { timeout: 10000 })
        const all = []
        const walk = (list) => (list || []).forEach((c) => { all.push(c); walk(c.child_communities) })
        walk(res.data && res.data.globals)
        walk(res.data && res.data.locals)
        const show = all.find((c) => Number(c.id) === Number(communityId))
        if (show && show.dns && this.podcast) this.podcast = { ...this.podcast, link: `https://${show.dns}/podcast?episode=${episodeId}` }
      } catch (e) { /* keeps the global link */ }
    },

    fetchDetail(author, permlink) {
      return axios.get(`https://global-api.serey.io/api/v1/sereyweb/getDetailByPermlink?permlink=${permlink}&authorName=${author}`, { timeout: 10000 })
    },

    async loadPost(author, permlink) {
      this.stopForeverPoll()
      const [postDetailRes, result] = await Promise.allSettled([
        this.fetchDetail(author, permlink),
        this.steem_database_call('get_content', [author, permlink]),
      ])

      this.apiReplies = []
      this.apiAvailable = false
      this.forever = null
      this.mediaProof = []
      if (postDetailRes.status === 'fulfilled') {
        this.postDetail = postDetailRes.value.data.content
        this.forever = postDetailRes.value.data.forever || null
        this.apiReplies = postDetailRes.value.data.replies || []
        this.apiAvailable = Boolean(this.postDetail)
      }

      if (result.status !== 'fulfilled') {
        this.loadFailed = true
        return
      }
      const post = result.value
      this.post = post

      // Avatar fetched fire-and-forget — updates reactively when done
      this.fetchAuthorAvatar(author)

      // This node's content index answers with empty title, body and
      // metadata for every post, while the block that carries them is
      // intact. The operation itself is the chain record, so read that
      // instead rather than reporting nothing.
      if (!this.contentServed) await this.fillFromOperation(author, permlink)

      // A podcast episode is not a blog post, so the post lookup finds nothing: read the episode.
      this.podcast = null
      if (!this.apiAvailable && this.podcastRef) await this.loadPodcast(this.podcastRef)

      this.stopArweaveCheck()
      this.arweave = { state: 'unknown', confirmed: {} }
      this.checkArweave()
      if (this.foreverPending) this.scheduleForeverPoll(author, permlink)

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

      // Show the post now; the price only decorates it and fills in later.
      this.exists = true
      if (!this.isComment) this.loadMediaProof(author, permlink)

      try {
        const priceRes = await axios.get('https://global-api.serey.io/api/v1/general/get_serey_price', { timeout: 10000 })
        this.sereyPrice = priceRes.data.price
      } catch (e) { /* */ }
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
/* Sits on the header's bottom border, not the viewport's top edge: Safari 26
   (and Telegram's in-app browser on iOS) colours its see-through top bar from
   the fixed element touching that edge. A gradient bar there gives it nothing
   to sample, so the page shows through above the header. */
.progress-bar {
  position: fixed;
  top: 58px;
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

.load-failed { padding: 3rem 1rem; text-align: center; }
.load-failed-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1.5rem;
  border: 0;
  border-radius: 999px;
  background: #0d0f5c;
  color: #fff;
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
  padding: 0.75rem 2.5rem 1.75rem;
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

/* No stacked margins after the last block, so an image that closes the
   post sits on the card's own padding instead of a wall of empty space. */
.post-body :deep(> :last-child),
.post-body :deep(> :last-child > img:last-child) { margin-bottom: 0; }

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
.pb-chip.permanent { background: #6d28d9; color: #ffffff; border: 0; cursor: pointer; transition: background .15s ease; }
.pb-chip.permanent:hover { background: #5b21b6; }
.pb-chip.archiving {
  gap: .4em;
  background: #fff4d6;
  color: #9a5b00;
  border: 1px solid #f3d38a;
  cursor: pointer;
  transition: background .15s ease;
}
.pb-chip.archiving:hover { background: #ffe9b3; }

.pulse-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e0a100;
  animation: perm-pulse 1.4s ease-in-out infinite;
}
@keyframes perm-pulse {
  0%, 100% { opacity: .35; transform: scale(.85); }
  50%      { opacity: 1;   transform: scale(1); }
}

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

.post-media--audio {
  padding: 4px 0 8px;
}

.post-audio {
  display: block;
  width: 100%;
}

.post-video {
  display: block;
  width: 100%;
  max-height: 70vh;
  border-radius: 10px;
  background: #0b1220;
}

/* Gallery posts — full card width, under the title */
.post-gallery { margin-bottom: 1.1rem; }

.gallery-stage {
  position: relative;
  background: #0b1220;
  overflow: hidden;
}

.gallery-slide { display: block; }

.gallery-slide img {
  display: block;
  width: 100%;
  max-height: 72vh;
  object-fit: contain;
}

/* Several pictures share one frame so the caption does not jump between them */
.gallery-stage.multi .gallery-slide img { height: min(72vh, 560px); }

.gallery-count {
  position: absolute;
  top: .75rem;
  right: .75rem;
  padding: .2rem .55rem;
  border-radius: 999px;
  background: rgba(11,18,32,.72);
  color: #fff;
  font: 600 .78rem 'Outfit', sans-serif;
  pointer-events: none;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,.92);
  color: #0e0e52;
  box-shadow: 0 2px 10px rgba(0,0,0,.25);
  cursor: pointer;
  transition: opacity .15s, transform .15s;
}
.gallery-nav svg { width: 18px; height: 18px; }
.gallery-nav.prev { left: .75rem; }
.gallery-nav.next { right: .75rem; }
.gallery-nav:hover:not(:disabled) { transform: translateY(-50%) scale(1.06); }
.gallery-nav:disabled { opacity: 0; pointer-events: none; }

.gallery-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: .7rem;
  display: flex;
  justify-content: center;
  gap: .4rem;
}
.gallery-dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,.5);
  cursor: pointer;
}
.gallery-dots button.active { background: #fff; }

/* What the chain stores */
.db-copy {
  padding-top: 1.5rem;
  border-top: 1px solid #eef2f7;
}
/* Straight under the pictures it is the caption, with nothing to set it apart from */
.post-gallery + .db-copy {
  padding-top: 0;
  border-top: none;
}

/* Permanent copies */
.pb-perm-tip { cursor: default; }

.perm-section { scroll-margin-top: 96px; }

.perm-status {
  display: inline-flex;
  align-items: center;
  gap: .4em;
  margin-left: .35rem;
  padding: .2em .6em;
  border-radius: 999px;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.perm-status.archiving { background: #fff4d6; color: #9a5b00; border: 1px solid #f3d38a; }
.perm-status.confirmed { background: #e8f7ee; color: #1f8a4c; border: 1px solid #b7e4c7; }

.perm-lede {
  margin: -.4rem 0 1rem;
  color: #9a5b00;
  font-size: .82rem;
  line-height: 1.55;
}

.perm-state {
  display: inline-block;
  vertical-align: middle;
  margin-left: .45rem;
  padding: .12em .5em;
  border-radius: 999px;
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.perm-state.ok      { background: #e8f7ee; color: #1f8a4c; }
.perm-state.pending { background: #fff4d6; color: #9a5b00; }

.perm-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e6eef7;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.perm-row {
  display: grid;
  grid-template-columns: auto minmax(11rem, 1fr) minmax(0, 1.1fr) auto;
  align-items: center;
  gap: 1.1rem;
  padding: .85rem 1rem;
}
.perm-row + .perm-row { border-top: 1px solid #eef3f9; }

.perm-what {
  display: flex;
  flex-direction: column;
  gap: .12rem;
  min-width: 0;
}

.perm-name {
  color: #0e0e52;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: .92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.perm-name .link { color: #192bc2; text-decoration: none; }
.perm-name .link:hover { text-decoration: underline; }

.perm-sub {
  color: #7e97b4;
  font-size: .76rem;
}

.perm-hash {
  display: flex;
  flex-direction: column;
  gap: .28rem;
  min-width: 0;
}

.perm-hash-key {
  font-family: 'Outfit', sans-serif;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #8aa4bf;
  white-space: nowrap;
}

.perm-hash-val {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  width: fit-content;
  max-width: 100%;
  padding: .3rem .55rem;
  border: 1px solid #dbe6f2;
  border-radius: 7px;
  background: #f6f9fd;
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease;
}
.perm-hash-val:hover { background: #eef4fb; border-color: #c8dff0; }
.perm-hash-val.copied { background: #e8f7ee; border-color: #b7e4c7; }

.perm-hash-val code {
  font-size: .74rem;
  color: #2c4a6b;
  white-space: nowrap;
}

.perm-copy {
  font-family: 'Outfit', sans-serif;
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: #192bc2;
}
.perm-hash-val.copied .perm-copy { color: #1f8a4c; }

.perm-open {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .45rem .8rem;
  border-radius: 8px;
  background: #6d28d9;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: .78rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background .15s ease;
}
.perm-open:hover { background: #5b21b6; color: #ffffff; text-decoration: none; }
.perm-open svg { width: 14px; height: 14px; }

.perm-note {
  margin: .75rem 0 0;
  color: #8aa4bf;
  font-size: .76rem;
  line-height: 1.55;
}

/* A Content IDs row has no "open" link, so it is one column short. */
.cid-row { grid-template-columns: auto minmax(11rem, 1fr) minmax(0, 1.4fr); }

@media (max-width: 720px) {
  .perm-row {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon what"
      "hash hash"
      "open open";
    gap: .6rem .8rem;
  }
  .cid-row {
    grid-template-areas:
      "icon what"
      "hash hash";
  }
  .perm-row .mthumb { grid-area: icon; }
  .perm-what { grid-area: what; }
  .perm-hash { grid-area: hash; }
  .perm-open { grid-area: open; justify-content: center; }
}

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
  .gallery-stage.multi .gallery-slide img { height: min(60vh, 420px); }
  .gallery-nav { width: 32px; height: 32px; }

  /* Tighter passport bar */
  .pb-brand  { padding: .5rem .75rem; }
  .pb-share  { padding: .45rem .75rem; }
  .pb-fields { padding: .5rem .75rem; }
  .pb-title  { font-size: .6rem; }
  .pb-key    { font-size: .6rem; }
  .pb-val    { font-size: .8rem; }
}
</style>
