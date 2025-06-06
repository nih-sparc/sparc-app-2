<template>
  <div>
    <breadcrumb :breadcrumb="breadcrumb" :title=title />
    <client-only>
      <SparcDashboard :dBItems="dBItems"/>
    </client-only>
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
      ],
      dBItems: [{ id: "FlatmapViewer-1", x: 0, y: 0, h: 8, w:2, componentName:"Flatmap Viewer",component:"FlatmapViewer" },
    { id: "ImageSelector-2", x: 2, y: 0, h: 8, w:3, componentName:"Image Selector", component:"ImageSelector"},
    { id: "BiolucidaViewer-3", x: 5, y: 0,h: 11, w:7, componentName:"MBF Viewer", component:"BiolucidaViewer"},
    { id: "ODBGraph-1", x: 0, y: 8, h: 3, w:5, componentName:"Graph",component:"QDBGraph" }]
    }
  }
}
</script>
<style lang="scss" scoped>
.dashboard-app{
    --el-color-primary: #8300bf;
    --el-color-primary-light-3: #fbfdff;
    --el-color-primary-dark-2: #24245b;
    --color:#243d8e;
    --el-dialog-width: 90%;
    --dash-text-dark:black;

    .grid-stack-item-content{
        background-color: #ebedf0;
        border:1px solid #909399 !important;
        border-radius:.2rem !important;

        .widget-name{
            padding-left:10px;
        }
    }
    .filter-wrapper div{
        padding-right:4px;
    }
  }
</style>