<template>
  <Head>
    <Title>{{ datasetTitle }}</Title>
    <Meta name="og:title" hid="og:title" :content="datasetTitle" />
    <Meta name="twitter:title" :content="datasetTitle" />
    <Meta name="description" hid="description" :content="datasetDescription" />
    <Meta name="og:description" hid="og:description" :content="datasetDescription" />
    <Meta name="twitter:description" :content="datasetDescription" />
    <Meta name="DC.type" content="Dataset" />
    <Meta name="DC.description" :content="datasetDescription" />
    <Meta name="DCTERMS.license" :content="licenseLink" />
    <Meta name="og:type" content="website" />
    <Meta name="og:title" :content="datasetTitle" />
    <Meta name="og:image" :content="datasetInfo?.banner" />
    <Meta name="og:image:alt" :content="`${datasetTitle} Banner Image`" />
    <Meta name="og:site_name" content="SPARC Portal" />
    <Meta name="twitter:card" content="summary" />
    <Meta name="twitter:site" content="@sparc_science" />
    <Meta name="twitter:image" :content="datasetInfo?.banner" />
    <Meta name="DC.creator" :content="JSON.stringify(creators)" />
    <Meta name="DC.identifier" :content="doiLink" scheme="DCTERMS.URI" />
    <Meta name="DC.publisher" content="Pennsieve Discover" />
    <Meta name="DC.date" :content="originallyPublishedDate" scheme="DCTERMS.W3CDTF" />
    <Meta name="DC.version" :content="datasetInfo?.version.toString()" />
    <Meta name="robots" content="noindex, nofollow" />
  </Head>
  <div class="dataset-details pb-16">

      <breadcrumb :breadcrumb="breadcrumb" :title="datasetTitle" />
      <template v-if="hasError">
        <template v-if="errorType == '404'">
          <error404 />
        </template>
        <template v-else>
          <error400 />
        </template>
      </template>
      <div v-else-if="showTombstone">
        <tombstone :dataset-details="datasetInfo" />
      </div>
      <div class="details-container" v-else>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="8" :md="6" :lg="5" class="left-column">
            <dataset-action-box />
            <similar-datasets-info-box :associated-projects="associatedProjects" :dataset-type-name="datasetTypeName" />
          </el-col>
          <el-col :xs="24" :sm="16" :md="18" :lg="19" class="right-column">
            <dataset-header class="dataset-header" :latestVersionRevision="latestVersionRevision"
              :latestVersionDate="latestVersionDate" :numCitations="numCitations" :numDownloads="numDownloads" />
            <client-only>
              <content-tab-card class="mt-32" id="datasetDetailsTabsContainer" :tabs="tabs" :active-tab-id="activeTabId"
                @tab-changed="tabChanged" routeName="datasetDetailsTab">
                <dataset-description-info class="body1" v-show="activeTabId === 'abstract'" :markdown="markdown"
                  :dataset-records="datasetRecords" :loading-markdown="loadingMarkdown" :dataset-tags="datasetTags" />
                <dataset-about-info class="body1" v-show="activeTabId === 'about'"
                  :latestVersionRevision="latestVersionRevision" :latestVersionDate="latestVersionDate"
                  :associated-projects="associatedProjects" />
                <citation-details class="body1" v-show="activeTabId === 'cite'" :doi-value="datasetInfo.doi" />
                <dataset-files-info class="body1" v-if="hasFiles" v-show="activeTabId === 'files'" />
                <images-gallery class="body1" :markdown="markdown.markdownTop" v-show="activeTabId === 'images'" />
                <dataset-references v-if="hasCitations" class="body1" v-show="activeTabId === 'references'"
                  :primary-publications="primaryPublications" :associated-publications="associatedPublications" />
                <version-history v-if="canViewVersions" class="body1" v-show="activeTabId === 'versions'"
                  :versions="versions" />
              </content-tab-card>
            </client-only>
          </el-col>
        </el-row>
      </div>
      <dataset-version-message v-if="!isLatestVersion" :current-version="datasetInfo.version"
        :dataset-details="datasetInfo" />
    
  </div>
</template>

<script>
import Tombstone from '@/components/Tombstone/Tombstone.vue'
import { clone, isEmpty, propOr, pathOr, head, compose } from 'ramda'
import { getAlgoliaFacets, facetPropPathMapping } from '../../utils/algolia'
import { useMainStore } from '../store/index.js'
import { mapState, mapActions } from 'pinia'
import DatasetVersionMessage from '@/components/DatasetVersionMessage/DatasetVersionMessage.vue'
import DatasetActionBox from '@/components/DatasetDetails/DatasetActionBox.vue'
import SimilarDatasetsInfoBox from '@/components/DatasetDetails/SimilarDatasetsInfoBox.vue'
import Scaffolds from '@/static/js/scaffolds.js'
import DatasetHeader from '@/components/DatasetDetails/DatasetHeader.vue'
import DateUtils from '@/mixins/format-date'
import FormatStorage from '@/mixins/bf-storage-metrics'
import DatasetDescriptionInfo from '@/components/DatasetDetails/DatasetDescriptionInfo.vue'
import DatasetAboutInfo from '@/components/DatasetDetails/DatasetAboutInfo.vue'
import CitationDetails from '@/components/CitationDetails/CitationDetails.vue'
import DatasetFilesInfo from '@/components/DatasetDetails/DatasetFilesInfo.vue'
import ImagesGallery from '@/components/ImagesGallery/ImagesGallery.vue'
import DatasetReferences from '~/components/DatasetDetails/DatasetReferences.vue'
import VersionHistory from '@/components/VersionHistory/VersionHistory.vue'
import error404 from '@/components/Error/404.vue'
import error400 from '@/components/Error/400.vue'
import { getLicenseLink, getLicenseAbbr } from '@/static/js/license-util'

const getDatasetDetails = async (config, datasetId, version, $axios, $pennsieveApiClient) => {
  const url = `${config.public.portal_api}/sim/dataset/${datasetId}`
  var datasetUrl = version ? `${url}/versions/${version}` : url

  const datasetDetails = await $axios.get(datasetUrl).catch(async (error) => { 
    const status = propOr('', 'status', error.response)
    // If not found, then try accessing it directly from Pennsieve in case it has been unpublished
    if (status == 404) {
      const pennsieveUrl = `${config.public.discover_api_host}/datasets/${datasetId}`
      var pennsieveDatasetUrl = version ? `${pennsieveUrl}/versions/${version}` : pennsieveUrl
      return await $pennsieveApiClient.value.get(pennsieveDatasetUrl).catch((error) => {
        const status = pathOr('', ['data', 'status'], error.response)
        if (status === 'UNPUBLISHED') {
          const details = error.response.data
          return {
            isUnpublished: true,
            ...details
          }
        }
      })
    }
  })
  return datasetDetails
}

const getDatasetVersions = async (config, datasetId, axios) => {
  try {
    const url = `${config.public.discover_api_host}/datasets/${datasetId}/versions`
    return axios.get(url).then(({ data }) => {
      return data.sort((a, b) => a.verson - b.version)
    })
  } catch (error) {
    return []
  }
}

const getDownloadsSummary = async (config, axios) => {
  try {
    const startDate = new Date('2000','1');
    const currentDate = new Date()
    const url = `${config.public.discover_api_host}/metrics/dataset/downloads/summary`
    return axios.get(url, {
        params: { startDate: startDate, endDate: currentDate }
      }).then(({ data }) => {
      return data
    })
  } catch (error) {
    return 0
  }
}

const getOrganizationNames = async (algoliaIndex) => {
  try {
    await algoliaIndex.search('', {
      sortFacetValuesBy: 'alpha',
      facets: 'pennsieve.organization.name',
    }).then(({ facets }) => {
      return facets['pennsieve.organization.name'].keys()
    })
  } catch (error) {
    return [
      'SPARC',
      'SPARC Consortium',
      'RE-JOIN',
      'HEAL PRECISION',
      "IT'IS Foundation"
    ]
  }
}

const tabs = [
  {
    label: 'Abstract',
    id: 'abstract'
  },
  {
    label: 'About',
    id: 'about'
  },
  {
    label: 'Cite',
    id: 'cite'
  },
  {
    label: 'Gallery',
    id: 'images'
  },
]

export default {
  name: 'DatasetDetails',

  components: {
    Tombstone,
    DatasetVersionMessage,
    DatasetActionBox,
    SimilarDatasetsInfoBox,
    DatasetHeader,
    DatasetDescriptionInfo,
    DatasetAboutInfo,
    CitationDetails,
    DatasetFilesInfo,
    ImagesGallery,
    DatasetReferences,
    VersionHistory,
    error400,
    error404
  },

  mixins: [DateUtils, FormatStorage],

  async setup() {
    const route = useRoute()
    const config = useRuntimeConfig()
    const { $algoliaClient, $axios, $pennsieveApiClient } = useNuxtApp()
    const algoliaIndex = await $algoliaClient.initIndex(config.public.ALGOLIA_INDEX_PUBLISHED_TIME_DESC)

    let tabsData = clone(tabs)
    const datasetId = route.params.datasetId
    const filter = `objectID:${datasetId}`
    const datasetFacetsData = await getAlgoliaFacets(algoliaIndex, facetPropPathMapping, filter).then(data => {
      return data
    })

    const typeFacet = datasetFacetsData.find(child => child.key === 'item.types.name')
    const datasetTypeName = typeFacet !== undefined ? typeFacet.children[0].label : 'dataset'
    const store = useMainStore()
    try {
      let [datasetDetails, versions, downloadsSummary, sparcOrganizationNames] = await Promise.all([
        getDatasetDetails(
          config,
          datasetId,
          route.params.version,
          $axios,
          $pennsieveApiClient
        ),
        getDatasetVersions(config, datasetId, $axios),
        getDownloadsSummary(config, $axios),
        getOrganizationNames(algoliaIndex)
      ])
      
      datasetDetails = propOr(datasetDetails, 'data', datasetDetails)
      const latestVersion = compose(propOr(1, 'version'), head)(versions)
      store.setDatasetInfo({ ...datasetDetails, 'latestVersion': latestVersion })
      store.setDatasetFacetsData(datasetFacetsData)
      store.setDatasetTypeName(datasetTypeName)
      // Creator data
      const org = [
        {
          '@type': 'Organization',
          name: propOr('', 'organizationName', datasetDetails)
        }
      ]
      const contributors = datasetDetails?.contributors?.map(contributor => {
        const sameAs = contributor.orcid
          ? `http://orcid.org/${contributor.orcid}`
          : null

        return {
          '@type': 'Person',
          sameAs,
          givenName: contributor.firstName,
          familyName: contributor.lastName,
          name: `${contributor.firstName} ${contributor.lastName}`
        }
      })

      const creators = contributors?.concat(org)
      const doi = propOr('', 'doi', datasetDetails)
      const doiLink = doi ? `https://doi.org/${doi}` : ''
      let originallyPublishedDate = propOr('', 'firstPublishedAt', datasetDetails)
      const showTombstone = propOr(false, 'isUnpublished', datasetDetails)
      // Redirect them to doi if user tries to navigate directly to a dataset ID that is not a part of SPARC
      if (!sparcOrganizationNames.includes(propOr('', 'organizationName', datasetDetails)) && !isEmpty(doiLink) && !showTombstone)
      {
        navigateTo(doiLink, { external: true, redirectCode: 301 })
      }

      return {
        tabs: tabsData,
        versions,
        datasetTypeName,
        downloadsSummary,
        showTombstone,
        algoliaIndex,
        hasError: false,
        originallyPublishedDate,
        creators
      }
    } catch (error) {
      const status = pathOr('', ['response', 'status'], error)
      store.setDatasetInfo({})
      return {
        hasError: true,
        errorType: status
      }
    }
  },

  data() {
    return {
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        },
        {
          to: {
            name: 'data',
            query: {
              type: this.$route.query.type
            }
          },
          label: 'Data & Models'
        }
      ],
      activeTabId: this.$route.query.datasetDetailsTab ? this.$route.query.datasetDetailsTab : 'abstract',
      markdown: {},
      associatedProjects: [],
      loadingMarkdown: false,
      isLoadingDataset: false,
      errorLoading: false,
      datasetRecords: [],
      sparcAwardNumbers: [],
      showCopySuccess: false,
      subtitles: [],
    }
  },

  async created() {
    const datasetOwnerId = propOr('', 'ownerId', this.datasetInfo)
    const datasetOwnerEmail = await this.$axios
      .get(`${this.$config.public.portal_api}/get_owner_email/${datasetOwnerId}`)
      .then(({ data }) => {
        return data.email
      })
      .catch(() => {
        return ''
      })
    if (this.datasetInfo) {
      this.setDatasetInfo({ ...this.datasetInfo, 'ownerEmail': datasetOwnerEmail })
    }
  },

  mounted() {
    this.$gtm.trackEvent({
      event: "",
      category: "",
      dataset_id: propOr(this.$route.params.datasetId, 'id', this.datasetInfo),
      version_id: propOr('', 'version', this.datasetInfo),
      doi: propOr('', 'doi', this.datasetInfo),
      event_name: "",
      citation_type: "",
      location: "",
      files: "",
      file_name: "",
      file_path: "",
      file_type: "",
    })
  },

  computed: {
    ...mapState(useMainStore, ['datasetInfo', 'datasetFacetsData']),
    defaultTab() {
      return this.tabs[0].id
    },
    embargoAccess() {
      return propOr(null, 'embargoAccess', this.datasetInfo)
    },
    isLatestVersion() {
      if (this.versions !== undefined && this.versions.length) {
        const latestVersion = compose(propOr(1, 'version'), head)(this.versions)
        return this.datasetInfo.version === latestVersion
      }

      return true
    },
    latestVersionRevision() {
      if (this.versions === undefined) {
        return ''
      }
      let revision = compose(propOr(0, 'revision'), head)(this.versions)
      let version = compose(propOr(1, 'version'), head)(this.versions)
      return `${version}.${revision}`
    },
    latestVersionDate() {
      if (this.versions === undefined) {
        return ''
      }
      let version = compose(head)(this.versions)
      const date = version.revisedAt || version.versionPublishedAt
      return this.formatDate(date)
    },
    licenseLink: function () {
      return getLicenseLink(this.datasetLicense)
    },
    datasetLicense: function () {
      const licenseKey = propOr('', 'license', this.datasetInfo)
      return getLicenseAbbr(licenseKey)
    },
    getDatasetImage: function () {
      return propOr('', 'banner', this.datasetInfo)
    },
    datasetContributors: function () {
      return propOr([], 'contributors', this.datasetInfo)
    },
    datasetOwnerEmail: function () {
      return this.datasetInfo.ownerEmail || ''
    },
    datasetTitle: function () {
      return propOr('', 'name', this.datasetInfo)
    },
    getRecordsUrl: function () {
      return `${this.$config.public.discover_api_host}/search/records?datasetId=${this.datasetId}`
    },
    getProtocolRecordsUrl: function () {
      return `${this.getRecordsUrl}&model=protocol`
    },
    datasetId: function () {
      return pathOr('', ['params', 'datasetId'], this.$route)
    },
    hasFiles: function () {
      return this.fileCount >= 1
    },
    fileCount: function () {
      return propOr('0', 'fileCount', this.datasetInfo)
    },
    datasetTags: function () {
      return propOr([], 'tags', this.datasetInfo)
    },
    externalPublications: function () {
      return propOr([], 'externalPublications', this.datasetInfo)
    },
    doiLink: function () {
      const doi = propOr('', 'doi', this.datasetInfo)
      return doi ? `https://doi.org/${doi}` : ''
    },
    datasetDescription: function () {
      return propOr('', 'description', this.datasetInfo)
    },
    datasetName: function () {
      return propOr('', 'name', this.datasetInfo)
    },
    organizationName: function () {
      return propOr('', 'organizationName', this.datasetInfo)
    },
    // This assumes that the subtitles are the organ types
    organType: function () {
      return this.subtitles[0] || ''
    },
    scaffold: function () {
      return Scaffolds[this.organType.toLowerCase()]
    },
    primaryPublications: function () {
      const valObj = this.externalPublications.filter(function (elem) {
        return elem.relationshipType == 'IsDescribedBy'
      })
      return valObj.length > 0 ? valObj : null
    },
    associatedPublications: function () {
      const valObj = this.externalPublications.filter(function (elem) {
        return elem.relationshipType == 'IsReferencedBy' || elem.relationshipType == 'IsSupplementedBy'
      })
      return valObj.length > 0 ? valObj : null
    },
    hasCitations: function () {
      return (this.primaryPublications || this.associatedPublications) !== null
    },
    numCitations: function () {
      let numPrimary = this.primaryPublications ? this.primaryPublications.length : 0;
      let numAssociated = this.associatedPublications ? this.associatedPublications.length : 0;
      return numPrimary + numAssociated;
    },
    numDownloads: function () {
      let numDownloads = 0;
      this.downloadsSummary.filter(download => download.datasetId == this.datasetId).forEach(item => {
        numDownloads += item.downloads;
      })
      return numDownloads
    },
    embargoed: function () {
      return propOr(false, 'embargo', this.datasetInfo)
    },
    canViewVersions: function () {
      return !this.embargoed
    }
  },

  watch: {
    '$route.query': 'queryChanged',
    getProtocolRecordsUrl: {
      handler: function (val) {
        if (isEmpty(this.datasetId))
          return
        if (val) {
          this.getProtocolRecords()
        }
      },
      immediate: true
    },
    getRecordsUrl: {
      handler: function (val) {
        if (isEmpty(this.datasetId))
          return
        if (val) {
          this.getDatasetRecords()
        }
      },
      immediate: true
    },
    datasetInfo: {
      handler: function () {
        this.getMarkdown()
      },
    },
    hasFiles: {
      handler: function (newValue) {
        if (newValue && !this.hasError) {
          const hasFilesTab = this.tabs.find(tab => tab.id === 'files') !== undefined
          if (!hasFilesTab) {
            this.tabs.splice(3, 0, { label: 'Files', id: 'files' })
          }
        }
      },
      immediate: true
    },
    hasCitations: {
      handler: function (newValue) {
        if (newValue && !this.hasError) {
          const hasCitationsTab = this.tabs.find(tab => tab.id === 'references') !== undefined
          if (!hasCitationsTab) {
            this.tabs.splice(5, 0, { label: 'References', id: 'references' })
          }
        }
      },
      immediate: true
    },
    canViewVersions: {
      handler: function (newValue) {
        if (newValue && !this.hasError) {
          const hasVersionsTab = this.tabs.find(tab => tab.id === 'versions') !== undefined
          if (!hasVersionsTab) {
            this.tabs.splice(6, 0, { label: 'Versions', id: 'versions' })
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    tabChanged(newTab) {
      this.activeTabId = newTab.id
      this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, datasetDetailsTab: newTab.id } })
    },
    ...mapActions(useMainStore, ['setDatasetInfo', 'setDatasetFacetData', 'setDatasetTypeName']),
    /**
     * Returns protocol records in a dataset's model if they exist.
     * First, check if the dataset has external publications with type
     * "isSupplementedBy" which is leveraged to contain the protocols in SPARC.
     *
     * To support backward compatibility, if this does not exist, check if there
     * are records of type Protocol and only show those that are defined as a doi.
     *
     * This workflow allows datasets to be updated as a revision to update the protocols
     * on the portal instead of requiring the dataset to be fully republished.
     */
    getProtocolRecords: function () {
      if (
        this.datasetInfo.externalPublications &&
        this.datasetInfo.externalPublications.length !== 0
      ) {
        const allPubs = this.datasetInfo.externalPublications
        const allProtocols = allPubs.filter(
          x => x.relationshipType === 'IsSupplementedBy'
        )
        this.datasetRecords = allProtocols.map(obj => {
          return { url: `https://doi.org/${obj.doi}` }
        })
      } else {
        this.$axios
          .get(this.getProtocolRecordsUrl)
          .then(({ data }) => {
            const records = propOr([], 'records', data)
            if (records.length !== 0) {
              // that means protocol records exist
              const allProtocols = records.filter(protocol =>
                protocol.properties.url.startsWith('https://doi.org')
              )
              this.datasetRecords = allProtocols.map(obj => {
                return { url: obj.properties.url }
              })
            }
          })
          .catch(() => {
            // handle error
            this.errorLoading = true
          })
      }
    },
    getDatasetRecords: async function () {
      try {
        this.algoliaIndex
          .getObject(this.datasetId, {
            attributesToRetrieve: 'supportingAwards',
          })
          .then(({ supportingAwards }) => {
            supportingAwards = supportingAwards.filter(award => propOr(null, 'identifier', award) != null)
            supportingAwards.forEach(award => {
              this.sparcAwardNumbers.push(`${award.identifier}`)
            })
          }).finally(async () => {
            if (this.sparcAwardNumbers.length > 0) {
              let projects = await this.getAssociatedProjects(this.sparcAwardNumbers)
              this.associatedProjects = projects.length > 0 ? projects : null
            }
          })
      } catch (e) {
        console.error(e)
      }
    },
    getAssociatedProjects: async function (sparcAwardNumbers) {
      try {
        const projects = await this.$contentfulClient.getEntries({
          content_type: this.$config.public.ctf_project_id,
        })
        const associatedProjects = projects.items?.filter((project) => {
          return sparcAwardNumbers.includes(pathOr('', ['fields', 'awardId'], project))
        })
        return associatedProjects || []
      } catch (error) {
        return []
      }
    },
    queryChanged: function () {
      this.activeTabId = this.$route.query.datasetDetailsTab
        ? this.$route.query.datasetDetailsTab
        : this.defaultTab
    },
    getMarkdown: function () {
      this.loadingMarkdown = true
      const readme = propOr('', 'readme', this.datasetInfo)
      if (readme !== '') {
        fetch(readme)
          .then(response => response.text())
          .then(response => {
            this.loadingMarkdown = false
            const splitDelim = '\\n---'
            let splitResponse = response.split(splitDelim)
            splitResponse = splitResponse.map(i => {
              if (i < splitResponse.length - 1) {
                return `${i}${splitDelim}`
              } else {
                return `${i}`
              }
            })
            this.markdown = {
              markdownTop: splitResponse[0].toString(),
              markdownBottom: splitResponse[1]
                ? splitResponse.slice(1).toString()
                : ''
            }
          })
          .catch(error => {
            throw error
          })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.left-column {
  @media (max-width: 48rem) {
    order: 1;
    margin-top: 0;
  }
}
.details-container {
  padding: 0 3rem;
  @media (max-width: 62rem) {
    padding: 0 1rem;
  }
}

:deep(.card-container) {
  .content {
      a {
        color: $purple;
      }
  }
}
.dataset-details {
  background-color: $background;
  width: 100%;
  overflow-x: hidden;
}
</style>
