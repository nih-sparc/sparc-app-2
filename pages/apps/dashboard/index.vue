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
import { defineAsyncComponent, ref} from 'vue';
import { FlatmapWidget, BiolucidaViewer, SubjectSelector, VagusImageSelector, QDBGraph} from 'sparc-dashwidgets'
import {PennsieveDashboard} from 'pennsieve-dashboard'
import 'pennsieve-dashboard/style.css'
import 'sparc-dashwidgets/style.css'

// Re-direct for now until we want to show the dashboard
const router = useRouter()
router.push("/")

const { $algoliaClient } = useNuxtApp()
const config = useRuntimeConfig()

const title = 'SPARC Dashboard'
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
      
const FlatmapCmp = defineAsyncComponent(FlatmapWidget.loader);
const availableWidgets = [
  { name: 'BiolucidaViewer', component: BiolucidaViewer },
  { name: 'FlatmapViewer', component: FlatmapCmp },
  { name: 'SubjectSelector', component:SubjectSelector},
  {name: 'VagusImageSelector', component:VagusImageSelector},
  {name:'QDBGraph',component:QDBGraph}
]
const defaultLayout = [
        {
          id: 'FlatmapViewer-1',
          x: 0, y: 2, w: 3, h: 8,
          componentKey: 'FlatmapViewer',
          componentName: 'Flatmap Viewer',
          component: FlatmapCmp,         
        },
        {
          id: 'VagusImageSelector-2',
          x: 3, y: 2, w: 3, h: 8,
          componentKey: 'VagusImageSelector',
          componentName: 'Image Selector',
          component: VagusImageSelector,         
        },
        {
          id: 'SubjectSelector-3',
          x: 0, y: 0, w: 6, h: 2,
          componentKey: 'SubjectSelector',
          componentName: 'Subject Selector',
          component: SubjectSelector,   
        },
        {
          id: 'BiolucidaViewer-4',
          x: 6, y: 0, w: 6, h: 10,
          componentKey: 'BiolucidaViewer',
          componentName: 'Biolucida Viewer',
          component: BiolucidaViewer,   
        },
        {
          id: 'QDBGraph-5',
          x: 0, y: 10, w: 6, h: 6,
          componentKey: 'QDBGraph',
          componentName: 'QDB Graph',
          component: QDBGraph,   
        }
      ]
const services = {
  $algoliaClient,
  AlgoliaConfig:{
    indexName:config?.public.ALGOLIA_INDEX_VERSION_PUBLISHED_TIME_DESC
  }
}
const dashboardOptions = ref({
  availableWidgets,
  defaultLayout,
  services
})
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
/* set style vars from outside the dashboard > customize to match your application */
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
:deep(.el-icon) {
  color: $purple;
}
:deep(svg > path) {
  fill: $purple;
}
:deep(.dash-header) {
  background-color: $darkBlue;
}
:deep(.beta-icon svg > path) {
  fill: #ff8400 !important;
}
:deep(.clear-filter-div){
  align-content: center;
  svg > path {
    fill: $lightPurple;
  }
}
:global(.beta-tooltip.el-popper.is-customized .el-popper__arrow::before) {
  background-color: #f9f2fc !important;
}
:global(.beta-tooltip.el-popper.is-customized) {
  background: #f9f2fc !important;
  border-color: $purple !important;
  border-radius: 4px;
}
</style>
