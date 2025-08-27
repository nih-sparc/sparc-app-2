<template>
  <div class="page-container">
    <!--<breadcrumb :breadcrumb="breadcrumb" :title=title />-->
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
      <PennsieveDashboard class="px-32 dashboard-app" :options="dashboardOptions" />
  </div>
</template>
<script setup >
import { ref } from 'vue';
import {PennsieveDashboard, TextWidget, MarkdownWidget} from 'pennsieve-dashboard'
import {UMAP, DataExplorer} from 'precision-dashwidgets'
import 'pennsieve-dashboard/style.css'
import 'precision-dashwidgets/style.css'

const s3Url = 'https://temp-precision-dashboard-data.s3.us-east-1.amazonaws.com/precision_human_drg_data.parquet'

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
.dashboard-app{
  --el-color-primary: #243d8e;
  --el-color-primary-light-3: #fbfdff;
  --el-color-primary-dark-2: #546085;
  --color:#243d8e;
  --el-dialog-width: 90%;
  --dash-secondary: #243d8e;
}
</style>