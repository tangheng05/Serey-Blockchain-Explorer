<template>
  <div class="cd-wrap">
    <div class="cd-title" v-if="title !== ''">{{ title }}</div>
    <div class="cd-row" v-for="(item, key) in data" :key="key">
      <span class="cd-key">{{ key }}</span>
      <span class="cd-val">
        <template v-if="typeof item === 'object'">
          <template v-if="link && item.link">
            <router-link :to="EXPLORER + item.link" class="cd-link">{{ item.text }}</router-link>
          </template>
          <template v-else>
            <card-data :data="item" />
          </template>
        </template>
        <template v-else>{{ item }}</template>
      </span>
    </div>
  </div>
</template>

<script>
import Config from '@/config.js'

export default {
  name: 'card-data',
  props: {
    data:     { type: [Object, Array], required: true },
    title:    { type: String, required: false, default: '' },
    typeCard: { type: String, required: false, default: '' },
    link:     { type: Boolean, required: false, default: false },
  },
  data() {
    return { EXPLORER: Config.EXPLORER }
  },
}
</script>

<style scoped>
.cd-wrap { width: 100%; }

.cd-title {
  font-family: 'Outfit', sans-serif;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #ffffff;
  background: #192bc2;
  padding: .45rem .75rem;
}

.cd-row {
  display: flex;
  align-items: baseline;
  gap: .5rem;
  padding: .38rem .75rem;
  border-bottom: 1px solid #eef5fb;
  font-family: 'Outfit', sans-serif;
}
.cd-row:last-child { border-bottom: none; }

.cd-key {
  flex-shrink: 0;
  width: 11rem;
  font-size: .72rem;
  color: #5878a0;
  font-weight: 500;
  word-break: break-all;
}

.cd-val {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem;
  color: #0e0e52;
  font-weight: 500;
  word-break: break-all;
  min-width: 0;
}

.cd-link {
  color: #192bc2;
  text-decoration: none;
  transition: color .15s;
}
.cd-link:hover { color: #449dd1; }
</style>
