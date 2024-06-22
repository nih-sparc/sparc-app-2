<script>
export default {
  async setup() {
    const router = useRouter()
    await router.replace({ path: "/contact-us?type=story" })
  }
}
</script>
