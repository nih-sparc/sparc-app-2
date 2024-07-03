<script>
export default {
  name: 'MetricsPage',

  async setup() {
    const router = useRouter()
    await router.replace({ path: "/about/metrics" })
  },
}
</script>
