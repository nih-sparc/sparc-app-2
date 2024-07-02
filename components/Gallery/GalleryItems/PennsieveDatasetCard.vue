<template>
  <el-card :style="{ border: 'none', maxWidth: width + 'rem' }" class="card">
    <el-row :gutter="20">
      <el-col v-if="banner != ''" :span="8">
        <img class="banner-image" :src="banner" />
      </el-col>
      <el-col class="body1" :span="16">
        <div>
          {{ datasetTitle }}
        </div>
        <el-button @click="launchPennsieve" class="secondary mt-8">Launch Pennsieve<svgo-icon-open class="open-icon"/><!--<a target="_blank" :href="link">Launch Pennsieve<svgo-icon-open class="open-icon" /></a>--></el-button>
        <img v-if="organizationLogo != ''" class="logo mt-12" :src="organizationLogo" />
      </el-col>
    </el-row>
  </el-card>
</template>

<script>
import { pathOr, propOr } from 'ramda'
import { mapState } from 'pinia'
import { useMainStore } from '../../store/index.js'
import { getOrganizationInfo } from '@/static/js/organizations'
import { failMessage } from '@/utils/notification-messages'

export default {
  name: 'PennsieveDatasetCard',
  props: {
    item: {
      type: Object,
      default: {}
    },
    width: {
      type: Number,
      default: 68
    },
  },
  computed: {
    ...mapState(useMainStore, ['userToken']),
    banner() {
      return propOr('', 'banner', this.item)
    },
    organizationId() {
      return propOr('', 'organization', this.item)
    },
    organizationLogo() {
      return propOr('', 'logo', this.organizationInfo)
    },
    organizationInfo() {
      return getOrganizationInfo(this.organizationId)
    },
    datasetId() {
      return pathOr('', ['content', 'id'], this.item)
    },
    datasetTitle() {
      return pathOr('', ['content', 'name'], this.item)
    },
    link() {
      return `${this.$config.public.PENNSIEVE_URL}/${this.organizationId}/datasets/${this.datasetId}/overview`
    }
  },
  methods: {
    async launchPennsieve() {
      try {
        const intId = this.organizationInfo.intId
        await this.$axios.put(`${this.$config.public.LOGIN_API_URL}/session/switch-organization?organization_id=${intId}&api_key=${this.userToken}`)
        window.open(this.link, '_blank')
      } catch (e) {
        failMessage("Unable to launch Pennsieve at this time")
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.card {
  background-color: transparent;
  position: relative;
  cursor: default;
  text-align: left;
}
.banner-image {
  display: block;
  width: 100%;
  max-height: 200px;
}
.dataset-name {
  overflow-wrap: anywhere;
}
.open-icon {
  height: 1.5rem;
  width: 1.5rem;
}
a {
  text-decoration: none;
}
.logo {
  width: 4rem;
}
</style>
