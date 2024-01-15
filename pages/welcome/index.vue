<template>
  <div class="container mb-16">
    <setup-new-user />
  </div>
</template>

<script>
import SetupNewUser from '@/components/SetupNewUser/SetupNewUser.vue'

export default {
  name: 'welcome',
  components: {
    SetupNewUser
  },
  head() {
    return {
      title: "Welcome"
    }
  },
}
</script>
