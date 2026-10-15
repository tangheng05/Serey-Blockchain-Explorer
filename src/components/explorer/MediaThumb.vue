<template>
  <component
    :is="link ? 'a' : 'div'"
    class="mthumb"
    :class="'is-' + kind"
    :href="link || undefined"
    :target="link ? '_blank' : undefined"
    :rel="link ? 'noopener noreferrer' : undefined"
    :title="title || undefined"
  >
    <img v-if="showImage" :src="src" alt="" loading="lazy" decoding="async" @error="failed = true" />
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="kind === 'video'">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m10 9.5 5 2.5-5 2.5z" />
      </template>
      <template v-else-if="kind === 'audio'">
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </template>
      <template v-else-if="kind === 'text' || kind === 'file'">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </template>
      <template v-else>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m21 16-5-5-8 8" />
      </template>
    </svg>
    <span v-if="showImage && kind === 'video'" class="mthumb-play" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
    </span>
  </component>
</template>

<script>
// A file's picture, a video's poster, or an icon when there is no picture or it fails to load.
export default {
  name: 'MediaThumb',
  props: {
    src: { type: String, default: null },
    kind: { type: String, default: 'image' },
    href: { type: String, default: null },
    title: { type: String, default: '' },
  },
  data() {
    return { failed: false }
  },
  computed: {
    showImage() {
      return Boolean(this.src) && !this.failed
    },
    link() {
      return /^https?:\/\//i.test(this.href || '') ? this.href : null
    },
  },
  watch: {
    src() { this.failed = false },
  },
}
</script>

<style scoped>
.mthumb {
  position: relative;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 1px solid #e6eef7;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f1ecfd;
  color: #6d28d9;
  text-decoration: none;
}
a.mthumb:hover { border-color: #c8dff0; }
.mthumb svg { width: 22px; height: 22px; }
.mthumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.mthumb-play {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(14, 14, 82, .72);
  color: #ffffff;
}
.mthumb-play svg { width: 11px; height: 11px; }
</style>
