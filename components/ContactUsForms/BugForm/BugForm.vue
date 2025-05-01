<template>
  <el-form
    ref="submitForm"
    label-position="top"
    :model="form"
    :rules="formRules"
    :hide-required-asterisk="true"
  >
    <el-form-item prop="pageUrl" label="Please provide the specific page URL">
      <el-input v-model="form.pageUrl" placeholder="URL">
        <template #prepend>Http://</template>
      </el-input>
    </el-form-item>

    <el-form-item
      prop="shortDescription"
      label="Provide a short description of what you were doing *"
    >
      <el-input
        v-model="form.shortDescription"
        placeholder="(Example: When I click <this button>, <this happens>.)"
      />
    </el-form-item>

    <el-form-item prop="detailedDescription" label="Provide a detailed description *">
      <el-input
        v-model="form.detailedDescription"
        type="textarea"
        :rows="3"
        placeholder="Please provide a detailed description so our team can fully understand the problem."
      />
    </el-form-item>

    <el-form-item prop="stepsToReproduce" label="Provide the steps required to reproduce the issue *">
      <el-input
        v-model="form.stepsToReproduce"
        type="textarea"
        :rows="3"
        placeholder="Please provide specific steps so our team can reproduce your experience in order to resolve the issue."
      />
    </el-form-item>

    <el-form-item
      prop="browser"
      label="What browser were you using? *"
    >
      <el-select
        v-model="form.browser"
        placeholder="Select one"
      >
        <el-option
          v-for="browser in browsers"
          :key="browser"
          :label="browser"
          :value="browser"
        />
      </el-select>
    </el-form-item>

    <hr/>

    <user-contact-form-item showFollowUpOption v-model="form.user"/>

    <hr/>

    <div class="heading2">
      Please check the box to proceed
    </div>

    <el-form-item prop="captchaToken">
      <NuxtTurnstile v-model="form.captchaToken"/>
    </el-form-item>

    <hr/>

    <el-form-item>
      <el-button class="primary" :disabled="isSubmitting" @click="onSubmit">
        Submit
      </el-button>
      <p v-if="hasError" class="error">
        An error has occurred, please try again.
      </p>
    </el-form-item>
  </el-form>
</template>

<script>
import NewsletterMixin from '../NewsletterMixin'
import RecaptchaMixin from '@/mixins/recaptcha/index'
import ParseInputMixin from '@/mixins/parse-input/index'
import UserContactFormItem from '../UserContactFormItem.vue'
import { useMainStore } from '@/store/index'
import { loadForm, populateFormWithUserData, saveForm } from '~/utils/utils'

export default {
  name: 'BugForm',

  mixins: [NewsletterMixin, RecaptchaMixin, ParseInputMixin],

  components: {
    UserContactFormItem
  },

  data() {
    return {
      browsers: ['chrome', 'firefox', 'safari', 'other'],
      form: {
        captchaToken: '',
        pageUrl: '',
        shortDescription: '',
        detailedDescription: '',
        stepsToReproduce: '',
        browser: undefined,
        user: {
          firstName: useMainStore().firstName,
          lastName: useMainStore().lastName,
          email: useMainStore().profileEmail,
          sendCopy: true,
          shouldFollowUp: true,
          shouldSubscribe: false,
        }
      },
      isSubmitting: false,
      formRules: {
        user: {
          typeOfUser: [
            {
              required: true,
              message: 'Please select one',
              trigger: 'change'
            }
          ],
        },
        email: [
            {
              required: false,
              message: 'Please enter your email',
              type: 'email',
              trigger: 'blur',
            }
          ],
        browser: [
          {
            required: true,
            message: 'Please select a browser',
            trigger: 'change'
          }
        ],

        shortDescription: [
          {
            required: true,
            message: 'Please enter a description',
            trigger: 'change'
          }
        ],

        detailedDescription: [
          {
            required: true,
            message: 'Please enter a description',
            trigger: 'change'
          }
        ],

        stepsToReproduce: [
          {
            required: true,
            message: 'Please enter the steps',
            trigger: 'change'
          }
        ],

        captchaToken: [
          {
            required: true,
            message: 'Please check the box',
            trigger: 'change'
          }
        ]
      }
    }
  },

  computed: {
    bugSourceUrl() {
      return this.$route.query.source_url
    },
    formattedDetailedDescription() {
      // GitHub only treats double line breaks as a line break, so must do this to retain when the user presses enter key
      return this.form.detailedDescription?.replace(/\n/g, '<br>\n')
    },
    formattedStepsToReproduce() {
      // GitHub only treats double line breaks as a line break, so must do this to retain when the user presses enter key
      return this.form.stepsToReproduce?.replace(/\n/g, '<br>\n')
    }
  },

  mounted() {
    const config = useRuntimeConfig()
    // Reset form fields when showing the form
    this.$refs.submitForm.resetFields()
    this.hasError = false

    if (this.bugSourceUrl != undefined) {
      const fullUrl = config.public.ROOT_URL + this.bugSourceUrl
      this.form.pageUrl = fullUrl.replace(/^https?:\/\//, '')
    }

    const form = loadForm()
    if (form) {
      this.form = {
        ...this.form,
        ...form
      }
    }
    populateFormWithUserData(this.form, this.firstName, this.lastName, this.profileEmail)
  },

  methods: {
    validateUrl: function(rule, value, callback) {
      if (!value.includes('.') || value.lastIndexOf('.') == value.length - 1 || value.indexOf('.') == 0) {
        callback(new Error(rule.message))
      }
      callback()
    },

    /**
     * Send form to endpoint
     */
    async sendForm() {
      const config = useRuntimeConfig()
      this.isSubmitting = true
      const body = `
<h3>Description</h3>${this.formattedDetailedDescription}\n\n
<h3>Problematic page URL</h3>${this.form.pageUrl ? this.form.pageUrl : 'N/A'}\n\n
<h3>Steps to reproduce</h3>${this.form.stepsToReproduce ? this.formattedStepsToReproduce : 'N/A'}\n\n
<h3>Browser</h3>${this.form.browser ? this.form.browser : 'N/A'}\n\n
<h3>Screenshots</h3>If applicable, add any screenshots or images here to help explain your problem.\n\n
<h3>What type of user are you?</h3>${this.form.user.typeOfUser}\n\n
<h3>Do you want to be notified when this issue is resolved?</h3>${(this.form.user.shouldFollowUp && this.isValidEmail(this.form.user.email)) ? 'Yes' : 'No'}\n\n
<h2>Contact Info</h2>
<h3>Name</h3>${this.form.user.firstName} ${this.form.user.lastName}\n\n
<h3>Email</h3>${this.form.user.email}\n\n`
      let formData = new FormData();
      formData.append("type", "bug")
      formData.append("sendCopy", this.form.user.sendCopy && this.isValidEmail(this.form.user.email))
      formData.append("title", `${this.form.shortDescription}`)
      formData.append("body", body)
      formData.append("captcha_token", this.form.captchaToken)
      // Save form to sessionStorage
      saveForm(this.form)

      try {
        const { data } = await this.$axios.post(`${config.public.portal_api}/create_issue`, formData)
        const url = data?.url
        if (this.form.user.shouldSubscribe && this.isValidEmail(this.form.user.email)) {
          this.subscribeToNewsletter(this.form.user.email, this.form.user.firstName, this.form.user.lastName)
        } else {
          this.$emit('submit', this.form.user.firstName, url)
        }
      } catch (e) {
        ElMessage({
          showClose: true,
          message: `There was a problem when attempting to create a bug report. If this problem persists, please visit <a href='https://github.com/${config.public.GITHUB_ORG}/${config.public.GITHUB_REPO}/issues' target='_blank'>https://github.com/${config.public.GITHUB_ORG}/${config.public.GITHUB_REPO}/issues</a> to file a new issue`,
          type: 'error',
          duration: 0,
          dangerouslyUseHTMLString: true
        })
        this.hasError = true
      }
      this.isSubmitting = false
    }
  },

  watch: {
    firstName() {
      this.form.user.firstName = this.firstName
    },
    lastName() {
      this.form.user.lastName = this.lastName
    },
    profileEmail() {
      this.form.user.email = this.profileEmail
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.submit-button {
  text-align: left;
  margin-bottom: 0 !important;
}
hr {
  border-top: none;
  border-left: none;
  border-width: 2px;
  border-color: $lineColor1;
  margin: 2rem 0;
}
.error {
  color: $danger;
}
.recaptcha {
  display: flex;
  justify-content: left;
}
:deep(.file-upload) {
  .el-form-item__label {
    margin-bottom: .3rem;
  }
  .el-form-item__content {
    display: block;
  }
}
</style>
