<script>
export default {
  async setup() {
    const route = useRoute()
    const newPath = route.href.replace('/about/team-and-leadership', '/about')
    const router = useRouter()
    await router.replace({ path: newPath })
  }
}
</script>
