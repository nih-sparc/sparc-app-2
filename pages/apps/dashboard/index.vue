<template>
  <div>
    <breadcrumb :breadcrumb="breadcrumb" :title=title />
    <SparcDashboard />
  </div>
</template>
<script>
export default {
  name: 'SparcDashboardPage',
  data() {
    return {
      title: 'SPARC Dashboard',
      breadcrumb: [
        {
          label: 'Home',
          to: {
            name: 'index'
          }
        },
        {
          to: {
            name: 'apps',
          },
          label: 'SPARC Apps',
        }
      ]
    }
  }
}
</script>