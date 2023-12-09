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
    pennsieveUsername (state) {
      const firstName = pathOr('', ['firstName'], state.pennsieveUser)
      const lastName = pathOr('', ['lastName'], state.pennsieveUser)
      const abbrvLastName = lastName.length === 1 ? lastName[0] : `${lastName[0]}.`
      return `${firstName} ${abbrvLastName}`
    },
    firstName (state) {
      return pathOr('', ['firstName'], state.pennsieveUser)
    },
    lastName (state) {
      return pathOr('', ['lastName'], state.pennsieveUser)
    },
    cognitoUsername (state) {
      return pathOr('', ['username'], state.cognitoUser)
    },
    cognitoUserToken (state) {
      return pathOr('', ['signInUserSession', 'accessToken', 'jwtToken'], state.cognitoUser)
    },
    cognitoUserAttributes (state) {
      return pathOr({}, ['attributes'], state.cognitoUser)
    },
    pennsieveUserIntId (state) {
      return pathOr('', ['intId'], state.pennsieveUser)
    },
    profileColor (state) {
      return pathOr('', ['color'], state.pennsieveUser)
    },
    profileUrl (state) {
      return pathOr('', ['url'], state.pennsieveUser)
    },
    profilePreferredOrganization (state) {
      return pathOr('', ['preferredOrganization'], state.pennsieveUser)
    },
    profileEmail (state) {
      return pathOr('', ['email'], state.pennsieveUser)
    },
    profileComplete (state) {
      return helperMethods.isProfileComplete(state.pennsieveUser)
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
    setCognitoUser(value) {
      this.cognitoUser = value
    },
    setPennsieveUser(value) {
      this.pennsieveUser = value
    },
    async login(providerName){
      await auth.signIn(providerName)
      await this.fetchUser()
    },
    async logout(){
      //this.$cookies.set('user-token', null)
      await auth.signOut()
      await this.fetchUser()
    },
    async fetchUser(){
      const user = await auth.user()
      const profile = await auth.userProfile()
      const token = pathOr(null, ['signInUserSession', 'accessToken', 'jwtToken'], user)
      const unixExpirationDate = pathOr('', ['signInUserSession', 'accessToken', 'payload', 'exp'], user)
      const expirationDate = unixExpirationDate ? new Date(unixExpirationDate * 1000) : null
      //this.$cookies.set('profile-complete', helperMethods.isProfileComplete(profile), expirationDate)
      //this.$cookies.set('user-token', token, expirationDate)
      this.setCognitoUser(user)
      this.setPennsieveUser(profile)
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
