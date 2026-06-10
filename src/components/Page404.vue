<template>
  <div class="page-404">
    <AppHeader :showAuth="false" ref="appHeader" />
    <div class="content">
      <div class="code">404</div>
      <h1 class="title">Page not found</h1>
      <p class="sub">The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="home-btn">← Back to Explorer</router-link>
    </div>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader'
export default {
  name: 'Page404',
  components: { AppHeader },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.page-404 { background: #eef5fb; min-height: 100vh; font-family: 'Outfit', sans-serif; }

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 58px);
  padding: 2rem 1.5rem;
  text-align: center;
}

.code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7rem;
  font-weight: 700;
  color: #c8dff0;
  line-height: 1;
  margin-bottom: .5rem;
  letter-spacing: -.04em;
}

.title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0e0e52;
  margin: 0 0 .6rem;
  letter-spacing: -.02em;
}

.sub {
  font-size: .9rem;
  color: #5878a0;
  margin: 0 0 2rem;
  max-width: 320px;
}

.home-btn {
  display: inline-flex;
  align-items: center;
  background: #0e0e52;
  color: #ffffff;
  text-decoration: none;
  padding: .6rem 1.5rem;
  border-radius: 999px;
  font-family: 'Outfit', sans-serif;
  font-size: .85rem;
  font-weight: 700;
  transition: background .18s, box-shadow .18s;
}
.home-btn:hover { background: #192bc2; box-shadow: 0 4px 14px rgba(25,43,194,.25); }
</style>
