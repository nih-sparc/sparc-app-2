<template>
  <div class="plot-viewer-page">
    <div class="container p-0">
      <div class="plot-container">
        <div id="plotly_graph" ref="plotly_plot_ref" class="vue-plotly" />
        <client-only>
          <div class="plot-controls">
            <data-filtering
              v-model:selection-x="filteredx"
              v-model:selection-y="filteredy"
              :titles="titles"
              @filter-clicked="onFilterClicked"
            ></data-filtering>
            <zoom-management
              v-model="plotly_layout"
              :plotlyPlot="plotly_plot_ref"
              :plotlyPlotReady="plotly_plot_ready"
              :dataReset="dataReset"
            ></zoom-management>
          </div>
        </client-only>
      </div>
      <plot-viewer-metadata
        :plotType="plotType"
        :file="file"
        :datasetInfo="datasetInfo"
      />
    </div>
  </div>
</template>

<script setup>
import { pathOr } from "ramda";
import PlotViewerMetadata from "@/components/ViewersMetadata/PlotViewerMetadata.vue";

import discover from "@/services/discover";
import { extractS3BucketName } from "@/utils/common";
// import Plotly from "@/utils/setupPlotly";
import { getPlotlyInstance } from "@/utils/setupPlotly";

import { ZoomManagement, DataFiltering } from "@abi-software/plotcomponents";
import {
  applyFilter,
  extractTitles,
  convertToPlotlyData,
} from "@abi-software/plotdatahelpers";
// import { ClientOnly } from "#build/components";

const { plotInfo, file, datasetInfo } = defineProps({
  plotInfo: {
    type: Object,
    default: () => {
      return {
        share_link: "",
        status: "",
      };
    },
  },
  file: {
    type: Object,
    default: () => {},
  },
  datasetInfo: {
    type: Object,
    default: () => {},
  },
});

// const ZoomManagement = ref(null);
// const DataFiltering = ref(null);

let plotly_data = ref(null);
let plotly_layout = ref(null);
let plotly_options = ref(null);

const filteredx = ref([]);
const filteredy = ref([]);
const titles = ref({ x: [], y: [] });
const dataReset = ref(true);
const plotly_plot_ref = ref(null);
const plotly_plot_ready = ref(false);
const source_uri = ref({});
const supplemental_data = ref([]);
const metadata = ref({});

let filtered_plotly_data = ref(null);

const isLoading = computed(
  () => toValue(plotly_plot_ref) === null || toValue(plotly_data) === null
);
const plotType = computed(() => pathOr("", ["attrs", "style"], metadata));

// const result = defineAsyncComponent(() =>
//   import("@abi-software/plotcomponents").then(module => {
//     console.log("Module:");
//     console.log(module);
//     return [module.ZoomManagement, module.DataFiltering];
//   })
// );
// console.log("Result:");
// console.log(result);

function handlePlotDataError(error) {
  if (error.message === "Not Found") {
    console.log(
      "Some of the data for the plot is missing or incorrectly referenced."
    );
  } else {
    console.log("An unknown error occured:", error.message);
  }
}

function isArrayWithEmptyString(arr) {
  return arr instanceof Array && arr.length === 1 && arr[0] === "";
}

watch(
  [() => plotInfo, () => datasetInfo],
  () => {
    const s3Bucket = datasetInfo
      ? extractS3BucketName(datasetInfo.uri)
      : undefined;

    metadata.value = JSON.parse(
      toValue(plotInfo).datacite.supplemental_json_metadata.description
    );
    let apiCalls = [
      discover.downloadLink(
        `${toValue(datasetInfo).id}/files/${toValue(plotInfo).dataset.path}`,
        s3Bucket
      ),
    ];
    if (
      toValue(plotInfo).datacite.isSupplementedBy.path.length > 0 &&
      !isArrayWithEmptyString(toValue(plotInfo).datacite.isSupplementedBy.path)
    ) {
      apiCalls.push(
        discover.downloadLink(
          `${toValue(datasetInfo).id}/files/${
            toValue(plotInfo).datacite.isSupplementedBy.path[0]
          }`,
          s3Bucket
        )
      );
    }
    supplemental_data.value = [];
    Promise.allSettled(apiCalls).then(responses => {
      if (responses[0].value.status === 200) {
        source_uri.value = responses[0].value.data;
        if (responses.length > 1 && responses[1].value.status === 200) {
          supplemental_data.value = [{ uri: responses[1].value.data }];
        }
      }
    });
  },
  { immediate: true, deep: true }
);

watch(source_uri, () => {
  convertToPlotlyData(
    toValue(source_uri),
    toValue(metadata),
    toValue(supplemental_data),
    plotly_data,
    plotly_layout,
    plotly_options,
    handlePlotDataError
  );
});

function onFilterClicked() {
  filtered_plotly_data.value = applyFilter(plotly_data, toValue(metadata), {
    x: toValue(filteredx),
    y: toValue(filteredy),
  });
}

async function updatePlot() {
  const Plotly = await getPlotlyInstance();
  Plotly.react(
    toValue(plotly_plot_ref),
    filtered_plotly_data.value
      ? toValue(filtered_plotly_data)
      : toValue(plotly_data),
    toValue(plotly_layout),
    {
      loading: false,
      scrollZoom: true,
      // displayModeBar: false,
      displaylogo: false,
      modeBarButtonsToRemove: [
        "zoom",
        "pan2d",
        "zoomIn2d",
        "zoomOut2d",
        "autoScale2d",
        "resetScale2d",
      ],
      ...toValue(plotly_options),
    }
  ).then(() => {
    plotly_plot_ready.value = true;
  });
}

watch([plotly_layout], () => {
  if (!toValue(isLoading) && toValue(plotly_layout).xaxis !== undefined) {
    updatePlot();
  }
});

watch(
  [plotly_data, filtered_plotly_data],
  () => {
    if (!toValue(isLoading)) {
      dataReset.value = false;
      setTimeout(() => {
        dataReset.value = true;
      }, 1);

      // plotly_plot_ready.value = true;

      extractTitles(plotly_data, toValue(metadata), titles);
      updatePlot();
    }
  },
  { deep: true }
);

// async setup(props) {
//   try {
//     const s3Bucket = datasetInfo ? extractS3BucketName(datasetInfo.uri) : undefined

//     const plot_annotation = plotInfo.datacite
//     const file_path = `${datasetInfo.id}/files/${plotInfo.dataset.path}`
//     const source_url_response = await discover.downloadLink(file_path, s3Bucket)
//     let source_url = source_url_response.data
//     console.log("-----------------------")
//     console.log(file_path)
//     console.log(s3Bucket)
//     console.log(source_url)
//     console.log('--- end ---')

//     const metadata = JSON.parse(
//       plot_annotation.supplemental_json_metadata.description
//     )

//     let supplemental_data = []
//     console.log("plot annotation:")
//     console.log(plot_annotation)
//     console.log(plot_annotation.isSupplementedBy)
//     if (plot_annotation.isSupplementedBy && !isArrayWithEmptyString(plot_annotation.isSupplementedBy.path)) {
//       console.log("doing this bit.")
//       console.log(plot_annotation.isSupplementedBy)
//       let tmp_path = plot_annotation.isSupplementedBy.path[0]
//       console.log('tmp path:', tmp_path)
//       if (tmp_path) {
//         console.log('tmp path is something')
//       } else {
//         console.log('do nothing, no tmp path.')
//       }
//       // Hack to fix path entry.
//       if (tmp_path === '../derivative/sub-1/subject1_header.txt') {
//         tmp_path = 'derivative/sub-1/sam-1/subject1_header.txt'
//       }

//       const supplemental_file_path = `${props.datasetInfo.id}/files/${tmp_path}`

//       const supplemental_url_response = await discover.downloadLink(
//         supplemental_file_path,
//         s3Bucket
//       )
//       let supplemental_url = supplemental_url_response.data
//       supplemental_data.push({
//         url: supplemental_url
//       })
//     }
//     console.log("return:")
//     console.log(source_url)
//     console.log(metadata)
//     console.log(supplemental_data)
//     console.log('--- end ---')
//     return {
//       source_url,
//       metadata: metadata ? metadata : {
//         version: "1.1.0",
//         type: "plot",
//         attrs: {
//           style: "timeseries"
//         }
//       },
//       supplemental_data
//     }
//   } catch(e) {
//     console.log(e)
//   }
// },
</script>

<style lang="scss">
@import "@abi-software/plotcomponents/dist/plotcomponents.css";
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.plot-container {
  margin-top: 1.5rem;
  // height: 90vh;
  max-width: calc(100% - 48px);
}

.plot-controls {
  display: flex;
  padding-top: 0.5rem;
  align-items: center;
}

.map-icon {
  color: $purple
}

.page-heading {
  margin-bottom: 1.375rem;
}

.container {
  padding: 0;
}
</style>
