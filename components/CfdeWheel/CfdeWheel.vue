<template>
  <client-only>
    <div ref="wheelEl"></div>
  </client-only>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"

const wheelEl = ref(null)

onMounted(async () => {
  await nextTick()

  const initWheel = () => {
    if (!wheelEl.value) {
      console.error("Wheel container not ready")
      return
    }

    if (window.CFDEWheel) {
      window.CFDEWheel.init(wheelEl.value)
    }
  }

  // wait for script load if needed
  const tryInit = () => {
    if (window.CFDEWheel) {
      initWheel()
    } else {
      const interval = setInterval(() => {
        if (window.CFDEWheel) {
          clearInterval(interval)
          initWheel()
        }
      }, 50)
    }
  }

  tryInit()
})
</script>
