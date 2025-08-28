<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title=title />
    <page-hero class="py-24">
      <div class="page-hero-content">
        <div>
          <h1>Precision Dashboard</h1>
          <p>
            Explore an evolving collection of interactive widgets designed to analyze and interpret data about the vagus nerve. This platform brings together visualizations, metrics, and insights to support research and discovery. Data publication is an ongoing effort, with new findings and resources continuously being added as the SPARC project advances.
          </p>
        </div>
      </div>
    </page-hero>
    <PennsieveDashboard class="dashboard-app" :options="dashboardOptions" />
  </div>
</template>
<script setup >
import { ref } from 'vue';
import {PennsieveDashboard, TextWidget, MarkdownWidget} from 'pennsieve-dashboard'
import {UMAP, DataExplorer} from 'precision-dashwidgets'
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
      
const availableWidgets = [
  { name: 'Umap', component: UMAP },
  { name: 'Data Explorer', component: DataExplorer },
  { name: 'Text Widget', component: TextWidget},
  { name: 'Markdown', component: MarkdownWidget}
]
const defaultLayout = [
  {
    id: 'Umap-1',
    x: 0, y: 0, w: 6, h: 10,
    componentKey: 'UMAP',
    componentName: 'UMAP',
    component: UMAP,
  },
  {
    id: 'DataExplorer-2',
    x: 6, y: 0, w: 4, h: 8,
    componentKey: 'DataExplorer',
    componentName: 'Data Explorer',
    component: DataExplorer,
  }
]
const services = {
  s3Url
}
const dashboardOptions = ref({
  availableWidgets,
  defaultLayout,
  services
})
</script>

<style scoped>
/* set style vars from outside the dashboard > customize to match your application */
.dashboard-app {
  --el-color-primary: #243d8e;
  --el-color-primary-light-3: #fbfdff;
  --el-color-primary-dark-2: #546085;
  --color:#243d8e;
  --el-dialog-width: 90%;
  --dash-secondary: #981f3280;
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
</style>