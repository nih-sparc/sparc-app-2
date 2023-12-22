<script>
export default {
  name: 'MetricsPage',

  async setup() {
    await navigateTo("/about/metrics", { redirectCode: 301 })
  },
}
</script>