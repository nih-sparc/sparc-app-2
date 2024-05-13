import { propOr } from 'ramda'
export default {
  data() {
    return {
      consortiaStyle: {}
    }
  },
  methods: {
    /**
     * Fetch dataset information from discover api with dataset id and version
     */
    async fetchConsortiaStyle(consortiaId) {
      const consortiaItem =
        await this.$contentfulClient.getEntries({
          content_type: this.$config.public.ctf_consortia_content_type_id,
          'fields.title': consortiaId
        }).then(response => {
          return propOr([], 'items', response)[0]
        }).catch(() => { })
      const { firstColor, secondColor, thirdColor } = propOr('', 'fields', consortiaItem)
      this.consortiaStyle = thirdColor == undefined && secondColor == undefined ?
        { backgroundColor: `#${firstColor}` } : thirdColor == undefined ?
        { backgroundImage: `linear-gradient(#${firstColor}, #${secondColor}` } :    
        { backgroundImage: `linear-gradient(#${firstColor}, #${secondColor}, #${thirdColor}` }
    },
  }
}
