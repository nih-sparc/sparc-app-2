<script>
export default {
  async setup() {
    const route = useRoute()
    const router = useRouter()
    const newPath = route.href.replace('/resources/', '/tools-and-resources/')
    await router.replace({ path: newPath })
  },
}
</script>
