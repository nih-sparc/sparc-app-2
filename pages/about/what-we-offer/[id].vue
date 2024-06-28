<script>
export default {
  async setup() {
    const route = useRoute()
    const newPath = route.href.replace('/about/what-we-offer', '/about')
    const router = useRouter()
    await router.replace({ path: newPath })
  }
}
</script>
