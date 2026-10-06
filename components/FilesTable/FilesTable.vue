<template>
  <div class="files-table">
    <div class="files-table-header">
      <div class="breadcrumb-list">
        <div v-for="(item, idx) in breadcrumbs" :key="idx" class="breadcrumb">
          <nuxt-link
            class="breadcrumb-link"
            :to="{
              query: { ...$route.query, path: breadcrumbNavigation(idx) }
            }"
          >
            {{ item }}
          </nuxt-link>
          <span v-if="breadcrumbs.length > 1 && idx !== breadcrumbs.length - 1" class="breadcrumb-separator"> / </span>
        </div>
      </div>
    </div>

    <div class="files-table-table">
      <div v-if="hasError" class="error-wrap">
        <p>Sorry, an error has occurred</p>
        <el-button type="primary" @click="getFiles"> Try again </el-button>
      </div>
      <el-table
        v-else
        ref="table"
        :data="data"
        @selection-change="handleSelectionChange"
        @filter-change="handleFilterChange"
      >
        <el-table-column type="selection" fixed width="45" />
        <el-table-column
          fixed
          prop="name"
          label="Name"
          min-width="150"
          sortable
          :sort-method="(a, b) => sortWithCaseInsensitive(a.name, b.name)"
        >
          <template v-slot="scope">
            <div class="file-name-wrap">
              <template v-if="scope.row.type === 'Directory'">
                <el-icon class="file-icon"><Folder /></el-icon>
                <sparc-tooltip placement="left-center" :content="scope.row.name" is-repeating-item-content>
                  <template #item>
                    <nuxt-link class="file-name truncated" :to="{ query: { ...$route.query, path: scope.row.path } }">
                      {{ scope.row.name }}
                    </nuxt-link>
                  </template>
                </sparc-tooltip>
              </template>

              <template v-else>
                <el-icon v-if="isImage(scope.row.fileType)" class="file-icon"><Picture /></el-icon>
                <el-icon v-else class="file-icon"><Document /></el-icon>
                <div v-if="isFileOpenable(scope)" class="truncated">
                  <sparc-tooltip placement="left-center" :content="scope.row.name" is-repeating-item-content>
                    <template #item>
                      <div class="truncated">
                        <a href="#" @click.prevent="openFile(scope)">
                          {{ scope.row.name }}
                        </a>
                      </div>
                    </template>
                  </sparc-tooltip>
                </div>
                <div v-else-if="isScaffoldMetaFile(scope.row.path)" class="truncated">
                  <sparc-tooltip placement="left-center" :content="scope.row.name" is-repeating-item-content>
                    <template #item>
                      <div class="truncated">
                        <nuxt-link :to="getScaffoldLink(scope.row.path)">
                          {{ scope.row.name }}
                        </nuxt-link>
                      </div>
                    </template>
                  </sparc-tooltip>
                </div>
                <div v-else-if="scope.row.path && isScaffoldViewFile(scope.row.path)" class="truncated">
                  <sparc-tooltip placement="left-center" :content="scope.row.name" is-repeating-item-content>
                    <template #item>
                      <div class="truncated">
                        <nuxt-link :to="getScaffoldViewLink(scope.row.path, scope.row.name)">
                          {{ scope.row.name }}
                        </nuxt-link>
                      </div>
                    </template>
                  </sparc-tooltip>
                </div>
                <div v-else class="truncated">
                  <sparc-tooltip placement="left-center" :content="scope.row.name" is-repeating-item-content>
                    <template #item>
                      <div class="truncated">
                        <nuxt-link
                          :to="{
                            name: 'datasets-file-datasetId-datasetVersion',
                            params: {
                              datasetId: datasetInfo.id,
                              datasetVersion: datasetInfo.version
                            },
                            query: {
                              path: s3Path(scope.row)
                            }
                          }"
                        >
                          {{ scope.row.name }}
                        </nuxt-link>
                      </div>
                    </template>
                  </sparc-tooltip>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="fileType"
          label="File type"
          width="280"
          columnKey="fileType"
          sortable
          :filters="getFileTypeFilters(data)"
          :filter-method="fileTypeFilterStatus"
          filter-placement="top-start"
          filter-class-name="file-type-filter"
        >
          <template #header="{ column }">
            <span class="custom-header">
              {{ column.label }}
              <el-button v-if="isFilterApplied" class="custom-button" @click="handleResetFilters('fileType')">
                Reset filter
              </el-button>
            </span>
          </template>
          <template v-slot="scope">
            <template v-if="scope.row.type === 'Directory'"> Folder </template>

            <template v-else>
              {{ scope.row.fileType }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="Size" width="220" :formatter="formatStorage" sortable />
        <el-table-column label="Action" width="200">
          <template v-slot="scope">
            <template v-if="scope.row.type === 'File'">
              <div v-if="!isFileTooLarge(scope.row)" class="circle" @click="executeDownload(scope.row)">
                <sparc-tooltip placement="bottom-center" content="Download file">
                  <template #item>
                    <svgo-icon-download class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-else class="circle disabled">
                <sparc-tooltip placement="bottom-center" :content="`Files over ${maxDownloadSize} in size must be downloaded via AWS`">
                  <template #item>
                    <svgo-icon-download class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isFileOpenable(scope)" class="circle" @click="openFile(scope)">
                <sparc-tooltip placement="bottom-center" content="View file in web viewer">
                  <template #item>
                    <svgo-icon-open class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isScaffoldMetaFile(scope.row.path)" class="circle" @click="openScaffold(scope.row.path)">
                <sparc-tooltip placement="bottom-center" content="Open as 3d scaffold">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div
                v-if="isScaffoldViewFile(scope.row.path)"
                class="circle"
                @click="openScaffoldView(scope.row.path, scope.row.name)"
              >
                <sparc-tooltip placement="bottom-center" content="Open as 3d scaffold">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isPlotViewFile(scope.row.path)" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open Plot Viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isSimulationViewFile(scope.row.path)" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open Simulation Viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isVideoViewFile(scope.row.path)" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open Video Viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isOmeTiffFile(scope.row.name)" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open OME-TIFF Viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isNiftiFile(scope.row.name) && $config.public.SHOW_ORTHOGONAL_VIEWER == 'true'" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open NIfTI Viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isZarrZipFile(scope.row.name) && $config.public.SHOW_ORTHOGONAL_VIEWER == 'true'" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open Zarr Viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div class="circle" @click="setDialogSelectedFile(scope)">
                <sparc-tooltip placement="bottom-center">
                  <template #data>
                    <div class="osparc-service-btn-tooltip">
                      Open in o<sup>2</sup>S<sup>2</sup>PARC. Login is required,
                      <a href="/resources/4LkLiH5s4FV0LVJd3htsvH#user-accounts" target="_blank">
                        <u>here</u>
                      </a>
                      you can find more information on how to get an account.
                    </div>
                  </template>
                  <template #item>
                    <svgo-icon-osparc fill="red" class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isTimeseriesViewFile(scope.row)" class="circle" @click="openViewerFile(scope)">
                <sparc-tooltip placement="bottom-center" content="Open timeseries viewer">
                  <template #item>
                    <svgo-icon-view class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
              <div v-if="isFileOpenable(scope)" class="circle" @click="copyS3Url(scope)">
                <sparc-tooltip placement="bottom-center" content="Copy link">
                  <template #item>
                    <svgo-icon-permalink-nobg class="action-icon" />
                  </template>
                </sparc-tooltip>
              </div>
            </template>
            <template v-else> - </template>
          </template>
        </el-table-column>
      </el-table>
      <osparc-file-viewers-dialog
        :show-dialog="dialogSelectedFile !== null"
        :viewers="osparcViewers"
        :selected-file="dialogSelectedFile"
        @dialog-closed="() => setDialogSelectedFile(null)"
      />
    </div>
    <sparc-tooltip
      v-if="selected.length == 0"
      class="tooltip"
      placement="left-center"
      content="You must select a file to download"
    >
      <template #item>
        <bf-download-file
          class="mt-16"
          disabled
          :selected="selected"
          :dataset="datasetInfo"
          :file-path="path"
        />
      </template>
    </sparc-tooltip>
    <bf-download-file
      v-else
      class="mt-16"
      :selected="selected"
      :dataset="datasetInfo"
      :file-path="path"
      :busy="archiveBusy"
      :aws-uri="awsUri"
      @start-archive="onStartArchive"
    />
    <public-archive-status
      class="mt-16"
      :archive="archive"
      :error="archiveError"
      :starting="starting"
      :signed-in="signedIn"
      @download="downloadArchive"
      @remove="removeArchive"
    />
  </div>
</template>

<script>
import { compose, isEmpty, join, reject, slice, split, propOr, pathOr } from 'ramda'

import BfDownloadFile from '@/components/BfDownloadFile/BfDownloadFile'
import OsparcFileViewersDialog from '@/components/FilesTable/OsparcFileViewersDialog.vue'
import PublicArchiveStatus from '@/components/PublicArchiveStatus/PublicArchiveStatus.vue'
import { mapState } from 'pinia'
import { useMainStore } from '../../store'

import FormatStorage from '@/mixins/bf-storage-metrics/index'
import { successMessage, failMessage } from '@/utils/notification-messages'
import { usePublicArchive } from '@/composables/usePublicArchive'
import { downloadPublicFile, usePublicFileLink } from '@/composables/usePublicFileLink'
import { isActive, rememberedArchives } from '@/utils/publicDownloads'

const openableFileTypes = ['pdf', 'text', 'jpeg', 'png', 'svg']

export default {
  name: 'FilesTable',

  components: {
    BfDownloadFile,
    OsparcFileViewersDialog,
    PublicArchiveStatus
  },

  mixins: [FormatStorage],

  props: {
    osparcViewers: {
      type: Object,
      default: function() {
        return {}
      }
    },
    datasetScicrunch: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  setup() {
    // Folders and several files download as a zip that download-service
    // builds; it's followed here, so it outlives a change of selection.
    const {
      archive,
      error: archiveError,
      starting,
      signedIn,
      start: startArchive,
      resume: resumeArchive,
      download: downloadArchive,
      remove: removeArchive
    } = usePublicArchive()
    return { archive, archiveError, starting, signedIn, startArchive, resumeArchive, downloadArchive, removeArchive }
  },

  data: function() {
    return {
      previousPath: '',
      schemaRootPath: 'files',
      data: [],
      isLoading: false,
      hasError: false,
      limit: 500,
      selected: [],
      dialogSelectedFile: null,
      filtersApplied: []
    }
  },

  computed: {
    /**
     * Get dataset info from the store
     * @returns {Object}
     */
    ...mapState(useMainStore, ['datasetInfo', 'userToken']),
    /**
     * Compute the current path for the dataset's files.
     * @returns {String}
     */
    path: function() {
      return this.$route.query.path ? this.$route.query.path : this.schemaRootPath
    },

    breadcrumbs: function() {
      return compose(reject(isEmpty), split('/'))(this.path)
    },

    /**
     * Compute endpoint URL to get dataset's files
     * @returns {String}
     */
    getFilesBaseUrl: function() {
      const id = pathOr('', ['params', 'datasetId'], this.$route)
      const version = this.datasetVersion
      return `${this.$config.public.discover_api_host}/datasets/${id}/versions/${version}/files/browse`
    },
    getFilesParams: function() {
      const params = {
        path: this.path,
        limit: this.limit
      }
      if (this.userToken) {
        params.api_key = this.userToken
      }
      return params
    },

    /**
     * Url to retrieve the dataset to get the version number
     * @returns {String}
     */
    getFilesIdUrl: function() {
      const id = pathOr('', ['params', 'datasetId'], this.$route)
      const version = this.datasetVersion
      return `${this.$config.public.discover_api_host}/datasets/${id}/versions/${version}`
    },

    /**
     * Compute the version of this dataset.
     * @returns {String}
     */
    datasetVersion: function() {
      return propOr(1, 'version', this.datasetInfo)
    },
    maxDownloadSize: function() {
      return this.formatMetric(this.$config.public.max_download_size)
    },
    archiveBusy: function() {
      return this.starting || isActive(this.archive)
    },
    /**
     * The latest version's S3 location, for the AWS CLI; older versions' files need their object versions
     * @returns {String}
     */
    awsUri: function() {
      return this.datasetVersion == this.datasetInfo.latestVersion ? propOr('', 'uri', this.datasetInfo) : ''
    },
    isFilterApplied() {
      return this.filtersApplied.length > 0
    }
  },

  watch: {
    '$route.query.path': 'pathQueryChanged',
    userToken: {
      handler: function() {
        this.getFiles()
      },
      immediate: true
    }
  },

  mounted() {
    // A selection's zip this browser asked for and may come back to.
    const remembered = rememberedArchives({ datasetId: this.datasetInfo.id, version: this.datasetVersion }).filter(a => !a.whole)
    if (remembered.length) this.resumeArchive(remembered[remembered.length - 1])
  },

  methods: {
    /**
     * Check if the file is openable
     * MS Office files and native browser files
     * - Documents (pdf, text)
     * - Images (jpg, png)
     * - Video (MP4)
     * - Vector Drawings (svg)
     */
    isFileOpenable(scope) {
      const fileType = scope.row.fileType
      return this.isMicrosoftFileType(scope) || openableFileTypes.includes(fileType)
    },

    isFileTooLarge(file) {
      const fileSize = propOr(0, 'size', file)
      return fileSize > this.$config.public.max_download_size
    },

    handleSelectionChange(val) {
      this.selected = val
    },

    isTimeseriesViewFile(file) {
      const type = propOr('', 'packageType', file)
      return type === 'TimeSeries' && this.$config.public.SHOW_TIMESERIES_VIEWER == 'true'
    },

    /**
     * Converts a semver version string to an integer
     * @param {String} semverVersion
     */
    convertSchemaVersionToInteger: function(semverVersion) {
      // split version number into parts
      let parts = semverVersion.split('.')
      // make sure no part is larger than 1023 or else it won't fit
      // into 32-bit integer
      parts.forEach(part => {
        if (part >= 1024) {
          throw new Error(`Version string invalid, ${part} is too large`)
        }
      })
      let numericVersion = 0
      // shift all parts either 0, 10, or 20 bits to the left
      for (let i = 0; i < 3; i++) {
        numericVersion |= parts[i] << (i * 10)
      }
      return numericVersion
    },

    /**
     * Gets the dataset version number to get the files for the dataset
     */
    getDatasetVersionNumber: function() {
      this.isLoading = true
      this.hasError = false

      this.$axios
        .get(this.getFilesIdUrl)
        .then(({ data }) => {
          const schemaVersion = this.convertSchemaVersionToInteger(data.pennsieveSchemaVersion)
          if (schemaVersion < 4.0) {
            this.schemaRootPath = 'packages'
          }
          this.getFiles()
        })
        .catch(() => {
          this.hasError = true
        })
    },
    /**
     * Checks if file is MS Word, MS Excel, or MS Powerpoint
     * @param {Object} scope
     */
    isMicrosoftFileType: function(scope) {
      return scope.row.fileType == 'MSWord' || scope.row.fileType == 'MSExcel' || scope.row.fileType == 'PowerPoint'
    },
    /**
     * Get contents of directory
     */
    getFiles: function() {
      this.hasError = false
      this.isLoading = true
      this.previousPath = this.path

      this.$axios
        .get(this.getFilesBaseUrl, { params: this.getFilesParams })
        .then(({ data }) => {
          this.data = data.files
        })
        .catch(() => {
          this.hasError = true
        })
        .finally(() => {
          this.isLoading = false
        })
    },

    /**
     * When the path query changes get files.
     */
    pathQueryChanged: function() {
      this.$refs.table.clearFilter()
      this.handleResetFilters('fileType')
      this.getFiles()
    },

    /**
     * Navigate to another directory via breadcrumb
     * @param {Integer} idx
     */
    breadcrumbNavigation: function(idx) {
      const itemIdx = idx + 1

      return compose(join('/'), slice(0, itemIdx))(this.breadcrumbs)
    },

    /**
     * Format storage column
     * @param {Object} row
     * @param {Object} column
     * @param {Number} cellValue
     * @returns {String}
     */
    formatStorage: function(row, column, cellValue) {
      return this.formatMetric(cellValue)
    },

    /**
     * Shows the oSPARC viewers selector
     */
    setDialogSelectedFile: function(scope) {
      this.dialogSelectedFile = scope ? scope.row : null
    },

    /**
     * A download-service view link to the file, opened in the browser or Microsoft's Office viewer
     * @param {Object} scope
     */
    getViewFileUrl(scope) {
      return usePublicFileLink({
        datasetId: this.datasetInfo.id,
        version: this.datasetVersion,
        path: scope.row.path,
        purpose: 'view'
      }).then(({ url }) => {
        const encodedUrl = encodeURIComponent(url)
        return this.isMicrosoftFileType(scope) ? `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}` : url
      })
    },

    /**
     * Opens a file in a new tab
     * This is currently for MS Word, MS Excel, and Powerpoint files only
     * @param {Object} scope
     */
    openFile: function(scope) {
      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'view_file_in_web_browser',
        file_name: pathOr('', ['row', 'name'], scope),
        file_path: pathOr('', ['row', 'path'], scope),
        file_type: pathOr('', ['row', 'fileType'], scope),
        location: '',
        category: '',
        dataset_id: this.datasetInfo.id,
        version_id: this.datasetVersion,
        doi: '',
        citation_type: '',
        files: ''
      })
      this.getViewFileUrl(scope).then(response => {
        window.open(response, '_blank')
      }).catch(() => {
        failMessage(`Cannot open the file.`)
      })
    },

    /**
     * Downloads a file through a download-service link
     * @param {Object} file
     */
    executeDownload(file) {
      downloadPublicFile({ datasetId: this.datasetInfo.id, version: this.datasetVersion, path: file.path }).catch(e => {
        failMessage(e.message || `Couldn't download the file. Try again.`)
      })
      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'dataset_file_download',
        files: [file.path],
        file_name: '',
        file_path: '',
        file_type: '',
        location: '',
        category: '',
        dataset_id: this.datasetInfo.id,
        version_id: this.datasetVersion,
        doi: '',
        citation_type: ''
      })
    },

    /**
     * Create nuxt-link object for opening a scaffold.
     * @param {Object} scope
     */
    getScaffoldLink: function(path) {
      const id = pathOr('', ['params', 'datasetId'], this.$route)
      const version = this.datasetVersion
      return {
        name: 'maps',
        params: {},
        query: { type: 'scaffold', dataset_id: id, dataset_version: version, file_path: path }
      }
    },

    /**
     * Create nuxt-link object for opening a scaffold.
     * @param {Object} scope
     */
    getScaffoldViewLink: function(filePath, name) {
      const id = pathOr('', ['params', 'datasetId'], this.$route)
      const version = this.datasetVersion
      if (filePath && this.datasetScicrunch && this.datasetScicrunch['abi-scaffold-view-file']) {
        const shortened = filePath.replace('files/', '')

        // Find the file with a matching name
        let viewMetadata = this.datasetScicrunch['abi-scaffold-view-file'].filter(
          viewFile => viewFile.dataset.path === shortened
        )[0]

        // Find the current directory path. Note that the trailing '/' is included
        const currentDirectoryPath = filePath.split(name)[0]

        // Create paths for fetching the files from 'sparc-api/s3-resource/'
        const scaffoldPath = `${currentDirectoryPath}${viewMetadata.datacite.isDerivedFrom.relative.path[0]}`
        return {
          name: 'maps',
          params: {},
          query: { type: 'scaffold', dataset_id: id, dataset_version: version, file_path: scaffoldPath, viewURL: name }
        }
      }
      return {}
    },

    /**
     * Open scaffold
     * @param {Object} scope
     */
    openScaffold: function(path) {
      this.$router.push(this.getScaffoldLink(path))
    },

    /**
     * Open scaffold view file
     * @param {Object} scope
     */
    openScaffoldView: function(path, name) {
      const scaffoldViewLink = this.getScaffoldViewLink(path, name)
      if (scaffoldViewLink) {
        this.$router.push(scaffoldViewLink)
      }
    },
    isSpecifiedTypeFile: function(path, type) {
      if (path && this.datasetScicrunch && this.datasetScicrunch[type]) {
        let plotObjects = this.datasetScicrunch[type]
        path = path.replace('files/', '')
        for (let i = 0; i < plotObjects.length; i++) {
          if (plotObjects[i].dataset.path === path) return true
        }
      }
      return false
    },
    /**
     * Checks if file is a scaffold view port
     * @param {Object} scope
     */
    isScaffoldViewFile: function(path) {
      return this.isSpecifiedTypeFile(path, 'abi-scaffold-view-file')
    },
    /**
     * Checks if file is openable by scaffold viewer
     * @param {Object} scope
     */
    isScaffoldMetaFile: function(path) {
      return this.isSpecifiedTypeFile(path, 'abi-scaffold-metadata-file')
    },
    isPlotViewFile: function(path) {
      return this.isSpecifiedTypeFile(path, 'abi-plot')
    },
    isSimulationViewFile: function(path) {
      return this.isSpecifiedTypeFile(path, 'abi-simulation-omex-file')
    },
    isVideoViewFile: function(path) {
      return this.isSpecifiedTypeFile(path, 'video')
    },
    isOmeTiffFile: function(fileName) {
      if (!fileName) return false
      const lowerName = fileName.toLowerCase()
      return lowerName.endsWith('.ome.tiff') || lowerName.endsWith('.ome.tif')
    },
    isNiftiFile: function(fileName) {
      if (!fileName) return false
      const lowerName = fileName.toLowerCase()
      return lowerName.endsWith('.nii') || lowerName.endsWith('.nii.gz')
    },
    isZarrZipFile: function(fileName) {
      if (!fileName) return false
      return fileName.toLowerCase().endsWith('.zarr.zip')
    },
    openViewerFile(scope) {
      const route = {
        name: 'file-datasetId-datasetVersion',
        params: {
          datasetId: this.datasetInfo.id,
          datasetVersion: this.datasetInfo.version
        },
        query: {
          path: this.s3Path(scope.row)
        }
      }

      this.$router.push(route)
    },
    /**
     * Compute if the file is an image
     * @returns {Boolean}
     */
    isImage: function(fileType) {
      const images = ['JPG', 'PNG', 'JPEG', 'TIFF', 'GIF']
      return images.indexOf(fileType) >= 0
    },

    /**
     * Starts a zip of the selection; it downloads when it's ready
     * @param {Object} payload paths and archive name
     */
    onStartArchive({ paths, archiveName }) {
      this.startArchive({ datasetId: this.datasetInfo.id, version: this.datasetVersion, paths, archiveName })
    },

    /**
     * Copy file URL to clipboard
     * @param {Object} scope
     */
    copyS3Url(scope) {
      this.getViewFileUrl(scope).catch(() => {
        failMessage(`Cannot create a link to the file.`)
      }).then(response => {
        if (!response) return
        navigator.clipboard.writeText(response).then(
          () => {
            successMessage(`File URL copied to clipboard.`)
          },
          () => {
            failMessage(`Cannot copy to clipboard.`)
          }
        )
      })
    },
    sortWithCaseInsensitive(name1, name2) {
      var a = name1.toUpperCase()
      var b = name2.toUpperCase()
      if (a > b) return 1
      if (a < b) return -1
      return 0
    },
    s3Path(file) {
      const uri = file.uri
      return uri.substring(uri.indexOf('files/'))
    },
    getFileTypeFilters: function(data) {
      let fileTypeLabels = [...new Set(data.map(item => (item.fileType ? item.fileType : item.type)))]
      return fileTypeLabels.map(label => {
        if (label == 'Directory') {
          return {
            text: 'Folder',
            value: label
          }
        } else {
          return {
            text: label,
            value: label
          }
        }
      })
    },
    fileTypeFilterStatus: function(value, row, col) {
      return row.fileType ? row.fileType == value : row.type == value
    },
    handleFilterChange(filters) {
      this.filtersApplied = filters?.fileType
    },
    handleResetFilters(columnKey) {
      this.$refs.table.clearFilter([columnKey])
      this.filtersApplied = []
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.breadcrumb {
  background: none;
  height: auto;
}
.tooltip {
  display: flex;
  width: fit-content;
}
.files-table-header {
  align-items: center;
  display: flex;
}
.breadcrumb-list {
  align-items: center;
  display: flex;
  flex: 1;
  flex-wrap: wrap;
}
.breadcrumb-link {
  word-break: break-word;
  text-decoration: underline;
  color: $purple;
}
.breadcrumb-separator {
  margin: 0 4px;
}
.files-table-table {
  background: #fff;
}
.error-wrap {
  text-align: center;
}
.file-name-wrap {
  display: flex;
}
.truncated {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-name {
  color: $purple;
}
.file-icon {
  color: #000;
  font-size: 16px;
  flex-shrink: 0;
  margin: 3px 8px 0 0;
}
.circle {
  display: inline-block;
  height: 1.5em;
  width: 1.5em;
  line-height: 1.5em;
  margin-right: 4px;
  -moz-border-radius: 0.75em; /* or 50% */
  border-radius: 0.75em; /* or 50% */
  background-color: $purple;
  color: #fff;
  cursor: pointer;
  writing-mode: vertical-rl;
  -webkit-writing-mode: vertical-rl;
  vertical-align: top;
}
.disabled {
  opacity: 0.6;
}
:deep(.el-table) {
  th {
    .cell {
      color: black;
      font-size: 14px;
      font-weight: 500;
      line-height: 16px;
    }
    &.el-table-column--selection .cell {
      padding: 0 16px;
      text-overflow: unset;
    }
  }
}
.osparc-service-btn-tooltip {
  sup,
  sub {
    vertical-align: baseline;
    position: relative;
    top: -0.4em;
  }
  sub {
    top: 0.4em;
  }
}
.action-icon {
  width: 1.5rem;
  height: 1.5rem;
}
.custom-button {
  position: absolute;
  left: 7rem;
  top: 0.35rem;
  max-width: 5rem;
  width: -webkit-fill-available;
  height: 1rem;
}
:global(.file-type-filter .el-table-filter__bottom button) {
  background-color: $purple;
  color: white;
  border-radius: 10%;
  margin-right: 0.25rem;
  padding: 0.2rem 0.3rem 0.2rem 0.3rem;
}
</style>
