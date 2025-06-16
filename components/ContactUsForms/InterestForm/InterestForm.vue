<template>
  <el-form
    ref="submitForm"
    label-position="top"
    :model="form"
    :rules="formRules"
    :hide-required-asterisk="true"
  >
    <el-form-item
      class="service-categories vertical-content mt-32"
      prop="serviceCategories"
      label="What service(s) are you interested in? *"
    >
      <div class="body4 mb-4"><i>Select all that apply.</i></div>
      <sparc-checkbox
        v-for="service in services"
        v-model="form.serviceCategories"
        :key="service"
        :label="service"
        :display="service"
      />
    </el-form-item>

    <el-form-item prop="additionalInfo" label="Additional Information">
      <el-input
        v-model="form.additionalInfo"
        type="textarea"
        :rows="3"
        placeholder="Please provide any additional information regarding your service request"
      />
    </el-form-item>

    <hr/>

    <user-contact-form-item showFollowUpOption v-model="form.user" />

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
import UserContactFormItem from '../UserContactFormItem.vue'
import { isEmpty } from 'ramda'
import { mapState } from 'pinia'
import { useMainStore } from '@/store/index'
import { loadForm, populateFormWithUserData, saveForm } from '~/utils/utils'

export default {
  name: 'InterestForm',

  mixins: [NewsletterMixin, RecaptchaMixin],

  components: {
    UserContactFormItem
  },

  data() {
    return {
      form: {
        captchaToken: '',
        serviceCategories: [],
        additionalInfo:'',
        user: {
          typeOfUser: '',
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
          email: [
            {
              required: true,
              message: 'Please enter your email',
              type: 'email',
              trigger: 'blur',
            }
          ],
          firstName: [
            {
              required: true,
              message: 'Please enter your first name',
              trigger: 'blur',
            }
          ],
          lastName: [
            {
              required: true,
              message: 'Please enter your last name',
              trigger: 'blur',
            }
          ]
        },
        serviceCategories: [
          {
            required: true,
            message: 'Please select at least one',
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
    ...mapState(useMainStore, {
      services: state => state.formOptions.services
    })
  },

  mounted() {
    // Reset form fields when showing the form
    this.$refs.submitForm.resetFields()
    this.hasError = false
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
    /**
     * Send form to endpoint
     */
    async sendForm() {
      const config = useRuntimeConfig()
      this.isSubmitting = true
      const body = `
        <b>SPARC Service Inquiry Submission:</b><br><br>
        <b>What services(s) are you interested in?</b><br>${this.form.serviceCategories}<br><br>
        <b>Additional Information:</b><br>${isEmpty(this.form.additionalInfo) ? 'N/A' : this.form.additionalInfo}<br><br>
        <b>What type of user are you?</b><br>${this.form.user.typeOfUser}<br><br>
        <b>Name:</b><br>${this.form.user.firstName} ${this.form.user.lastName}<br><br>
        <b>Email:</b><br>${this.form.user.email}<br><br>
        <b>I'd like updates about this submission:</b><br>${this.form.user.shouldFollowUp ? 'Yes' : 'No'}
      `
      let formData = new FormData();
      formData.append("type", "interest")
      formData.append("sendCopy", this.form.user.sendCopy)
      formData.append("title", `SPARC Service Request: ${this.form.user.firstName} ${this.form.user.lastName}`)
      formData.append("body", body)
      formData.append("email", this.form.user.email)
      formData.append("firstname", this.form.user.firstName)
      formData.append("lastname", this.form.user.lastName)
      formData.append("captcha_token", this.form.captchaToken)

      // Save form to sessionStorage
      saveForm(this.form)

      try {
        const response = await this.$axios.post(`${config.public.portal_api}/submit_data_inquiry`, formData)
        const data = response.data;
        const status = response.status;
        if (this.form.user.shouldSubscribe) {
          this.subscribeToNewsletter(this.form.user.email, this.form.user.firstName, this.form.user.lastName)
        }
        let message = ''
        switch (status) {
          case 201:
            message = `${data?.message}`
            ElMessage({
              showClose: true,
              message: message,
              type: 'success',
              duration: 5000
            })
            break
          case 207:
            message = `${data?.warning}${data?.details}`
            ElMessage({
              showClose: true,
              message: message,
              type: 'info',
              duration: 0
            })
            break
          case 400:
            message = `${data?.error}`
            ElMessage({
              showClose: true,
              message: `We encountered the following problem when attempting to submit your request: ${message}. If this problem persists, please visit <a href='https://${config.public.ROOT_URL}/contact-us?type=bug' target='_blank'>here</a> to file an issue`,
              type: 'error',
              duration: 0,
              dangerouslyUseHTMLString: true
            })
            break
          case 500:
            message = `${data?.error}${data?.details}`
            ElMessage({
              showClose: true,
              message: `We encountered the following problem when attempting to submit your request: ${message}. If this problem persists, please visit <a href='https://${config.public.ROOT_URL}/contact-us?type=bug' target='_blank'>here</a> to file an issue`,
              type: 'error',
              duration: 0,
              dangerouslyUseHTMLString: true
            })
            break
          default:
            ElMessage({
              showClose: true,
              message: `There was a problem when attempting to submit your request. If this problem persists, please visit <a href='https://${config.public.ROOT_URL}/contact-us?type=bug' target='_blank'>here</a> to file an issue`,
              type: 'error',
              duration: 0,
              dangerouslyUseHTMLString: true
            })
            break
        }
        this.$emit('submit', this.form.user.firstName)
      } catch (e) {
          ElMessage({
            showClose: true,
            message: `We encountered the following problem when attempting to submit your request: ${e} If this problem persists, please visit <a href='https://${config.public.ROOT_URL}/contact-us?type=bug' target='_blank'>here</a> to file an issue`,
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
:deep(.vertical-content) {
  .el-form-item__content {
    display: block;
    .el-radio {
      line-height: 25px;
      padding-left: 2rem;
    }
  }
}
:deep(.service-categories) {
  .el-form-item__content {
    .el-checkbox {
      padding-left: 2rem;
      margin: 0;
      line-height: 25px;
    }
  }
  .el-form-item__label {
    margin-bottom: .3rem;
  }
}
</style>
