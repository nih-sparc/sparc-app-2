import { defineStore } from 'pinia'
//import auth from '@/services/auth'
import { pathOr, propOr } from 'ramda'

export const useMainStore = defineStore('main', {
  state: () => ({
    counter: 0,
    disableScrolling: false,
    footerData: {},
    hasAcceptedGDPR: false,
    portalNotification: {},
    hasSeenPortalNotification: false,
    cognitoUser: null,
    pennsieveUser: null,
    datasetInfo: {},
    datasetTypeName: "",
    datasetFacetsData: [],
    formOptions: {
      userTypes: [],
      areasOfSparc: [],
      services: [],
      resourceCategories: []
    },
  }),
  getters: {

  },
  actions: {
    async init() {
      await Promise.all([this.fetchContactUsFormOptions(), this.fetchFooterData(), this.fetchPortalNotification()])
      //await dispatch('user/fetchUser')
    },
    increment() {
      this.counter++
    },
    updateDisabledScrolling(value) {
      this.disableScrolling = value
    },
    setFooterData(value) {
      this.footerData = value
    },
    setHasAcceptedGDPR(value) {
      this.hasAcceptedGDPR = value
    },
    setPortalNotification(value) {
      this.portalNotification = value
    },
    setHasSeenPortalNotification(value) {
      this.hasSeenPortalNotification = value
    },
    setDatasetInfo(value) {
      this.datasetInfo = value
    },
    setDatasetTypeName(value) {
      this.datasetTypeName = value
    },
    setDatasetFacetsData(value) {
      this.datasetFacetsData = value
    },
    setFormOptions(value) {
      this.formOptions = value
    },
    async fetchContactUsFormOptions() {
      try {
        const response = await useNuxtApp().$contentfulClient.getEntry(useRuntimeConfig().public.ctf_contact_us_form_options_id)
        const fields = response.fields
  
        const formOptions = {
          userTypes: propOr([], 'typeOfUser', fields),
          areasOfSparc: propOr([], 'areaOfSparcPortal', fields),
          services: propOr([], 'services', fields),
          resourceCategories: propOr([], 'resourceCategories', fields)
        }
        
        this.setFormOptions(formOptions)
      } catch (e) {
        console.error(e)
      }
    },
    async fetchPortalNotification() {
      try {
        const response = await useNuxtApp().$contentfulClient.getEntry(useRuntimeConfig().public.ctf_portal_notification_entry_id)
        const newNotificationMessage = pathOr('', ['fields', 'message'], response)
        //const notificationMessage = useCookie('PortalNotificationMessage', { default: () => {} })
        //const hasSeenNotification = useCookie('PortalNotification:hasBeenSeen', { default: () => false })
        // If the message has changes then reset if the user has seen it to false
        if (newNotificationMessage != this.notificationMessage) {
          this.setHasSeenPortalNotification(false)
          //hasSeenNotification.value = false
          //notificationMessage.value = newNotificationMessage
        }
        this.setPortalNotification(response.fields)
        //this.setHasSeenPortalNotification(hasSeenNotification)
      } catch (e) {
        console.error(e)
      }
    },
    async fetchFooterData() {
      try {
        const response = await useNuxtApp().$contentfulClient.getEntry(useRuntimeConfig().public.ctf_footer_copy_id)
        this.setFooterData(response.fields)
        // Load GDPR cookie info
        //const hasAcceptedGDPR = await useNuxtApp().useCookie('GDPR:accepted', { default: () => false })
        //this.setHasAcceptedGDPR(hasAcceptedGDPR)
      } catch (e) {
        console.error(e)
      }
    }
  },
  persist: {
    storage: persistedState.localStorage,
  }
})
