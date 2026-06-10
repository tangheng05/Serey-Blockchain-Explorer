<template>
  <div>
    <AppHeader :showAuth="false" ref="appHeader" />
    <div class="container">
      <h1 class="text-center mb-4">404</h1>
      <h3 class="text-center">Page not found</h3>
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
