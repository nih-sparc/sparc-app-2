<script>
export default {
  async setup() {
    const route = useRoute()
    const newPath = route.href.replace('/about/what-we-offer', '/about')
    await navigateTo(newPath, { redirectCode: 301 })
  }
}
</script>
