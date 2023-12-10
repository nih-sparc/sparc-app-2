<template>
  <div class="subpage pt-0 pb-16">
    <div class="file-detail">
      <strong class="file-detail__column_1">Dataset</strong>
      <div class="file-detail__column_2">
        <nuxt-link
          :to="{
            name: 'datasets-datasetId',
            params: {
              datasetId
            }
          }"
        >
          {{ title }}
        </nuxt-link>
      </div>
    </div>
    <div class="file-detail">
      <strong class="file-detail__column_1">Filename</strong>
      <div class="file-detail__column_2">
        {{ fileName }}
      </div>
    </div>
    <div v-if="filePath" class="file-detail">
      <strong class="file-detail__column_1">File location</strong>
      <div class="file-detail__column_2">
        <nuxt-link
          :to="{
            name: `datasets-datasetId`,
            params: {
              datasetId: datasetId
            },
            query: {
              datasetDetailsTab: 'files',
              path: fileFolderLocation
            }
          }"
        >
          {{ filePath }}
        </nuxt-link>
      </div>
    </div>
    <div class="file-detail">
      <strong class="file-detail__column_1">Data collection</strong>
      <div class="file-detail__column_2">
        {{ data_collection }}
      </div>
    </div>
    <div class="file-detail">
      <strong class="file-detail__column_1">Modality</strong>
      <div class="file-detail__column_2">
        {{ xmp_metadata.modality }}
      </div>
    </div>
    <div class="file-detail">
      <strong class="file-detail__column_1">Channel target labels</strong>
      <div class="file-detail__column_2">
        <image-channels :channel-colours="xmp_metadata.channel_colours" />
      </div>
    </div>
    <div class="file-detail">
      <strong class="file-detail__column_1">Image scaling</strong>
      <div class="file-detail__column_2">
        <image-scaling
          :x-scale="xmp_metadata.pixel_height"
          :y-scale="xmp_metadata.pixel_width"
          :z-scale="xmp_metadata.z_spacing"
        />
      </div>
    </div>
    <div v-if="filePath" class="pt-16">
      <el-button @click="requestDownloadFile(file)">
        Download file
      </el-button>
    </div>
  </div>
</template>

<script>
import biolucida from '@/services/biolucida'
import RequestDownloadFile from '@/mixins/request-download-file'
import ImageScaling from '@/components/Images/ImageScaling.vue'
import ImageChannels from '@/components/Images/ImageChannels.vue'
import MarkedMixin from '@/mixins/marked'
import FileDetails from '@/mixins/file-details'

import { extractSection } from '@/utils/common'
import { propOr } from 'ramda'

export default {
  name: "BiolucidaViewerMetadata",
  components: {
    ImageScaling,
    ImageChannels
  },
  props: {
    biolucidaData: {
      type: Object,
      default: () => {
        return {
          biolucida_image_id: '',
          blv_link: '',
          share_link: '',
          status: '',
          location: '',
          web_neurolucida_link: ''
        }
      }
    },
    file: {
      type: Object,
      default: () => {}
    },
    datasetInfo: {
      type: Object,
      default: () => {}
    },
  },
  mixins: [FileDetails, RequestDownloadFile],
  async setup(props) {
    try {
      const config = useRuntimeConfig()
      const { $portalApiClient } = useNuxtApp()
      const image_identifier = props.biolucidaData.biolucida_image_id
      const viewId = props.biolucidaData.share_link.replace(
        config.public.BL_SHARE_LINK_PREFIX,
        ''
      )
      const [
        blv_info,
        view_info,
        image_info,
        xmp_metadata,
        readme_markdown
      ] = await Promise.all([
        biolucida.getBLVLink($portalApiClient, image_identifier),
        biolucida.decodeViewParameter(viewId),
        biolucida.getImageInfo($portalApiClient, image_identifier),
        biolucida.getXMPInfo($portalApiClient, image_identifier),
        fetch(props.datasetInfo.readme).then((response) => {
          return response.text()
        })
      ])
      const BASE_URL = `blv:${config.public.BL_SERVER_URL}`
      const queryParameters = `image_id=${image_identifier}&type=${view_info[1]}${view_info[2]}&filename=${image_info.name}`
      const webNeurolucidaLink = BASE_URL + '/image_view?' + queryParameters

      const html = MarkedMixin.methods.parseMarkdown(readme_markdown)
      const data_collection = extractSection(/data collect[^:]+:/i, html)
      const blv_link = blv_info['link']
      const web_neurolucida_link = webNeurolucidaLink
      return {
        data_collection,
        blv_link,
        web_neurolucida_link,
        image_info,
        xmp_metadata
      }
    } catch (e) {
      console.log(e)
    }
  },
  computed: {
    title: function() {
      return propOr("", 'name', this.datasetInfo)
    },
    datasetId() {
      return propOr(undefined, "id", this.datasetInfo)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/_viewer.scss';
</style>
