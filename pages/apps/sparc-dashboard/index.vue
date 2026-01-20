<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <page-hero class="py-24">
      <div class="page-hero-content">
        <div>
          <h1>{{ title }}</h1>
          <p>
            {{ description }}
          </p>
          <a
            href="https://docs.sparc.science/docs/sparc-dashboard"
            target="_blank"
          >
            <el-button class="secondary">
              View User Guide <svgo-icon-open class="icon-open" />
            </el-button>
          </a>
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
          <div class="beta-tag">
            <el-icon class="beta-icon"><WarningFilled /></el-icon>Beta
          </div>
        </template>
      </el-tooltip>
    </div>
    <PennsieveDashboard class="dashboard-app" :options="dashboardOptions" />
  </div>
</template>
<script setup>
import { pathOr } from "ramda";
import { defineAsyncComponent, ref } from "vue";
import {
  FlatmapWidget,
  BiolucidaViewer,
  SubjectSelector,
  VagusImageSelector,
  QDBGraph,
} from "sparc-dashwidgets";
import { PennsieveDashboard, MarkdownWidget } from "pennsieve-dashboard";
import "pennsieve-dashboard/style.css";
import "sparc-dashwidgets/style.css";

const config = useRuntimeConfig();
if (config.public.SHOW_SPARC_DASHBOARD == "false") {
  const router = useRouter();
  await router.push("/");
}

const { $contentfulClient } = useNuxtApp();

const breadcrumb = [
  {
    label: "Home",
    to: {
      name: "index",
    },
  },
  {
    to: {
      name: "apps",
    },
    label: "SPARC Apps",
  },
];

const FlatmapCmp = defineAsyncComponent(FlatmapWidget.loader);
const availableWidgets = [
  { name: "BiolucidaViewer", component: markRaw(BiolucidaViewer) },
  { name: "FlatmapViewer", component: markRaw(FlatmapCmp) },
  { name: "SubjectSelector", component: markRaw(SubjectSelector) },
  { name: "VagusImageSelector", component: markRaw(VagusImageSelector) },
  { name: "QDBGraph", component: markRaw(QDBGraph) },
  { name: "MarkdownWidget", component: markRaw(MarkdownWidget) },
];
const defaultLayout = [
  {
    id: "MarkdownWidget-6",
    x: 0,
    y: 0,
    w: 3,
    h: 15,
    componentKey: "MarkdownWidget",
    componentName: "Markdown Widget",
    component: MarkdownWidget,
    Props: {
      markdownText: [
        "# SPARC Dashboard",
        "",
        "This is a dashboard associated with the **[SPARC Phase 2](/about/consortia/sparc2)** consortium and was created as part of the SPARC **[REVA](/about/projects/6zXBE1gYa7Ge1ODOgnORyI)** award project containing datasets which include various types of images, videos, and scans across the length of the vagus nerve. As of now there is only one human subject, but more will be added as more data is curated and published. Using the different widgets available, you can filter, view, and gain insight into the data in various ways:",
        "",
        "## Widgets",
        "",
        "### Subject Selector",
        "Displays the available human subjects along with their metadata and provides the ability to filter image results based off a specific subject or subjects",
        "",
        "### Flatmap Viewer",
        "Displays a generalized version of the vagus nerve and provides the ability to filter image results based off a specific region of the vagus nerve for the subjects that are selected.",
        "",
        "### Image Selector",
        "Displays a list of image files that are available based off the selected filters and provides the ability to click on one for viewing",
        "",
        "### Biolucida Viewer",
        "Displays the image selected via the image selector widget along with its associated subject metadata and provides the ability to peruse images in more detail.",
        "",
        "### QDB Graph",
        "Displays different types of graphs and provides the ability to visualize all of the metrics available across all the different published datasets that comprise the aggregated REVA data. To edit the graph settings, hover over the graph and click the 'open graph settings' icon in the top-right. Note that any filters applied to the dashboard do not affect these results.",
        "",
        "### Markdown Widget",
        "Provides the ability for a user to add further textual stylized context to the dashboard.",
      ].join("\n"),
    },
  },
  {
    id: "FlatmapViewer-1",
    x: 3,
    y: 3,
    w: 3,
    h: 7,
    componentKey: "FlatmapViewer",
    componentName: "Flatmap Viewer",
    component: FlatmapCmp,
  },
  {
    id: "VagusImageSelector-2",
    x: 6,
    y: 3,
    w: 2,
    h: 7,
    componentKey: "VagusImageSelector",
    componentName: "Image Selector",
    component: VagusImageSelector,
  },
  {
    id: "SubjectSelector-3",
    x: 3,
    y: 0,
    w: 5,
    h: 3,
    componentKey: "SubjectSelector",
    componentName: "Subject Selector",
    component: SubjectSelector,
  },
  {
    id: "BiolucidaViewer-4",
    x: 8,
    y: 0,
    w: 4,
    h: 10,
    componentKey: "BiolucidaViewer",
    componentName: "Biolucida Viewer",
    component: BiolucidaViewer,
  },
  {
    id: "QDBGraph-5",
    x: 3,
    y: 10,
    w: 9,
    h: 5,
    componentKey: "QDBGraph",
    componentName: "QDB Graph",
    component: QDBGraph,
    Props: {
      defaultMetric: "fascicle-cross-section",
      defaultXAspect: "diameter",
      defaultYAspect: "distance",
      defaultVisualization: "Scatter",
      defaultDataPointLimit: 1000,
      searchAllData: false,
    },
  },
];

const services = {
  ScicrunchApiKey: config.public.FLI_API_KEY,
  FlatmapAPI: config.public.DASHBOARD_FLATMAP_API,
};

const dashboardOptions = ref({
  availableWidgets,
  defaultLayout,
  services,
});

const { data: dashboardData } = await useAsyncData(
  "dashboardPage",
  async () => {
    const pageData = await $contentfulClient.getEntry(
      config.public.ctf_sparc_dashboard_entry_id
    );
    return {
      fields: pageData.fields || {},
    };
  }
);

const title = computed(() =>
  pathOr("", ["fields", "name"], dashboardData.value)
);
const description = computed(() =>
  pathOr("", ["fields", "longDescription"], dashboardData.value)
);
</script>

<style scoped lang="scss">
@import "sparc-design-system-components-2/src/assets/_variables.scss";
/* set style vars from outside the dashboard > customize to match your application */
.icon-open {
  height: 1.5rem;
  width: 1.5rem;
  margin-bottom: 0;
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
:deep(.clear-filter-div) {
  align-content: center;
  svg > path {
    fill: $lightPurple;
  }
}
:deep(.range-apply-btn) {
  background: none;
}
:deep(.subject-selector) {
  overflow-x: auto !important;
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
