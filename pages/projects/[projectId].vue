<script>
export default {
  async setup() {
    const route = useRoute()
    const router = useRouter()
    const newPath = route.href.replace('/projects', '/about/projects')
    await router.replace({ path: newPath })
  },
}
</script>
