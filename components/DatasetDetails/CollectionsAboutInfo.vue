<template>
  <div class="dataset-about-info">
    <div class="heading2 mb-8">
      About this collection
    </div>
    <div class="mb-16"><span class="label4">Title: </span>{{datasetTitle}}</div>
    <div class="mb-16"><span class="label4">First Published: </span>{{firstPublishedDate}}</div>
    <div class="mb-16"><span class="label4">Last Published: </span>{{latestVersionDate}}</div>
    <hr />
    <div class="about-section-container">
      <span class="author-section-name-column label4">Contact Author: </span>
      <span>
        <div>{{datasetOwnerName}}</div>
        <div>
          <a
            :href="`mailto:${datasetOwnerEmail}`"
          >
            {{ datasetOwnerEmail }}
          </a>
        </div>
      </span>
    </div>
    <hr />
    <h2 class="heading2 mb-8">
      About this version
    </h2>
    <div class="mb-16"><span class="label4">{{versionRevisionText}}: </span>Publication date: {{publicationDate}} (Last updated: {{lastPublishedDate}})</div>
    <div class="mb-16"><span class="label4">Dataset DOI: </span>
      <a
          :href="doiLink"
      >
        {{ doiLink }}
      </a>
    </div>
  </div>
</template>

<script>
import { propOr } from 'ramda'
import { mapState } from 'pinia'
import { useMainStore } from '../../store'

import DateUtils from '@/mixins/format-date'

export default {
  name: 'DatasetAboutInfo',

  components: {
  },
  props: {
    latestVersionRevision: {
      type: String,
      default: ''
    },
    latestVersionDate: {
      type: String,
      default: ''
    },
  },

  mixins: [DateUtils],

  computed: {
    ...mapState(useMainStore, ['datasetInfo']),
    /**
     * Returns the dataset title
     * @returns {String}
     */
    datasetTitle: function() {
      return propOr('', 'name', this.datasetInfo)
    },
    /**
     * Get formatted originally published date
     * @return {String}
     */
    firstPublishedDate: function() {
      const date = propOr('', 'firstPublishedAt', this.datasetInfo)
      return this.formatDate(date)
    },
    /**
     * Get formatted last updated date
     * @return {String}
     */
    lastPublishedDate: function() {
      const date =
        this.datasetInfo.revisedAt || this.datasetInfo.versionPublishedAt
      return this.formatDate(date)
    },
    /**
     * Get formatted publication date
     * @return {String}
     */
    publicationDate: function() {
      const date = this.datasetInfo.versionPublishedAt
      return this.formatDate(date)
    },
    /**
     * Returns dataset owner full name
     * @returns {String}
     */
    datasetOwnerName: function() {
      const ownerFirstName = this.datasetInfo.ownerFirstName || ''
      const ownerLastName = this.datasetInfo.ownerLastName || ''
      return `${ownerFirstName} ${ownerLastName}`
    },

    /**
     * Returns dataset owner email
     * @returns {String}
     */
    datasetOwnerEmail: function() {
      return this.datasetInfo.ownerEmail || ''
    },
    /**
     * Return DOI link
     * @returns {String}
     */
    doiLink: function() {
      const doi = propOr('', 'doi', this.datasetInfo)
      return doi ? `https://doi.org/${doi}` : ''
    },
    /**
     * computes the right text based on the version and revision
     * @returns {String}
     */
    versionRevisionText() {
      let revision = this.datasetInfo.revision ? this.datasetInfo.revision : '0'
      return `Version ${this.datasetInfo.version} Revision ${revision}`
    }
  }
}
</script>

<style lang="scss" scoped>
.dataset-about-info {
  hr {
    margin-top: 1rem;
    border-top: none;
  }
  a {
    text-decoration: underline;
  }
  .about-section-container {
    display: flex;
    @media (max-width: 48em) {
      flex-direction: column;
    }
    .author-section-name-column {
      min-width: 7.25rem;
    }
  }
}
</style>
