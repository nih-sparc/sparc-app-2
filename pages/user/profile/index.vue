<template>
  <div>
    Profile page
  </div>
</template>
<script setup>
definePageMeta({
  middleware: [
    'auth-route'
  ]
});
</script>
<script>
export default {
  name: 'profile',
  head() {
    return {
      title: "Profile"
    }
  },
}
</script>
