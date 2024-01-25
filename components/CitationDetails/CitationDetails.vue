<template>
  <div class="citation-details">
    <div class="heading2 mb-8">
      Dataset Citation
    </div>
    <body>
      To promote reproducibility and give credit to investigators who publish
      their data, we recommend citing your usage of SPARC datasets. To make it
      easy, the SPARC Portal provides the full data citation, including the
      option of different formats, under the Cite tab of each dataset page. For
      more Information, please see our
      <a
        href="https://docs.sparc.science/docs/instructions-for-sparc-investigators-to-cite-their-datasets-in-manuscripts-1"
        target="_blank"
      >
        Help page
      </a>
      .
    </body>
    <br />
    <div v-for="citationType in citationTypes" :key="citationType.type">
      <div class="label4 mb-8">{{citationType.label}}</div>
      <div class="info-citation mb-16 py-16 pl-16 pr-24" v-if="!hasCitationError" v-loading="citationLoading">
        <button class="copy-button" @click="handleCitationCopy(citationType)">
          <img src="../../static/images/copyIcon.png" />
        </button>
        <div
          class="citation-text"
          aria-live="polite"
          v-html="citationType.citationText"
        />
      </div>
      <div class="info-citation mb-16 py-16 pl-16 pr-24" v-else>
        <span class="label4">Internal Server Error</span><br />
        Sorry, something went wrong.<br />
        The dataset citation generator (<a
          href="https://citation.crosscite.org/"
          target="_blank"
        >https://citation.crosscite.org/</a>) encountered an internal error and was unable to complete your
        request.<br />
        Please come back later.
      </div>
    </div>
    <p style="text-align: end">
      More citations available at:
      <a
        :href="`https://citation.crosscite.org/?doi=${doiValue}`"
        target="_blank"
      >
        Crosscite.org
      </a>
    </p>
  </div>
</template>

<script>
import { successMessage, failMessage } from '@/utils/notification-messages'

import ErrorMessages from '@/mixins/error-messages'

export default {
  name: 'CitationDetails',
  props: {
    doiValue: {
      type: String,
      default: ''
    }
  },
  mounted() {
    this.getCitationText()
  },
  data() {
    return {
      citationLoading: false,
      crosscite_host: this.$config.public.crosscite_api_host,
      hasCitationError: false,
      citationTypes: [
        {
          type: 'apa',
          label: 'APA',
          citationText: ''
        },
        {
          type: 'chicago-note-bibliography',
          label: 'Chicago',
          citationText: ''
        },
        {
          type: 'ieee',
          label: 'IEEE',
          citationText: ''
        },
        {
          type: 'bibtex',
          label: 'Bibtex',
          citationText: ''
        }
      ]
    }
  },
  methods: {
    /**
     * gets bibiolography based on citation type for current DOI
     * @param {String} citationType
     */
    getCitationText: function() {
      this.citationLoading = true
      this.hasCitationError = false
      // find all citation types at https://github.com/citation-style-language/style
      this.citationTypes.forEach(citationType => {
        const url = `${this.crosscite_host}/format?doi=${this.doiValue}&style=${citationType.type}&lang=en-US`
        fetch(url)
          .then(response => {
            if (response.status !== 200) {
              throw Error
            }
            return response.text()
          })
          .then(text => {
            citationType.citationText = text
          })
          .catch(() => {
            failMessage(ErrorMessages.methods.crosscite())
            this.hasCitationError = true
          })
          .finally(() => {
            this.citationLoading = false
          })
      })
    },

    /**
     * Handle copy citation to clipboard
     */
    handleCitationCopy: function(citationType) {
      navigator.clipboard.writeText(citationType.citationText).then(() => {
        this.$gtm.trackEvent({
          event: 'interaction_event',
          event_name: 'copy_citation_button_click',
          dataset_id: this.$route.params.datasetId,
          citation_type: citationType.label,
          category: "",
          version_id: "",
          doi: "",
          location: "",
          files: "",
          file_name: "",
          file_path: "",
          file_type: "",     
        })
        successMessage(`${citationType.label} citation copied to clipboard.`)
      }),
        () => {
          failMessage('Failed to copy citation.')
        }
    },
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.citation-details {
  a {
    text-decoration: underline;
  }
  .info-citation {
    background-color: $background;
    position: relative;
    .copy-button {
      border: none;
      background: transparent;
      cursor: pointer;
      position: absolute;
      right: 0;
      top: .25rem;
      img {
        width: 20px;
        height: 20px;
      }
    }
  }
  .citation-text {
    word-wrap: break-word;
  }
}
</style>
