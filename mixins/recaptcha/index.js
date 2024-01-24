export default {
  data() {
    return {
      hasError: false
    }
  },
  methods: {
    /**
     * Submit the form and validate
     */
    async onSubmit() {
      this.hasError = false
      await this.$refs.submitForm.validate(async valid => {
        if (!valid) {
          return
        }
        if (!this.hasError) {
          await this.sendForm()
        }
      })
    }
  }
}
