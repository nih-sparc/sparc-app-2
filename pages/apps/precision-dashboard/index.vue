<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title=title />
    <page-hero class="py-24">
      <div class="page-hero-content">
        <div>
          <h1>Precision Dashboard</h1>
          <p>
            Explore an evolving collection of interactive widgets designed to analyze and interpret data about the NIH Precision Human Pain Network. This platform brings together visualizations, metrics, and insights to support research and discovery. Data publication is an ongoing effort, with new findings and resources continuously being added as the project advances.
          </p>
        </div>
      </div>
    </page-hero>
    <div class="px-32 py-4">
      <el-tooltip
        placement="right-start"
        content="Under active development"
        popper-class="beta-tooltip"
        effect="customized"
      >
        <template #default>
          <div class="beta-tag"><el-icon class="beta-icon"><WarningFilled /></el-icon>Beta</div>
        </template>
      </el-tooltip>
    </div>
    <client-only>
      <PennsieveDashboard v-if="dashboardOptions" class="px-32 dashboard-app" :options="dashboardOptions" />
    </client-only>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { PennsieveDashboard, TextWidget, MarkdownWidget } from 'pennsieve-dashboard'
import 'pennsieve-dashboard/style.css'
import 'precision-dashwidgets/style.css'

const s3Url = 'https://temp-precision-dashboard-data.s3.us-east-1.amazonaws.com/precision_human_drg_data.parquet'
const title = 'Precision Dashboard'
const breadcrumb = [
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

const dashboardOptions = ref(null) // will be populated after dynamic import

onMounted(async () => {
  // dynamically import the browser-only widgets
  const { UMAP, DataExplorer, ProportionPlot } = await import('precision-dashwidgets')

  const availableWidgets = [
    { name: 'Umap', component: UMAP },
    { name: 'Data Explorer', component: DataExplorer },
    { name: 'Text Widget', component: TextWidget },
    { name: 'Markdown', component: MarkdownWidget },
    { name: 'Proportion Plot', component: ProportionPlot }
  ]

  const defaultLayout = [
    {
      id: 'Umap-1',
      x: 0, y: 0, w: 7, h: 10,
      componentKey: 'UMAP',
      componentName: 'UMAP',
      component: UMAP,
    },
    {
      id: 'DataExplorer-2',
      x: 7, y: 0, w: 5, h: 10,
      componentKey: 'DataExplorer',
      componentName: 'Data Explorer',
      component: DataExplorer,
    },
    {
      id: 'ProportionPlot-3',
      x: 0, y: 10, w: 12, h: 8,
      componentKey: 'ProportionPlot',
      componentName: 'Proportion Plot',
      component: ProportionPlot,
    }
  ]
  const services = {
    s3Url
  }
  dashboardOptions.value = {
    availableWidgets,
    defaultLayout,
    services
  }
})
</script>

<style scoped lang="scss">
/* set style vars from outside the dashboard > customize to match your application */
.page-container {
  background: #f6f7fb;
}
.dashboard-app {
  --el-color-primary: #243d8e;
  --el-color-primary-light-3: #fbfdff;
  --el-color-primary-dark-2: #546085;
  --color:#243d8e;
  --el-dialog-width: 90%;
  --dash-secondary: #981f3280;
  --dash-background: #f6f7fb;
}
:deep(.dash-header) {
  background-color: #f6f7fb;
}
:deep(.el-button) {
  background: #981f32 !important;
  border: 1px solid #981f32 !important;
}
:deep(.el-icon) {
  color: #981f32;
}
:deep(svg > path) {
  fill: #981f32;
}
.beta-tooltip {
  display: flex;
  width: fit-content;
}
.beta-tag {
  display: flex;
  width: fit-content;
  color: #ff8400;
}
.beta-icon {
  font-size: 25px;
}
:deep(.beta-icon svg > path) {
  fill: #ff8400 !important;
}
:global(.beta-tooltip.el-popper.is-customized .el-popper__arrow::before) {
  background-color: #ffe8ec !important;
}
:global(.beta-tooltip.el-popper.is-customized) {
  background: #ffe8ec !important;
  border-color: #981f32 !important;
  border-radius: 4px;
}
</style>
