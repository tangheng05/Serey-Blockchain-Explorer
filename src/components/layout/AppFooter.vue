<template>
  <footer class="s-footer">
    <div class="s-footer-stripe"></div>
    <div class="s-footer-inner">

      <div class="s-footer-brand">
        <span class="s-footer-name">Serey Explorer</span>
        <span class="s-footer-tagline">Blockchain transparency for the Serey network</span>
      </div>

      <span class="s-footer-copy">© {{ year }} Sereyexplorer</span>

    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  computed: {
    year() { return new Date().getFullYear() }
  }
}
</script>

<style scoped>
.s-footer {
  background: #0e0e52;
  margin-top: 3rem;
}

.s-footer-stripe {
  height: 3px;
  background: linear-gradient(90deg, #150578, #192bc2, #449dd1, #78c0e0);
}

.s-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.s-footer-brand {
  display: flex;
  flex-direction: column;
  gap: .15rem;
}

.s-footer-name {
  font-family: 'Outfit', sans-serif;
  font-size: .88rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: .03em;
}

.s-footer-tagline {
  font-family: 'Outfit', sans-serif;
  font-size: .68rem;
  color: rgba(120,192,224,.6);
  letter-spacing: .04em;
}

.s-footer-links {
  display: flex;
  align-items: center;
  gap: .25rem;
}

.s-footer-link {
  padding: .3rem .7rem;
  font-family: 'Outfit', sans-serif;
  font-size: .78rem;
  font-weight: 600;
  color: rgba(255,255,255,.55);
  text-decoration: none;
  border-radius: 6px;
  transition: background .15s, color .15s;
}

.s-footer-link:hover,
.s-footer-link.router-link-active {
  background: rgba(120,192,224,.1);
  color: #78c0e0;
}

.s-footer-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.s-github {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  font-family: 'Outfit', sans-serif;
  font-size: .78rem;
  font-weight: 600;
  color: rgba(255,255,255,.55);
  text-decoration: none;
  transition: color .15s;
}

.s-github:hover { color: #78c0e0; }

.s-footer-copy {
  font-family: 'Outfit', sans-serif;
  font-size: .72rem;
  color: rgba(255,255,255,.3);
}

@media (max-width: 700px) {
  .s-footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: .85rem;
    padding: 1rem 1.5rem 1.25rem;
  }
  .s-footer-links { flex-wrap: wrap; }
}
</style>
