<template>
  <Head>
    <Title>SPARC Profile</Title>
    <Meta name="og:title" hid="og:title" content="SPARC Profile" />
    <Meta name="twitter:title" content="SPARC Profile" />
    <Meta name="description" hid="description" content="The SPARC Portal account allows you to fully utilize portal functionality." />
    <Meta name="og:description" hid="og:description" content="The SPARC Portal account allows you to fully utilize portal functionality." />
    <Meta name="twitter:description" content="The SPARC Portal account allows you to fully utilize portal functionality." />
  </Head>
  <div>
    <template v-if="!userToken">
      <login-modal 
        :show-dialog=true 
        @dialog-closed="dialogClosed" 
      />
    </template>
    <template v-else>
      <breadcrumb :breadcrumb="breadcrumb" :title=title />
      <page-hero class="py-24">
        <h1>{{ title }}</h1>
        <p>
          The SPARC Portal account allows you to fully utilize portal functionality. <a
            href="https://docs.sparc.science/docs/sparc-portal-login" target="_blank">Learn more</a> about which
          features
          require login and find out more details about why a Pennsieve account is created for you in the process.
        </p>
      </page-hero>
      <div class="background-container">
        <div class="container py-24">
          <div class="section p-16 mt-16">
            <div class="heading2">
              My Information
            </div>
            <el-row>
              <el-col :span=12>
                <div class="body1">First name: <span class="heading3"><b>{{firstName}}</b></span></div>
                <div class="body1">Last name: <span class="heading3"><b>{{lastName}}</b></span></div>
                <div class="body1">E-mail: <span class="heading3"><b>{{profileEmail}}</b></span></div>
              </el-col>
              <el-col :span=12>
                <div v-if="orcid" class="body1">ORCID:
                  <span>
                    <a :href="orcidUri" target="_blank">{{ orcid }}</a>
                  </span>
                </div>
              </el-col>
            </el-row>
          </div>
          <div class="section heading2 p-16 mt-16">
            Available Resources
            <div class="resource-container body1">
              SPARC Newsletter:
              <template v-if="!isSubscribed">
                <span class="label4"><b>You are not subscribed.</b></span>
                <div class="body4">
                  Keep up to date with all the latest news and events from the SPARC Portal by subscribing to our
                  newsletter. View all past newsletters <a
                    href="//us2.campaign-archive.com/home/?u=e60c48f231a30b544eed731ea&id=c81a347bd8"
                    target="_blank">here</a>.
                </div>
                <div class="mt-8">
                  <el-button class='secondary' @click="handleSubscribeButtonClicked">Subscribe to newsletter</el-button>
                </div>
              </template>
              <template v-else>
                <span class="label4"><b>You are currently subscribed.</b></span>
                <div class="body1">
                  View all past newsletters <nuxt-link to="/news-and-events#stayConnected">here</nuxt-link>.
                </div>
                <div class="mt-8">
                  <el-button class='secondary' @click="unsubscribeFromNewsletter(profileEmail)">Un-subscribe from
                    newsletter</el-button>
                </div>
              </template>
            </div>
            <div class="resource-container body1">
              Pennsieve:
              <span class="label4"><b>You are registered.</b></span>
              <div class="body4 mb-8">
                The Pennsieve Data Management Platform provides a scalable cloud-based solution for managing, analyzing,
                and sharing scientific datasets.
              </div>
              <div class="org-container">
                <template v-for="organization in organizations" :key="organization.id">
                  <repository-card 
                    :organizationInfo="organization"
                  />
                </template>
              </div>
            </div>
          </div>

          <div class="section heading2 p-16 mt-16">
            Available Shortcuts
            <div class="resource-container body1">
              Map Annotation:
              <template v-if="annotatorAuthenticated">
                  <span class="label4"><b>You are authenticated.</b></span>
                  <span class="help-link">
                    <a href="https://docs.sparc.science/docs/sparc-portal-annotation-tool" target="_blank">
                      Find out more about the annotator
                    </a>
                  </span>
                <div class="body4">
                  Explore the latest map updates and add annotations to enhance current maps. 
                  e.g. The Anatomical Connectivity (AC) flatmaps, the Functional Connectivity (FC) flatmap and the Whole-body (3D) models.
                </div>
                <div class="mt-8">
                  <el-button class='secondary' @click="handleAnnotateButtonClicked('ac')">Annotate on AC Map</el-button>
                  <el-button class='secondary' @click="handleAnnotateButtonClicked('fc')">Annotate on FC Map</el-button>
                  <el-button class='secondary' @click="handleAnnotateButtonClicked('wholebody')">Annotate on 3D Body</el-button>
                </div>
              </template>
              <template v-else>
                <span class="label4"><b>You are unauthenticated.</b></span>
                <div class="body4">
                  The annotation feature is currently accessible to a select group of users. 
                  If you're interested in contributing, please contact the MAP team to request access.
                </div>
                <div class="mt-8">
                  <el-button class='secondary' @click="requestAnnotationAccess">Request access</el-button>
                </div>
              </template>
            </div>
          </div>

          <div class="section heading2 p-16 mt-16">
            <div class="datasets-container-title">
              <span class="heading2 mb-16">Published Datasets ({{ datasets.length }})</span>
              <span>
                <client-only>
                  <el-popover width="fit-content" trigger="hover" :append-to-body=false popper-class="popover">
                    <template v-slot:reference>
                      <svgo-icon-help class="icon-help" />
                    </template>
                    <div>
                      My published Datasets relates to all Datasets, Computational and Anatomical models where you have
                      been
                      associated to the dataset using your ORCID number. If there are datasets that you feel should be
                      linked to you please contact curation@sparc.science
                    </div>
                  </el-popover>
                </client-only>
              </span>
            </div>
            <gallery v-loading="datasetsLoading" galleryItemType="datasets" :items="datasets" />
          </div>

          <div class="section heading2 p-16 mt-16">
            <div class="datasets-container-title">
              <span class="heading2 mb-16">In Progress Datasets ({{ inProgressDatasets.length }})</span>
              <span>
                <client-only>
                  <el-popover width="fit-content" trigger="hover" :append-to-body=false popper-class="popover">
                    <template v-slot:reference>
                      <svgo-icon-help class="icon-help" />
                    </template>
                    <div>
                      In Progress Datasets relates to all Datasets, Computational and Anatomical models that you have created on Pennsieve and are not yet published. If there are datasets that you feel should be
                      linked to you please contact curation@sparc.science
                    </div>
                  </el-popover>
                </client-only>
              </span>
            </div>
            <gallery v-loading="inProgressDatasetsLoading" galleryItemType="inProgressDatasets" :items="inProgressDatasets" />
          </div>

          <div v-if="showDatasetSubmissionFeature" class="section heading2 p-16 mt-16">
            <div class="datasets-container-title">
              <span class="heading2">Dataset Submission Requests ({{ datasetSubmissions.length }})</span>
              <span>
                <client-only>
                  <el-popover width="fit-content" trigger="hover" :append-to-body=false popper-class="popover">
                    <template v-slot:reference>
                      <svgo-icon-help class="icon-help" />
                    </template>
                    <div>
                      In order to publish a dataset on the SPARC Portal your submission must first be approved by the
                      curation team. If there are dataset requests that you think are missing please contact
                      curation@sparc.science
                    </div>
                  </el-popover>
                </client-only>
              </span>
            </div>
            <div v-loading="submissionsLoading">
              <template v-for="datasetSubmission in datasetSubmissions" :key="datasetSubmission.id">
                <div class="resource-container row">
                  <span class="body1 left-col mr-16">
                    <a class="link1 submission-name" :href="getSubmissionLink(datasetSubmission)">
                      {{ datasetSubmission.name }}
                    </a>
                    <div v-if="isDraft(datasetSubmission)" class="body4">
                      Updated: {{ getUpdatedDate(datasetSubmission) }}
                    </div>
                    <div v-else class="body4">
                      Submitted: {{ getSubmittedDate(datasetSubmission) }}
                    </div>
                    <div class="label1">
                      Status: {{ getStatus(datasetSubmission) }}
                    </div>
                  </span>
                  <span class="right-col">
                    <template v-if="isDraft(datasetSubmission)">
                      <el-button @click="submitDraft(datasetSubmission.nodeId)" class="secondary submit-button">
                        Submit Draft
                      </el-button>
                      <el-button @click="deleteClicked(datasetSubmission)" class="danger">
                        Delete Draft
                      </el-button>
                    </template>
                    <el-button v-else-if="isSubmitted(datasetSubmission)" @click="retractClicked(datasetSubmission)"
                      class="secondary">
                      Retract Request
                    </el-button>
                    <el-button v-else-if="isWithdrawn(datasetSubmission) || isRejected(datasetSubmission)"
                      @click="deleteClicked(datasetSubmission)" class="danger">
                      Delete Request
                    </el-button>
                  </span>
                </div>
              </template>
            </div>
            <el-button class='secondary mt-16' @click="newRequestClicked">Submit new request</el-button>
          </div>
        </div>
      </div>
      <dataset-submission-modal :show-modal="showDatasetSubmissionModal" :questions="questions"
        :default-form="defaultForm" :disabled="datasetSubmissionDisabled"
        @modal-closed="showDatasetSubmissionModal = false" @proposal-submitted="fetchDatasetSubmissions" />
      <confirmation-modal :show-modal="showDeleteConfirmationModal" @confirmed="deleteSubmission"
        @cancelled="showDeleteConfirmationModal = false"
        @modal-closed="showDeleteConfirmationModal = false; submissionToDelete = ''">
        <template #confirmationBody>
          <div class="confirmation-body">
            <p class="label4">
              Delete Dataset Proposal: "{{submissionToDelete.name}}"?
            </p>
            <p class="body4 danger-text">
              This will permanently delete the dataset proposal.
            </p>
          </div>
        </template>
      </confirmation-modal>
      <confirmation-modal :show-modal="showRetractConfirmationModal" @confirmed="retractSubmission"
        @cancelled="showRetractConfirmationModal = false"
        @modal-closed="showDeleteConfirmationModal = false; submissionToRetract = ''">
        <template #confirmationBody>
          <div class="confirmation-body">
            <p class="label4">
              Withdraw Dataset Proposal: "{{submissionToRetract.name}}"?
            </p>
            <p class="body4 danger-text">
              This will withdraw the request to review and consider the dataset proposal from SPARC.
            </p>
          </div>
        </template>
      </confirmation-modal>
    </template>
  </div>
</template>

<script>
import { failMessage } from '@/utils/notification-messages'
import { pathOr, propOr } from 'ramda'
import { useMainStore } from '@/store/index.js'
import { mapState } from 'pinia'
import Gallery from '@/components/Gallery/Gallery.vue'
import NewsletterMixin from '@/components/ContactUsForms/NewsletterMixin'
import DatasetSubmissionModal from '@/components/DatasetSubmissionModal/DatasetSubmissionModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal/ConfirmationModal.vue'
import RepositoryCard from '@/components/RepositoryCard/RepositoryCard.vue'
import LoginModal from '@/components/LoginModal/LoginModal.vue'
import { getOrganizationInfo, getOrganizationStatus } from '@/static/js/organizations'
export default {
  name: 'profile',
  components: {
    ConfirmationModal,
    DatasetSubmissionModal,
    Gallery,
    RepositoryCard,
    LoginModal
  },
  mixins: [NewsletterMixin],
  data: () => {
    return {
      title: "SPARC Profile",
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        }
      ],
      datasets: [],
      datasetSubmissions: [],
      showDatasetSubmissionModal: false,
      datasetsLoading: true,
      inProgressDatasets: [],
      inProgressDatasetsLoading: true,
      submissionsLoading: true,
      questions: [],
      defaultForm: {},
      datasetSubmissionDisabled: false,
      submissionToDelete: '',
      showDeleteConfirmationModal: false,
      submissionToRetract: '',
      showRetractConfirmationModal: false,
      organizations: [],
      annotatorAuthenticated: false
    }
  },
  async setup() {
    const config = useRuntimeConfig()
    const { $axios } = useNuxtApp()
    const mainStore = useMainStore()
    let downloadsSummary = 0

    try {
      const startDate = new Date('2000', '1');
      const currentDate = new Date()
      const url = `${config.public.LOGIN_API_URL}/discover/metrics/dataset/downloads/summary`
      downloadsSummary = await $axios.get(url, {
        params: { startDate: startDate, endDate: currentDate }
      }).then(({ data }) => {
        return data
      })
    } catch (error) {
      return 0
    }

    const headers = {
      "Accept": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
    let annotatorAuthenticated = false
    const url = `${config.public.flatmap_api}annotator/authenticate?key=${mainStore.userToken}&session=`
    annotatorAuthenticated = await $axios.get(url, { headers }).then(() => {
      return true
    }).catch(() => {
      return false
    })

    return {
      downloadsSummary,
      annotatorAuthenticated
    }
  },
  computed: {
    ...mapState(useMainStore, ['profileEmail', 'userProfile', 'userToken', 'firstName', 'lastName']),
    isSubscribed: function () {
      return propOr('unsubscribed', 'status', this.memberInfo) === 'subscribed'
    },
    orcid() {
      return pathOr(null, ['orcid', 'orcid'], this.userProfile)
    },
    orcidUri() {
      return `https://orcid.org/${this.orcid}`
    },
    showDatasetSubmissionFeature() {
      return this.$config.public.SHOW_DATASET_SUBMISSION_FEATURE == 'true'
    }
  },
  watch: {
    profileEmail: {
      handler: async function (newValue) {
        if (newValue !== '') {
          this.getMemberInfo(newValue)
        }
      },
      immediate: true
    },
    orcid: {
      handler: async function (newValue) {
        if (newValue && newValue !== '') {
          await this.fetchOrganizations()
          this.fetchPublishedDatasets(newValue)
          this.fetchInProgressDatasets()
          this.fetchDatasetSubmissions()
          this.fetchQuestions()
        }
      },
      immediate: true
    },
  },
  methods: {
    async fetchPublishedDatasets(orcid) {
      const filter = `contributors.curie:\"ORCID:${orcid}\"`

      try {
        const { hits } = await this.$algoliaClient.initIndex(this.$config.public.ALGOLIA_INDEX).search('', {
          filters: filter,
          hitsPerPage: 999
        })

        let items = []

        for (const hit of hits) {
            const datasetName = pathOr('', ['item', 'name'], hit)
            const datasetId = propOr('', 'objectID', hit)
            const pennsieveIdentifier = pathOr('', ['item', 'identifier'], hit)

            let numCitations = await this.getCitationsCount(pennsieveIdentifier)

            const numDownloads = this.getDownloadsCount(datasetId);

            items.push({
                'name': datasetName,
                'intId': datasetId,
                'banner': pathOr('', ['pennsieve', 'banner', 'uri'], hit),
                'numDownloads': numDownloads,
                'numCitations': numCitations
            })
        }

        this.datasets = items
      } catch (error) {
        this.datasets = []
      } finally {
        this.datasetsLoading = false
      }
    },
    async fetchInProgressDatasets() {
      let orgIntIds = []
      this.organizations.forEach(org => {
        orgIntIds.push(org.intId)
      })

      for (let id of orgIntIds) {
        try {
          await this.$axios.put(`${this.$config.public.LOGIN_API_URL}/session/switch-organization?organization_id=${id}&api_key=${this.userToken}`)

          let { data } = await this.$axios.get(`${this.$config.public.LOGIN_API_URL}/datasets/paginated?onlyMyDatasets=true&publicationStatus=draft&api_key=${this.userToken}`)
          const datasets = data.datasets

          datasets.forEach(async dataset => { 
            let datasetId = dataset.content.id
            let { data } = await this.$axios.get(`${this.$config.public.LOGIN_API_URL}/datasets/${datasetId}/banner?api_key=${this.userToken}`)
            this.inProgressDatasets.push({
              ...dataset,
              banner: data.banner
            })
          })
        } catch(e) {}
      }
      this.inProgressDatasetsLoading = false
    },
    async fetchDatasetSubmissions() {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      this.datasetSubmissions = await this.$axios
        .get(`${this.$config.public.PENNSIEVE_API_VERSION_2}/publishing/proposal`, { headers })
        .then(({ data }) => {
          return data == null ? [] : data
        }).catch(() => {
          return []
        }).finally(() => {
          this.submissionsLoading = false
        })
    },
    async fetchQuestions() {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      const repoUrl = `${this.$config.public.PENNSIEVE_API_VERSION_2}/publishing/repositories`
      await this.$axios
        .get(repoUrl, { headers })
        .then(({ data }) => {
          this.questions = data.find(repo => repo.name === 'sparc')?.questions
        }).catch(() => {
          this.hasError = true
        })
    },
    async getCitationsCount(id) {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      const url = `${this.$config.public.LOGIN_API_URL}/datasets/${id}/external-publications`

      try {
          const response = await this.$axios.get(url, { headers })
          const count = response.data.length
          
          return count;
      } catch (error) {
          return 0
      }
    },
    async fetchOrganizations() {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      const url = `${this.$config.public.LOGIN_API_URL}/organizations?includeAdmins=false`
      this.organizations = await this.$axios.get(url, { headers }).then(({ data }) => {
        const orgsResponse = propOr([], 'organizations', data)
        let orgs = []
        orgsResponse.forEach(org => {
          const organization = propOr({}, 'organization', org)
          const organizationInfo = getOrganizationInfo(organization.id)
          if (organizationInfo != null) {
            orgs.push({ ...organizationInfo, status: getOrganizationStatus(org) })
          }
        })
        return orgs
      }).catch(() => {
        this.hasError = true
        return []
      })
    },
    getDownloadsCount(id) {
      let numDownloads = 0
      this.downloadsSummary.filter(download => download.datasetId == id).forEach(item => {
        numDownloads += item.downloads;
      })
      return numDownloads
    },
    getSubmittedDate(submission) {
      const unixTime = propOr('0', 'submittedAt', submission)
      const submittedDate = new Date(unixTime * 1000)
      const month = submittedDate.toLocaleString('default', { month: 'long' })
      return `${submittedDate.getDate()} ${month} ${submittedDate.getFullYear()}`
    },
    getUpdatedDate(submission) {
      const unixTime = propOr('0', 'updatedAt', submission)
      const updatedDate = new Date(unixTime * 1000)
      const month = updatedDate.toLocaleString('default', { month: 'long' })
      return `${updatedDate.getDate()} ${month} ${updatedDate.getFullYear()}`
    },
    isDraft(submission) {
      return propOr('', 'proposalStatus', submission) === 'DRAFT'
    },
    isSubmitted(submission) {
      return propOr('', 'proposalStatus', submission) === 'SUBMITTED'
    },
    isWithdrawn(submission) {
      return propOr('', 'proposalStatus', submission) === 'WITHDRAWN'
    },
    isRejected(submission) {
      return propOr('', 'proposalStatus', submission) === 'REJECTED'
    },
    getStatus(submission) {
      return propOr('UNKNOWN', 'proposalStatus', submission)
    },
    newRequestClicked() {
      this.defaultForm = {}
      this.datasetSubmissionDisabled = false
      this.showDatasetSubmissionModal = true
    },
    getSubmissionLink(submission) {
      return `${this.$config.public.PENNSIEVE_URL}/${submission.organizationNodeId}/datasets/${submission.datasetNodeId}`
    },
    submitDraft(nodeId) {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      this.$axios
        .post(`${this.$config.public.PENNSIEVE_API_VERSION_2}/publishing/proposal/submit?node_id=${nodeId}`, {}, { headers })
        .catch(() => {
          failMessage('Failed to submit draft.')
        }).finally(() => {
          this.fetchDatasetSubmissions()
        })
    },
    deleteClicked(nodeId) {
      this.submissionToDelete = nodeId
      this.showDeleteConfirmationModal = true
    },
    deleteSubmission() {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      this.$axios
        .delete(`${this.$config.public.PENNSIEVE_API_VERSION_2}/publishing/proposal?proposal_node_id=${this.submissionToDelete.nodeId}`, { headers })
        .catch(() => {
          failMessage('Failed to delete.')
        }).finally(() => {
          this.fetchDatasetSubmissions()
          this.showDeleteConfirmationModal = false
        })
    },
    retractClicked(submission) {
      this.submissionToRetract = submission
      this.showRetractConfirmationModal = true
    },
    retractSubmission() {
      const headers = { 'Authorization': `Bearer ${this.userToken}` }
      this.$axios
        .post(`${this.$config.public.PENNSIEVE_API_VERSION_2}/publishing/proposal/withdraw?node_id=${this.submissionToRetract.nodeId}`, {}, { headers })
        .catch(() => {
          failMessage('Failed to retract request.')
        }).finally(() => {
          this.fetchDatasetSubmissions()
          this.showRetractConfirmationModal = false
        })
    },
    handleSubscribeButtonClicked() {
      this.sendGtmEvent()
      this.subscribeToNewsletter(this.profileEmail, this.firstName, this.lastName)
    },
    dialogClosed() {
      this.$router.push("/")
    },
    sendGtmEvent() {
      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'newsletter_signup',
        files: "",
        file_name: "",
        file_path: "",
        file_type: "",
        location: "profile page",
        category: "",
        dataset_id: "",
        version_id: "",
        doi: "",
        citation_type: ""
      })
    },
    handleAnnotateButtonClicked(type) {
      const link = document.createElement('a')
      link.href = this.$config.public.ROOT_URL + `/apps/maps?type=${type}&mode=annotation`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    requestAnnotationAccess() {
    }
  }
}
</script>
<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.submission-request {
  border: 1px solid $lineColor2;
}
a {
  text-decoration: underline;
}
.section {
  background-color: white;
  border: 2px solid $lineColor1;
}
.icon-help {
  fill: $purple;
}
.background-container {
  background-color: #f5f7fa
}
.resource-container {
  padding: .5rem;
  margin-top: .5rem;
  border: 1px solid $lineColor2;
}
.datasets-container-title {
  display: flex;
  justify-content: space-between;
}
.row {
  display: flex;
  .right-col {
    width: fit-content;
    .secondary,
    .danger {
      display: block;
      margin: 0;
      min-width: 9.75rem;
    }
    .submit-button {
      margin-bottom: .25rem;
    }
  }
  .left-col {
    width: 100%;
  }
}
.link1 {
  text-decoration: underline;
  cursor: pointer;
}
.submission-name {
  width: fit-content;
}
.danger-text {
  color: $danger !important
}
.confirmation-body {
  text-align: center;
}
.icon-open {
  height: 1.25rem;
  width: 1.25rem;
}
.icon-help {
  color: $purple;
  height: 1.5rem;
  width: 1.5rem;
}
.org-container {
  display: flex;
  @media (max-width: 49em) {
    flex-direction: column;
  }
}
:deep(.popover) {
  background-color: #f9f2fc;
  word-wrap: normal;
  word-break: normal;
  max-width: 300px;
}
:deep(.main-content-container) {
  border: unset !important;
}
.help-link {
  float: right;
}
</style>
