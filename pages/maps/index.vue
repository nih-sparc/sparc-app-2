<template>
  <div class="maps">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <page-hero>
      <h1>Maps</h1>
      <p>
        SPARC is creating detailed PNS maps based on SPARC data and information
        available from the literature. The maps you see here are not yet
        comprehensive and are largely derived from regions of the nervous system
        where SPARC data has been published on this site, supplemented in some
        regions by published knowledge of rat anatomy. New connectivity and
        species specificity in anatomy and connectivity will be added as the 
        SPARC program progresses.
      </p>
    </page-hero>
    <portal-features
      v-if="isLandingPage"
      :features="entries"
      title="What can I do with Maps?"
      :icon-is-top-element="false"
    />
    <div v-else ref="mappage" class="page-wrap portalmapcontainer">
      <client-only placeholder="Loading components...">
        <div class="mapClass">
          <map-content
            class="map"
            ref="map"
            :state="state"
            :starting-map="startingMap"
            :options="options"
            :share-link="shareLink"
            @updateShareLinkRequested="updateUUID"
            @isReady="mapMounted" 
          />
        </div>
      </client-only>
    </div>
  </div>
</template>

<script>

import flatmaps from '@/services/flatmaps'
import scicrunch from '@/services/scicrunch'

import FetchPennsieveFile from '@/mixins/fetch-pennsieve-file'

import PortalFeatures from '@/components/PortalFeatures/PortalFeatures.vue'

import { extractS3BucketName } from '@/utils/common'
import { successMessage, failMessage } from '@/utils/notification-messages'
import { getAlgoliaFacets, facetPropPathMapping } from '@/utils/algolia'

const formatLabel = (text) => {
  if (text && (typeof text === 'string' || text instanceof String))
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  return text
}

const getScaffoldState = async (portalApi, uuid, $axios) => {
  if (uuid) {
    let url = `${portalApi}/scaffold/getstate`
    return await $axios.post(url, { uuid: uuid }).then((response) => response.data)
  }
}

const getScaffoldEntry = async (portalApi, route, $axios, s3Bucket) => {
  //Check if file path from scicrunch can be found on the server
  const filePath = route.query.file_path
  let path = `${route.query.dataset_id}/${filePath}`
  if (s3Bucket) {
    path = path + `?s3BucketName=${s3Bucket}`
  }
  let result = await $axios
    .get(`${portalApi}/exists/${path}`)
    .then((response) => {
      if (response.data.exists && response.data.exists !== 'false') {
        return {
          type: 'Scaffold',
          label: `Dataset ${route.query.dataset_id}`,
          url: `${portalApi}/s3-resource/${path}`,
          viewUrl: route.query.ViewURL,
        }
      } else {
        return undefined
      }
    })

  //Cannot be found using the file path from SciCrunch, use Pennsieve
  //instead
  if (!result) {
    const file = await FetchPennsieveFile.methods.fetchPennsieveFile(
      filePath,
      route.query.dataset_id,
      route.query.dataset_version
    )
    path = `${route.query.dataset_id}/${file.path}`
    if (s3Bucket) {
      path = path + `?s3BucketName=${s3Bucket}`
    }
    result = await $axios
      .get(`${portalApi}/exists/${path}`)
      .then((response) => {
        if (response.data.exists && response.data.exists !== 'false') {
          return {
            type: 'Scaffold',
            label: `Dataset ${route.query.dataset_id}`,
            url: `${portalApi}/s3-resource/${path}`,
            viewUrl: route.query.ViewURL,
          }
        }
      })
  }
  //Finally check if an old id was used for storing the viewport.
  //If so, get it from the server
  if (result) {
    if (route.query.scaffoldid) {
      const state = await getScaffoldState(portalApi, route.query.scaffoldid, $axios)
      result.state = state.state
    }
    return result
  }
}

const getDatasetInfo = async (datasetId, datasetVersion, discover_api, $pennsieveApiClient) => {
  const url = `${discover_api}/datasets/${datasetId}`
  let datasetUrl = datasetVersion ? `${url}/versions/${datasetVersion}` : url
  let datasetInfo = {}
  await $pennsieveApiClient.value.get(datasetUrl).catch(error => {
    console.log(`Could not get the dataset's info: ${error}`)
  }).then(({ data }) => {
    datasetInfo = data
  })
  return datasetInfo
}

const checkSpecies = (route, organ, organ_name, taxo, for_species) => {
  //Display error message if species information is missing or cannot be found
  //Old link may contain the for_species as undefined
  let failMessage = undefined
  let successMessage = undefined
  if (
    route.query.for_species &&
    route.query.for_species !== 'undefined'
  ) {
    if (
      route.query.for_species !== flatmaps.speciesMap[taxo]
    ) {
      failMessage = `Sorry! A flatmap for ${for_species} species does not yet exist. The ${organ_name} of a rat has been shown instead.`
    }
  } else if (route.query.fid) {
    successMessage = "A flatmap's unique id is provided, a legacy map may be displayed instead."
  } else {
    failMessage = `Sorry! Species information cannot be found. The ${organ} of a rat has been shown instead.`
  }
  return {successMessage, failMessage}
}

const updateFacets = async (algoliaIndex, dataset_id) => {
  //Create the array of facets to pass onto the sidebar
  const filter = `objectID:${dataset_id}`
  const facets = await getAlgoliaFacets(algoliaIndex, facetPropPathMapping, filter).then(data => {
    return data
  });
  const processed = []
  facets.forEach(facet => {
    if (facet.key && facet.key === 'anatomy.organ.name' ||
    facet.key === 'organisms.primary.species.name') {
      let term = formatLabel(facet.label);
      facet.children.forEach(child => {
        processed.push({
          facet: formatLabel(child.label),
          term: term,
          facetPropPath: facet.key,
        });
      });
    }
  });

  return processed
}

//Process any taxon or anatomy parameters if they are available
const processEntry = async (route) => {
  //uberionid and taxo are now deprecated and replaced by Anatomy and taxon
  let anatomy = route.query.anatomy ? route.query.anatomy : route.query.uberonid
  const taxon = route.query.taxon ? route.query.taxon : route.query.taxo
  let organ_name = undefined
  let currentEntry = undefined
  let successMessage = undefined
  let failMessage = undefined
  let startingMap = "AC"
  if (anatomy || taxon) {
    //Specify the gender of human
    let biologicalSex = route.query.biologicalSex
    if (taxon && taxon === 'NCBITaxon:9606') {
      if (!biologicalSex) {
        biologicalSex = 'PATO:0000384'
      }
    }
    try {
      organ_name = await scicrunch.getOrganFromUberonId(anatomy)
      //We do not want to display the body proper
      if (organ_name && organ_name.toLowerCase() === 'body proper') {
        anatomy = undefined
      }
    } catch (e) {
      // Error caught return empty data.
    }
    if (route.query.type === 'ac' || route.query.type === 'flatmap') {
      currentEntry = {
        type: 'MultiFlatmap',
        taxo: taxon,
        biologicalSex: biologicalSex,
        uuid: route.query.fid,
        organ: anatomy,
      }
      const messages = checkSpecies(route, anatomy, organ_name, taxon, route.query.for_species)
      successMessage = messages.successMessage
      failMessage = messages.failMessage
    }
    if (route.query.type === 'fc' && anatomy) {
      currentEntry = {
        type: 'Flatmap',
        resource: 'FunctionalConnectivity',
        label: 'Functional',
        state: {searchTerm: anatomy}
      }
    }
  }
  if (route.query.type === 'ac' || route.query.type === 'flatmap') {
    startingMap = "AC"
  }
  if (route.query.type === 'fc') {
    startingMap = "FC"
  }
  return [startingMap, organ_name, currentEntry, successMessage, failMessage, []]
}

const restoreStateWithUUID = async (route, $axios, sparcApi) => {
  //Restore settings from a saved state
  let uuid = undefined
  let state = undefined
  let successMessage = undefined
  let failMessage = undefined
  if (route.query.id) {
    uuid = route.query.id
    await $axios.post(`${sparcApi}/map/getstate`, {
        uuid: uuid,
      })
      .then((response) => {
        console.log(uuid, response)
        if (response && response.data && response.data.state) {
          state = response.data.state
          successMessage = 
            `Saved state retrieved succesfuly, please wait while the state is being resumed.`
        }
      })
      .catch(() => {
        failMessage = 
          `Sorry! We can not retrieve the saved stated. Please check later or consider submitting a bug report.`
      })
  }

  return [uuid, state, successMessage, failMessage]
}

const openViewWithQuery = async (route, $axios, sparcApi, algoliaIndex, discover_api, $pennsieveApiClient) => {
  //Open the map with specific view defined by the query.
  //First get the bucket and facets information if available
  let s3Bucket = undefined
  let startingMap = "AC"
  let organ_name = undefined
  let currentEntry = undefined
  let successMessage = undefined
  let failMessage = undefined
  let facets = []

  if (route.query.dataset_id && route.query.dataset_version) {
    const datasetInfo = await getDatasetInfo(
      route.query.dataset_id,
      route.query.dataset_version,
      discover_api,
      $pennsieveApiClient
    )
    s3Bucket = datasetInfo
      ? extractS3BucketName(datasetInfo.uri)
      : undefined
    facets = await updateFacets(algoliaIndex, route.query.dataset_id)
  }
  //Get the entry information if we are not opening with the default settings or
  //resuming from previous saved state
  if (route.query.type === 'scaffold') {
    currentEntry = await getScaffoldEntry(
      sparcApi,
      route,
      $axios,
      s3Bucket
    )
    if (!currentEntry) {
      failMessage = `Sorry! The specified scaffold cannot be found. Please check later or consider submitting a bug report.`
    }
  } else if (route.query.type === 'fc' || 
    route.query.type === 'ac' || 
    route.query.type === 'flatmap') {
    return await processEntry(route)
  } else if (route.query.type === 'wholebody') {
    startingMap = "WholeBody"
  }

  return [startingMap, organ_name, currentEntry, successMessage, failMessage, facets]
}

export default {
  name: 'MapsPage',
  components: {
    PortalFeatures,
  },
  async setup() {
    const config = useRuntimeConfig()
    const { $algoliaClient, $axios, $pennsieveApiClient } = useNuxtApp()
    let startingMap = "AC"
    let organ_name = undefined
    let currentEntry = undefined
    let successMessage = undefined
    let failMessage = undefined
    let facets = []
    let uuid = undefined
    let state = undefined

    const options = {
      sparcApi: config.public.portal_api,
      algoliaIndex: config.public.ALGOLIA_INDEX,
      algoliaKey: config.public.ALGOLIA_API_KEY,
      algoliaId: config.public.ALGOLIA_APP_ID,
      pennsieveApi: config.public.discover_api_host.replace('/discover', ''),
      flatmapAPI: config.public.flatmap_api,
      nlLinkPrefix: config.public.NL_LINK_PREFIX,
      rootUrl: config.public.ROOT_URL,
    }
    let lastChar = options.sparcApi.substr(-1)
    if (lastChar != '/') {
      options.sparcApi = options.sparcApi + '/'
    }
    const algoliaIndex = await $algoliaClient.initIndex(config.public.ALGOLIA_INDEX)

    const route = useRoute()

    if (route.query.id) {
      [ uuid, state, successMessage, failMessage ] = await restoreStateWithUUID(route, $axios, options.sparcApi)
    } else {
      //Now check if it should open a specific view based on query
      [
        startingMap,
        organ_name,
        currentEntry,
        successMessage,
        failMessage,
        facets
      ] = await openViewWithQuery(route, $axios, options.sparcApi, algoliaIndex,
            config.public.discover_api_host, $pennsieveApiClient)
    }   

    return {
      algoliaIndex,
      options,
      startingMap,
      organ_name,
      currentEntry,
      successMessage,
      failMessage,
      facets,
      uuid,
      state
    }
  },
  data() {
    return {
      resources: [],
      title: 'Maps',
      breadcrumb: [
        {
          to: {
            name: 'index',
          },
          label: 'Home',
        },
      ],
      shareLink: `${process.env.ROOT_URL}${this.$route.fullPath}`,
      entries: [
        {
          fields: {
            buttonLink: 'maps?type=ac',
            buttonText: 'View AC Map',
            description:
              'The Anatomical Connectivity (AC) flatmaps show physical connectivity derived from SCKAN in an anatomical schematic context.',
            title: 'Anatomical Connectivity',
            icon: {
              fields: {
                file: {
                  url: new URL('~/assets/ac-map.png', import.meta.url).href,
                },
              },
            },
          },
        },
        {
          fields: {
            buttonLink: 'maps?type=fc',
            buttonText: 'View FC Map',
            description:
              'The Functional Connectivity (FC) flatmap provides a visualisation of semantic connectivity and a future interface to ANS models.',
            title: 'Functional Connectivity',
            icon: {
              fields: {
                file: {
                  url: new URL('~/assets/fc-map.png', import.meta.url).href,
                },
              },
            },
          },
        },
        {
          fields: {
            buttonLink: 'maps?type=wholebody',
            buttonText: 'View 3D Body',
            description:
              'The 3D whole-body shows physical connectivity derived from SCKAN in an anatomically realistic context.',
            title: '3D Whole Body',
            icon: {
              fields: {
                file: {
                  url: new URL('~/assets/3d-map.png', import.meta.url).href,
                },
              },
            },
          },
        },
      ],
    }
  },
  head() {
    return {
      title: this.title,
      meta: [
        {
          hid: 'og:title',
          property: 'og:title',
          content: this.title,
        },
        {
          hid: 'description',
          name: 'description',
          content: 'SPARC is creating detailed PNS maps based on SPARC data and information available from the literature.'
        },
      ]
    }
  },
  mounted: function() {
    if (this.successMessage) {
      this.$message(successMessage(this.successMessage))
    }
    if (this.failMessage) {
      this.$message(successMessage(this.failMessage))
    }
  },
  created: function() {
    this.shareLink = `${this.options.rootUrl}${this.$route.fullPath}`
  },
  watch: {
    currentEntry: 'currentEntryUpdated',
    facets: 'facetsUpdated',
    //isLandingPage: 'openViewWithQuery',
  },
  fetchOnServer: false,
  computed: {
    isLandingPage: function () {
      return Object.keys(this.$route.query).length === 0
    },
  },
  methods: {
    updateUUID: function () {
      let url = this.options.sparcApi + `map/getshareid`
      let state = this.$refs.map.getState()
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ state: state }),
      })
      .then((response) => response.json())
      .then((data) => {
        this.uuid = data.uuid
        this.$router.replace({ query: { id: data.uuid } }).then(() => {
          this.shareLink = `${this.options.rootUrl}${this.$route.fullPath}`
        })
      })
    },
    facetsUpdated: function () {
      console.log(this.facets)
      if (this.facets.length > 0 && this.$refs.map) this.$refs.map.openSearch(this.facets, "")
    },
    currentEntryUpdated: function () {
      if (this.$refs.map && this.currentEntry) {
        this.$refs.map.setCurrentEntry(this.currentEntry)
      }
    },
    mapMounted: function () {
      this.currentEntryUpdated()
      this.facetsUpdated()
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.maps {
  background-color: #f5f7fa;

  .portalmapcontainer {
    margin-top: 1.5rem;
    height: 90vh;
    max-width: calc(100% - 48px);
    padding-left: 24px;
  }

  .page-wrap {
    &__results {
      font-size: 0.875em;
      font-weight: normal;
      line-height: 1em;

      @media screen and (max-width: 768px) {
        margin-left: 0.9375rem;
      }

      p {
        margin-top: 1.5rem;
      }
    }
    @media (min-width: 48em) {
      padding-top: 0;
    }
  }
}
</style>

<style lang="scss">
//@import 'sparc-design-system-components-2/src/assets/_variables.scss';
@import '@abi-software/mapintegratedvuer/dist/style.css';
@import '@abi-software/mapintegratedvuer/src/assets/mapicon-species-style.css';


.mapClass {
  position: relative;
  width: 100%;
  height: 100%;
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);
  
  .map-icon {
    color: #8300bf!important;
  }

  .pathway-container {
    .container {
      padding-left: 0px;
    }
  }

  .el-popover.right-popper {
    .popper__arrow {
      border-top-color:transparent!important;
      border-bottom-color:transparent!important;
    }
  }
}

.gallery-popper {
  background: #f3ecf6 !important;
  border: 1px solid #8300bf;
  border-radius: 4px;
  color: #303133 !important;
  font-size: 12px;
  line-height: 1rem;
  height: 1rem;
  padding: 10px;
  &.el-popper[x-placement^='top'] {
    .popper__arrow {
      border-top-color: #8300bf !important;
    }
    .popper__arrow:after {
      border-top-color: #f3ecf6 !important;
    }
  }
}
</style>
