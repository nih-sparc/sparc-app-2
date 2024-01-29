<template>
  <div>
    <div class="loading-container" v-if="loading">
      <img class="logo" :src="logo" />
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script>
import { ref } from 'vue'
import sparcLogoFast from '@/assets/sparcLogoFast.gif'

export default {
  async setup() {
    const nuxtApp = useNuxtApp()
    const loading = ref(false)
    const loaded = ref(false)
    const logo = sparcLogoFast
    nuxtApp.hook("page:start", () => {
      setTimeout(() => {
        if (!loaded.value) {
          loading.value = true
        }
      }, 1000)
    })
    nuxtApp.hook("page:finish", () => {
      loading.value = false
      loaded.value = true
    })
    return {
      logo,
      loading
    }
  }
}
</script>
<style lang="scss" scoped>
.loading-container {
  position: fixed;
  top: 0;
  z-index: 1;
  background-color: white;
  opacity: .5;
  width: 100vw;
  height: 100vh;
}

.logo {
  position: absolute;
  height: 5rem;
  z-index: 2;
  left: calc(50vw - 5rem);
  top: calc(50vh - 5rem);
}
</style>
