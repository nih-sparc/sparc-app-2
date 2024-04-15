<script>
export default {
  async setup() {
    const route = useRoute()
    const newPath = route.href.replace('/resources/', '/tools-and-resources/')
    await navigateTo(newPath, { redirectCode: 301 })
  },
}
</script>
