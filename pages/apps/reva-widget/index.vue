<template>
  <div class="container">
    <client-only>
      <RevaWidget />
    </client-only>
  </div>
</template>

<script setup>
import '@/node_modules/reva-widget/dist/reva-widget.css'
import { RevaWidget, configure } from 'reva-widget'

const config = useRuntimeConfig()
configure({
  sparcApi: config.public.portal_api
})
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.container {
  min-width: stretch;
  min-width: 100%;
  min-width: -webkit-fill-available;
  height: 100vh;
}
</style>

