<template>
  <Head>
    <Title>{{ title }}</Title>
    <Meta name="og:title" hid="og:title" :content="title" />
    <Meta name="twitter:title" :content="title" />
    <Meta name="description" hid="description" content="SPARC is creating detailed PNS maps based on SPARC data and information available from the literature." />
    <Meta name="og:description" hid="og:description" content="SPARC is creating detailed PNS maps based on SPARC data and information available from the literature." />
    <Meta name="twitter:description" content="SPARC is creating detailed PNS maps based on SPARC data and information available from the literature." />
  </Head>
  <div class="maps">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <page-hero class="py-24">
      <div class="content">
        <div>
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
        </div>
        <div class="portal-features">
          
          <div class="feature-container" v-for="item in appEntries">
            <img class="logo" :src="item.logoUrl" />
            <el-popover :width="'fit-content'">
              <template #reference>
                <a :href="item.buttonLink">
                  <el-button class="secondary">{{ item.buttonText }}</el-button>
                </a>
              </template>
              <template #default>
                <div style="display: flex; flex-direction: column; gap: 10px">
                  <el-switch
                    v-if="item.buttonText === 'View AC Map'"
                    v-model="openNewMap"
                    size="large"
                    active-text="New view"
                    inactive-text="Primary"
                  />
                  <el-button
                    v-for="(entry, label) in mapOptions[item.buttonText]"
                    @click="setCurrentEntry(entry)"
                  >
                    Open {{ label }}
                  </el-button>
                </div>
              </template>
            </el-popover>
          </div>
        </div>
      </div>
    </page-hero>
    <div ref="mappage" class="page-wrap portalmapcontainer">
      <MapViewer class="mapviewer" ref="mapviewer" :state="state" :starting-map="startingMap" :options="options"
        :share-link="shareLink" @updateShareLinkRequested="updateUUID" @isReady="viewerMounted" @mapLoaded="mapMounted" />
    </div>
  </div>
</template>

<script>
import flatmaps from '@/services/flatmaps'
import scicrunch from '@/services/scicrunch'

import FetchPennsieveFile from '@/mixins/fetch-pennsieve-file'

import { pathOr } from 'ramda'
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
  const target = flatmaps.speciesMap[taxo]
  if (
    for_species && for_species !== 'undefined'
  ) {
    if (for_species !== target) {
      failMessage = `Sorry! A flatmap for ${for_species} species does not yet exist. The ${organ_name} of a human male has been shown instead.`
    } else if (!organ) {
      failMessage = `Sorry! Applicable entity is not yet available. A generic flatmap for ${for_species} species has been shown instead.`
    }
  } else if (route.query.fid) {
    successMessage = "A flatmap's unique id is provided, a legacy map may be displayed instead."
  } else {
    if (!target) {
      if (organ) {
        failMessage += `The ${organ_name} of a human male has been shown instead.`
      } else {
        failMessage += 'A generic human male flatmap has been shown instead.'
      }
    }
  }
  return { successMessage, failMessage }
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
        state: { searchTerm: anatomy }
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
  const maxRetry = 3
  const getState = async (uuid) => {
    await $axios.post(`${sparcApi}/map/getstate`, {
      uuid: uuid,
    })
      .then((response) => {
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
  if (route.query.id) {
    uuid = route.query.id
    for (let attempt = 0; attempt < maxRetry && !successMessage; attempt++) {
      await getState(uuid)
    }
  }
  if (successMessage) {
    failMessage = undefined
  }
  return [uuid, state, successMessage, failMessage]
}

const openViewWithQuery = async (router, route, $axios, sparcApi, algoliaIndex, discover_api, $pennsieveApiClient) => {
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
  } else {
    //Only display the error if there is an invalid parameters
    if (Object.keys(route.query).length > 0) {
      failMessage = 'Invalid parameters were detected. Default parameters will now be used.'
    }
    router.replace({ ...router.currentRoute, query: { type: 'ac' } })
  }

  return [startingMap, organ_name, currentEntry, successMessage, failMessage, facets]
}

const constructMapEntries = (apps) => {
  if (!apps) return []
  return apps.filter((app) => app.fields.url.startsWith('/apps/maps?type=')).map((app) => {
    return {
      buttonLink: pathOr('', ['fields', 'url'], app),
      buttonText: pathOr('', ['fields', 'buttonText'], app),
      logoUrl: pathOr('', ['fields', 'logo', 'fields', 'file', 'url'], app),
    }
  })
}

export default {
  name: 'MapsPage',
  async setup() {
    const config = useRuntimeConfig()
    const { $algoliaClient, $axios, $pennsieveApiClient, $contentfulClient } = useNuxtApp()
    const router = useRouter()
    const route = useRoute()
    let startingMap = "AC"
    let organ_name = undefined
    let currentEntry = undefined
    let successMessage = undefined
    let failMessage = undefined
    let facets = []
    let uuid = undefined
    let state = undefined
    let viewingMode = route.query.mode

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
    const appPage = await $contentfulClient.getEntry(config.public.ctf_apps_page_id)

    if (route.query.id) {
      [uuid, state, successMessage, failMessage] = await restoreStateWithUUID(route, $axios, options.sparcApi)
    } else {
      //Now check if it should open a specific view based on query
      [
        startingMap,
        organ_name,
        currentEntry,
        successMessage,
        failMessage,
        facets
      ] = await openViewWithQuery(router, route, $axios, options.sparcApi, algoliaIndex,
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
      state,
      viewingMode,
      appEntries: constructMapEntries(appPage.fields?.apps)
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
        {
          to: {
            name: 'apps',
          },
          label: 'SPARC Apps',
        },
      ],
      shareLink: `${process.env.ROOT_URL}${this.$route.fullPath}`,
      openNewMap: true,
      mapOptions: {
        'View AC Map': {
          'Human Female': {
            type: 'MultiFlatmap',
            resource: 'Human Female',
            taxo: 'NCBITaxon:9606',
            biologicalSex: 'PATO:0000383',
          },
          'Human Male': {
            type: 'MultiFlatmap',
            resource: 'Human Male',
            taxo: 'NCBITaxon:9606',
            biologicalSex: 'PATO:0000384',
          },
          'Rat': {
            type: 'MultiFlatmap',
            resource: 'Rat',
            taxo: 'NCBITaxon:10114',
          },
          'Mouse': {
            type: 'MultiFlatmap',
            resource: 'Mouse',
            taxo: 'NCBITaxon:10090',
          },
          'Pig': {
            type: 'MultiFlatmap',
            resource: 'Pig',
            taxo: 'NCBITaxon:9823',
          },
          'Cat': {
            type: 'MultiFlatmap',
            resource: 'Cat',
            taxo: 'NCBITaxon:9685',
          },
        },
        'View 3D Body': {
          '3D Human': {
            type: 'Scaffold',
            label: 'Human',
            isBodyScaffold: true,
          },
          '3D Rat': {
            type: 'Scaffold',
            label: 'Rat',
            isBodyScaffold: true,
          },
        },
        'View FC Map': {
          'FC': {
            type: 'Flatmap',
            resource: 'FunctionalConnectivity',
            label: 'Functional',
          },
        },
      }
    }
  },
  mounted: function () {
    if (this.successMessage) {
      successMessage(this.successMessage)
    }
    if (this.failMessage) {
      failMessage(this.failMessage)
    }
  },
  created: function () {
    this.shareLink = `${this.options.rootUrl}${this.$route.fullPath}`
  },
  watch: {
    currentEntry: 'currentEntryUpdated',
    facets: 'facetsUpdated',
  },
  fetchOnServer: false,
  methods: {
    updateUUID: function () {
      let url = this.options.sparcApi + `map/getshareid`
      let state = this._instance.getState()
      let maxRetry = 3
      const getShareLink = (attempt) => {
        fetch(url, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ state: state }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Unsuccessful attempt to get shareid')
        })
        .then((data) => {
          this.uuid = data.uuid
          this.$router.replace({ query: { id: data.uuid } }).then(() => {
            this.shareLink = `${this.options.rootUrl}${this.$route.fullPath}`
          })
        })
        .catch((error) => {
          console.log(`Unable to create permalink: attempt ${attempt} of ${maxRetry}`)
          if (maxRetry > attempt) {
            getShareLink(attempt + 1)
          } else {
            this.shareLink = `We have encountered an error, please try again.`
            failMessage("We are unable to create a permalink at this moment, please try again later.")
          }
        })
      }
      getShareLink(1)
    },
    facetsUpdated: function () {
      if (this.facets.length > 0 && this._instance) this._instance.openSearch(this.facets, "")
    },
    currentEntryUpdated: function () {
      if (this._instance && this.currentEntry) {
        this._instance.setCurrentEntry(this.currentEntry)
      }
    },
    setCurrentEntry: function (entry) {
      if (this._instance) {
        const mapEntry = Object.assign({}, entry)
        if (entry.type === 'MultiFlatmap' && !this.openNewMap) {
          delete mapEntry.resource
        }
        this._instance.setCurrentEntry(mapEntry)
      }
    },
    changeViewingMode: function (map) {
      if (this.viewingMode) {
        map.changeViewingMode(this.viewingMode.charAt(0).toUpperCase() + this.viewingMode.slice(1));
      }
    },
    viewerMounted: function () {
      this._instance = this.$refs.mapviewer.getInstance();
      this.currentEntryUpdated()
      this.facetsUpdated()
    },
    mapMounted: function (map) {
      this.changeViewingMode(map)
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

.content {
  display: flex;
  align-items: center;

  @media screen and (max-width: 64rem) {
    display: block;
  }
}

.portal-features {
  display: flex;
  width: 33%;
}

.feature-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;

  .logo {
    height: 6rem;
    margin-bottom: 1.5rem;
  }
}

.el-button+.el-button {
  margin-left: 0px;
}
</style>

<style lang="scss">
//@import 'sparc-design-system-components-2/src/assets/_variables.scss';
@import '@abi-software/mapintegratedvuer/src/assets/mapicon-species-style.css';

</style>
