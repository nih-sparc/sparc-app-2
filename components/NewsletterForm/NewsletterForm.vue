<template>
  <div>
    <page-hero class="py-24">
      <h1 class="mb-8">Communication Preferences</h1>
      <div class="body2">Thank you for your interest in SPARC! We want to ensure you receive information that's relevant, impactful, and tailored to your interests. Please fill out this form to update your communication preferences and help us deliver the updates and insights you care about most. It’s quick, easy, and ensures you stay connected to what matters to you.
      <br /><br />To ensure that you receive messages from the SPARC Data and Resource Center, please add info@sparc.science to your Safe Senders list. Be sure to check your SPAM filter for missed messages.</div>
    </page-hero>
      <div class="container" id="hubspot-form-container"></div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { useMainStore } from '../../store/index.js'
import { storeToRefs } from 'pinia'

const mainStore = useMainStore()
const { profileEmail } = storeToRefs(mainStore)
const newsletterForm = ref(null)

const prefillFormValues = (form) => {
  if (form == null) return
  // Prepopulate email if they are logged in
  const emailField = form.querySelector('input[name="email"]')
  emailField.value = profileEmail.value
  emailField.dispatchEvent(new Event("input", { bubbles: true }))
}

// Watcher for profileEmail
watch(profileEmail,
  async (newEmail) => {
    if (newEmail && newEmail.trim() !== '') {
      prefillFormValues(newsletterForm.value)
    }
  },
  { immediate: true }
)

watch(newsletterForm,
  (newForm) => {
    if (newForm == null) return
    prefillFormValues(newForm)
  }
)

const initializeForm = () => {
  // Generated from Hubspot. Docs: https://knowledge.hubspot.com/forms/how-can-i-share-a-hubspot-form-if-im-using-an-external-site
  const script = document.createElement('script')
  script.src = '//js.hsforms.net/forms/embed/v2.js'
  script.charset = 'utf-8'
  script.type = 'text/javascript'

  script.onload = () => {
    // Once the script is loaded, initialize the form
    if (window.hbspt) {
      hbspt.forms.create({
        portalId: "22776713",
        formId: "0fb8ac44-1764-40ce-b344-7dfafc8f2f24",
        target: '#hubspot-form-container',
        onFormReady: (form) => {
          newsletterForm.value = form
        },
      })
    }
  }

  // Append the script to the document body
  document.body.appendChild(script)
}

onMounted(() => {
  initializeForm()
})

</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.container {
  margin-top: 1rem !important;
}
</style>
