<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title=title />
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
    <PennsieveDashboard class="px-32 dashboard-app" :options="dashboardOptions" />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { PennsieveDashboard, TextWidget, MarkdownWidget } from 'pennsieve-dashboard'
import { UMAP, DataExplorer, ProportionPlot } from 'precision-dashwidgets'
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
  { name: 'Markdown', component: MarkdownWidget },
  { name: 'Proportion Plot', component:ProportionPlot }
]

const defaultLayout = [
  {
    id:'Markdown-0',
    x: 0, y: 0, w: 3, h: 8,
    componentKey: 'Markdown',
    componentName:'READ ME',
    component:MarkdownWidget,
    Props:{
      markdownText:[
    '# Human DRG Dataset Dashboard',
    '',
    'This is a dashboard associated with the **NIH HEAL PRECISION Human Pain** consortium project. It aggregates data from several U19 centers in a standardized way. Using the different widgets, you can view, query and export the data in various ways:',
    '',
    '## Widgets',
    '',
    '### UMAP Viewer',
    'This widget provides the UMAP representation of the entire dataset, you can select the color mapping based on different metadata elements.',
    '',
    '### The Data Explorer',
    'Directly query over the data using SQL and export the results as a CSV file.',
    '',
    '### Proportion Viewer',
    'Explore metrics between the different datasets that comprise the aggregated data.'
  ].join('\n')
    }
  },
  {
    id: 'Umap-1',
    x: 3, y: 0, w: 5, h: 8,
    componentKey: 'UMAP',
    componentName: 'UMAP',
    component: UMAP,
  },
  {
    id: 'ProportionPlot-3',
    x: 8, y: 0, w: 4, h: 8,
    componentKey: 'Proportion Plot',
    componentName: 'Proportion Plot',
    component: ProportionPlot,   
  }, 
  {
    id: 'DataExplorer-2',
    x: 0, y: 8, w: 12, h: 6,
    componentKey: 'Data Explorer',
    componentName: 'Data Explorer',
    component: DataExplorer,
  },
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
:deep(.pp-field button){
  height: 2rem;
  background: #981f32 !important;
  border-color: #981f32 !important;
}
:deep(.pp-field div){
  line-height: 20px;
}
:deep(.data-explorer-wrap .dashboard-header div){
  height: 20px;
  padding: 6px;
  align-content: center;
  line-height: 0;
}
:deep(.pp-controls > :nth-child(1 of .pp-field)){
  display: none;
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
