import { defineStore } from 'pinia'
import auth from '@/services/auth.js'
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
    userProfile: null,
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
    username(state) {
      const firstName = pathOr('', ['firstName'], state.userProfile)
      const lastName = pathOr('', ['lastName'], state.userProfile)
      const abbrvLastName = lastName.length === 1 ? lastName[0] : `${lastName[0]}.`
      return `${firstName} ${abbrvLastName}`
    },
    userIntId(state) {
      return propOr('', 'intId', state.userProfile)
    },
    userToken(state) {
      return propOr('', 'apiKey', state.userProfile)
    },
    firstName (state) {
      return pathOr('', ['firstName'], state.userProfile)
    },
    lastName (state) {
      return pathOr('', ['lastName'], state.userProfile)
    },
    cognitoUsername (state) {
      return pathOr('', ['username'], state.cognitoUser)
    },
    cognitoUserAttributes (state) {
      return pathOr({}, ['attributes'], state.cognitoUser)
    },
    userProfileIntId (state) {
      return pathOr('', ['intId'], state.userProfile)
    },
    profileColor (state) {
      return pathOr('', ['color'], state.userProfile)
    },
    profileUrl (state) {
      return pathOr('', ['url'], state.userProfile)
    },
    profilePreferredOrganization (state) {
      return pathOr('', ['preferredOrganization'], state.userProfile)
    },
    profileEmail (state) {
      return pathOr('', ['email'], state.userProfile)
    },
    profileComplete (state) {
      return helperMethods.isProfileComplete(state.userProfile)
    }
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
    },
    setUserProfile(value) {
      this.userProfile = value
    },
    async login(providerName) {
      await auth.login(providerName)
    },
    async logout(){
      //this.$cookies.set('user-token', null)
      await auth.logout()
    },
  },
  persist: {
    storage: persistedState.localStorage,
  }
})

const helperMethods = {
  isProfileComplete(profile) {
    if (profile) {
      return profile.email.split("@")[1] !== "pennsieve-nonexistent.email" && 
      profile.firstName.toLowerCase() !== "orcid" &&
      profile.lastName.toLowerCase() !== "login"
    }
    return false
  }
}
