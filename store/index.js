import { defineStore } from 'pinia'
import auth from '@/services/auth.js'
import { pathOr } from 'ramda'

export const useMainStore = defineStore('main', {
  state: () => ({
    disableScrolling: false,
    footerData: {},
    portalNotification: {},
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
    userToken(state) {
      return state.userProfile?.token ?? ''
    },
    tokenExp(state) {
      return state.userProfile?.tokenExp ?? ''
    },
    firstName (state) {
      return pathOr('', ['firstName'], state.userProfile)
    },
    lastName (state) {
      return pathOr('', ['lastName'], state.userProfile)
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
    },
    userTypes(state) {
      return pathOr('', ['userTypes'], state.formOptions)
    }
  },
  actions: {
    async init() {
      const appInitializedCookie = useCookie('appInitialized')
      if (!import.meta.server && appInitializedCookie.value === 'true') {
        return
      }
      try {
        await Promise.all([
          this.fetchContactUsFormOptions(),
          this.fetchFooterData(),
          this.fetchPortalNotification()
        ])

        appInitializedCookie.value = 'true'
      } catch (error) {
        console.error('Error during initialization:', error)
      }
    },
    updateDisabledScrolling(value) {
      this.disableScrolling = value
    },
    setFooterData(value) {
      this.footerData = value
    },
    setPortalNotification(value) {
      this.portalNotification = value
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
      const { data } = await useAsyncData(
        'contact-us-form-options',
        () => $fetch('/api/contentful/form-options').catch(() => null),
        { server: true }
      )
      if (data.value) {
        this.setFormOptions(data.value)
      }
    },

    async fetchPortalNotification() {
      const { data } = await useAsyncData(
        'portal-notification',
        () => $fetch('/api/contentful/portal-notification').catch(() => null),
        { server: true }
      )
      if (data.value) {
        this.setPortalNotification(data.value)
      }
    },

    async fetchFooterData() {
      const { data } = await useAsyncData(
        'footer-data',
        () => $fetch('/api/contentful/footer-data').catch(() => null),
        { server: true }
      )
      if (data.value) {
        this.setFooterData(data.value)
      }
    },
    setUserProfile(value) {
      this.userProfile = value
    },
    async login(providerName) {
      await auth.login(providerName)
    },
    async logout(){
      await auth.logout()
    },
  },
  persist: {
    storage: persistedState.localStorage,
    omit: ['footerData', 'portalNotification'],
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
