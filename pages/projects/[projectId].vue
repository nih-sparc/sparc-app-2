<script>
export default {
  async setup() {
    const route = useRoute()
    const newPath = route.href.replace('/projects', '/about/projects')
    await navigateTo(newPath, { redirectCode: 301 })
  },
}
</script>
