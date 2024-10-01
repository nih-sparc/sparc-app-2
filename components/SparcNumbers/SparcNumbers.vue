<template>
  <div class="container p-24">
    <div class="heading2">
      SPARC by the numbers
    </div>
    <Consortias />
    <div class="body1">
      We have <b><span class="heading2">{{ totalContributors }}</span></b> total contributors. Explore the data to
      find out what amazing research we have:
    </div>
    <div class="data-wrap pt-16">
      <nuxt-link v-for="item in exploreData" :key="item.sys.id" class="consortia-item"
        :to="`${item.fields.link}`">
        <img :src="imageUrl(item)" :alt="`Icon for ${item.fields.label} category`" />
        <p class="mb-0 mt-8">
          {{ item.fields.label }}
        </p>
      </nuxt-link>
    </div>
  </div>
</template>

<script>
import { pathOr } from 'ramda'
import { getPreviousDate } from '@/utils/common'
import Consortias from '@/components/Consortias/Consortias.vue'

export default {
  name: 'SparcNumbers',
  components: {
    Consortias
  },
  async setup() {
    const config = useRuntimeConfig()
    const { $axios } = useNuxtApp()
    let currentMonth = new Date().getMonth() + 1
    currentMonth = currentMonth.toString().padStart(2, "0")
    const currentYear = new Date().getFullYear()
    // we use last months date to get the metrics bc the metrics for the current month aren't published until the end of the month
    const lastMonthsDate = getPreviousDate(currentMonth, currentYear)
    const totalContributors =
      await $axios.get(config.public.METRICS_URL + `/pennsieve?year=${lastMonthsDate.year}&month=${lastMonthsDate.month}`)
      .then(({ data }) => {
        const metrics = data[0]
        return parseInt(metrics['number_of_sparc_users_overall']['N'])
      }).catch(() => {
        const monthBeforeLastDate = getPreviousDate(lastMonthsDate.month, lastMonthsDate.year)
        return $axios
          .get(config.public.METRICS_URL + `/pennsieve?year=${monthBeforeLastDate.year}&month=${monthBeforeLastDate.month}`)
          .then(({ data }) => {
            const metrics = data[0]
            return parseInt(metrics['number_of_sparc_users_overall']['N'])
          })
          .catch(() => {
            return undefined
          })
      })
    return {
      totalContributors
    }
  },
  props: {
    exploreData: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    imageUrl: function (item) {
      return pathOr('', ['fields', 'image', 'fields', 'file', 'url'], item)
    },
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.data-wrap {
  justify-content: center;
  width: 100%;
  display: flex;
}
.consortia-item {
  color: #000;
  text-decoration: none;

  margin: 0rem 2rem;
  text-align: center;

  &:hover,
  &:focus {
    opacity: 0.9;
  }

  img {
    background: #fff;
    border-radius: 50%;
    display: block;
    margin-bottom: 8px;
    width: 128px;
    border: solid 1px #c0c4cc;
    height: 128px;
    object-fit: contain;
    margin: auto;
  }

  p {
    font-size: 1em;
    font-weight: 700;
    color: #24245b;
    width: 11rem;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
