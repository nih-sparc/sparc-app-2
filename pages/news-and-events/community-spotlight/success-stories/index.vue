<script>
export default {
  async setup() {
    const router = useRouter()
    await router.replace({ path: "/news-and-events/community-spotlight?selectedSpotlightTypes=successStory" })
  }
}
</script>