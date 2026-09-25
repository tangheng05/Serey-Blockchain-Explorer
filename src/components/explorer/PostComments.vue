<template>
  <div class="comments-wrap">
    <div v-if="!rows.length" class="empty-comments">No comments yet</div>

    <div v-else class="comment-list">
      <div
        v-for="c in rows"
        :key="c.key"
        class="comment-row"
        :style="{ '--depth': Math.min(c.depth - 1, 4) }"
      >
        <div class="c-head">
          <router-link :to="EXPLORER + '@' + c.author" class="c-author">@{{ c.author }}</router-link>
          <span class="c-dot">·</span>
          <router-link v-if="c.chain" :to="EXPLORER + '@' + c.author + '/' + c.permlink" class="c-date">{{ c.date }}</router-link>
          <span v-else class="c-date">{{ c.date }}</span>

          <span class="c-status">
            <span v-if="loading" class="c-chip unknown">Checking…</span>
            <button
              v-else-if="c.status === 'fingerprint'"
              type="button"
              class="c-hash"
              :class="{ copied: copied === c.commitment }"
              :title="c.commitment"
              @click="copy(c.commitment)"
            >{{ copied === c.commitment ? 'Copied' : shortHash(c.commitment) }}</button>
            <span v-else-if="c.status === 'onchain'" class="c-chip intact">✓ On chain</span>
            <span v-else class="c-chip unknown">Not on chain</span>
          </span>

          <span v-if="c.payout" class="c-payout">{{ c.payout }}</span>
        </div>

        <div v-if="c.html" class="c-body" v-html="c.html"></div>
        <div v-else class="c-body removed">{{ apiAvailable ? 'Removed from Serey' : 'Text not available' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'
import { useRPCNode } from '@/composables/useRPCNode.js'

// Chain reads are one call per reply level plus one per author; capped so a
// busy thread cannot turn into hundreds of RPC calls.
const MAX_CHAIN_REPLIES = 200
const MAX_DEPTH = 6
const HISTORY_LIMIT = 1000
// Second pass, only for replies older than the first window.
const HISTORY_LIMIT_DEEP = 10000
const HASH_BODY = /^serey\s*\n\s*c:([0-9a-f]{64})\s*$/i

export default {
  name: 'PostComments',

  props: {
    author:     { type: String, required: true },
    permlink:   { type: String, required: true },
    // Serey's own comment tree, with the text: the chain carries only fingerprints.
    apiReplies: { type: Array, default: () => [] },
    // False when Serey's API did not answer: missing text is then unknown, not removed.
    apiAvailable: { type: Boolean, default: true },
  },

  emits: ['count'],

  setup() {
    const { steem_database_call } = useRPCNode()
    return { steem_database_call }
  },

  data() {
    return {
      EXPLORER: Config.EXPLORER,
      chain: {},
      loading: true,
      copied: null,
    }
  },

  computed: {
    rows() {
      const rows = []
      const seen = new Set()
      const walk = (list, depth) => {
        for (const r of list || []) {
          const key = `${r.author}/${r.permlink}`
          seen.add(key)
          rows.push(this.toRow(key, r, depth))
          walk(r.replies, depth + 1)
        }
      }
      walk(this.apiReplies, 1)

      // On chain but gone from Serey: deleted, so there are no words to show.
      for (const [key, rec] of Object.entries(this.chain)) {
        if (!seen.has(key)) rows.push(this.toRow(key, null, rec.depth))
      }
      return rows
    },
  },

  watch: {
    rows: { handler(rows) { this.$emit('count', rows.length) }, immediate: true },
  },

  created() {
    this.loadChain()
  },

  methods: {
    toRow(key, api, depth) {
      const rec = this.chain[key] || null
      const [author, permlink] = key.split('/')
      return {
        key,
        author,
        permlink,
        depth,
        chain: Boolean(rec),
        status: rec ? (rec.commitment ? 'fingerprint' : 'onchain') : 'none',
        commitment: rec && rec.commitment,
        date: rec ? this.formatDate(rec.created + 'Z') : this.formatDate(api && api.publish_date),
        payout: rec ? this.payoutOf(rec) : '',
        // Pre-hash comments carry their words on chain; Serey's copy wins when present.
        // A comment added since the API cached the tree carries `body`, not `description`.
        html: (api && (api.description || api.body)) || (rec && rec.text) || '',
      }
    },

    async loadChain() {
      this.loading = true
      this.chain = {}
      const found = []
      try {
        await this.collectReplies(this.author, this.permlink, 1, found)
      } catch (e) { /* a node failure leaves every row "Not on chain" rather than blank */ }

      // This node answers replies with empty body and metadata, so the
      // fingerprint comes from each author's own comment operation instead.
      const missing = found.filter(r => !(r.body || '').trim() && !(r.json_metadata || '').trim())
      const authors = (list) => [...new Set(list.map(r => r.author))]
      const ops = await this.opsByAuthor(authors(missing), HISTORY_LIMIT)
      const older = missing.filter(r => !ops[`${r.author}/${r.permlink}`])
      if (older.length) Object.assign(ops, await this.opsByAuthor(authors(older), HISTORY_LIMIT_DEEP))

      const chain = {}
      for (const r of found) {
        const op = ops[`${r.author}/${r.permlink}`]
        const body = op ? op.body : r.body
        const meta = op ? op.json_metadata : r.json_metadata
        const commitment = this.commitmentOf(body, meta)
        chain[`${r.author}/${r.permlink}`] = {
          depth: r.depth,
          created: r.created,
          commitment,
          text: commitment ? '' : (body || ''),
          pending: r.pending_payout_value,
          paid: r.total_payout_value,
          curator: r.curator_payout_value,
        }
      }
      this.chain = chain
      this.loading = false
    },

    async collectReplies(author, permlink, depth, out) {
      if (out.length >= MAX_CHAIN_REPLIES || depth > MAX_DEPTH) return
      const replies = await this.steem_database_call('get_content_replies', [author, permlink])
      for (const r of replies || []) {
        if (out.length >= MAX_CHAIN_REPLIES) return
        out.push(r)
        if (r.children > 0) await this.collectReplies(r.author, r.permlink, depth + 1, out)
      }
    },

    // Latest comment op per permlink: an edit broadcasts a new one.
    async opsByAuthor(authors, limit) {
      const ops = {}
      await Promise.allSettled(authors.map(async (author) => {
        const history = await this.steem_database_call('get_account_history', [author, -1, limit])
        for (const entry of history || []) {
          const o = entry && entry[1] && entry[1].op
          if (o && o[0] === 'comment' && o[1].author === author) ops[`${author}/${o[1].permlink}`] = o[1]
        }
      }))
      return ops
    },

    commitmentOf(body, jsonMetadata) {
      let meta = {}
      try { meta = JSON.parse(jsonMetadata || '{}') } catch (e) { /* */ }
      if (meta && meta.content_commitment) return meta.content_commitment
      const m = String(body || '').trim().match(HASH_BODY)
      return m ? m[1] : null
    },

    payoutOf(rec) {
      const pending = parseFloat(rec.pending) || 0
      const paid = (parseFloat(rec.paid) || 0) + (parseFloat(rec.curator) || 0)
      const value = pending || paid
      return value > 0 ? `${value.toFixed(3)} ${Config.SBD}` : ''
    },

    formatDate(value) {
      if (!value) return ''
      const d = new Date(String(value).replace(' ', 'T'))
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },

    shortHash(v) {
      return v && v.length > 18 ? `${v.slice(0, 10)}…${v.slice(-6)}` : v
    },

    async copy(value) {
      try {
        await navigator.clipboard.writeText(value)
      } catch (e) {
        return
      }
      this.copied = value
      clearTimeout(this._copyTimer)
      this._copyTimer = setTimeout(() => { this.copied = null }, 1400)
    },
  },
}
</script>

<style scoped>
.comments-wrap { font-family: 'Outfit', sans-serif; }

.comment-list {
  border: 1px solid #c8dff0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15,23,42,.05);
  overflow: hidden;
}

.comment-row {
  padding: .85rem 1rem .85rem calc(1rem + var(--depth) * 1.25rem);
  border-bottom: 1px solid #eef5fb;
}
.comment-row:last-child { border-bottom: none; }

.c-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .45rem;
  font-size: .82rem;
}

.c-author { font-weight: 600; color: #0e0e52; text-decoration: none; }
.c-author:hover { color: #449dd1; }
.c-dot { color: #9bb3cc; }
.c-date { color: #5878a0; text-decoration: none; }
a.c-date:hover { color: #449dd1; }

.c-status { display: inline-flex; }

.c-chip {
  display: inline-flex;
  align-items: center;
  padding: .17em .55em;
  border-radius: 4px;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .05em;
  white-space: nowrap;
}
.c-chip.intact  { background: #192bc2; color: #fff; }
.c-chip.unknown { background: #eef5fb; color: #5878a0; border: 1px solid #c8dff0; }

.c-hash {
  padding: .17em .55em;
  border: 1px solid #c8dff0;
  border-radius: 4px;
  background: #eef5fb;
  color: #2c4a6b;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: .68rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.c-hash:hover { border-color: #449dd1; background: #e3f0fb; }
.c-hash.copied { background: #192bc2; border-color: #192bc2; color: #fff; }

.c-payout {
  margin-left: auto;
  color: #449dd1;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.c-body {
  margin-top: .35rem;
  color: #1e2b4a;
  font-size: .9rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.c-body :deep(p) { margin: 0 0 .4em; }
.c-body :deep(p:last-child) { margin-bottom: 0; }
.c-body :deep(img) { max-width: 100%; max-height: 320px; border-radius: 6px; }
.c-body.removed { color: #8aa2bd; font-style: italic; }

.empty-comments {
  padding: 1.25rem;
  color: #5878a0;
  font-size: .88rem;
  text-align: center;
  background: #fff;
  border: 1px solid #c8dff0;
  border-radius: 10px;
}

@media (max-width: 600px) {
  .comment-row { padding-left: calc(.85rem + var(--depth) * .75rem); padding-right: .85rem; }
  .c-payout { margin-left: 0; }
}
</style>
