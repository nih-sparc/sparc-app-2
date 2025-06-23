<template>
  <div v-if="modelValue">
    <el-form-item prop="user.firstName" label="First Name">
      <el-input v-model="modelValue.firstName" placeholder="Enter your first name" />
    </el-form-item>

    <el-form-item prop="user.lastName" label="Last Name">
      <el-input v-model="modelValue.lastName" placeholder="Enter your last name" />
    </el-form-item>

    <el-form-item prop="user.email" label="Email" class="mb-0">
      <el-input v-model="modelValue.email" placeholder="Enter your email address" type="email" />
    </el-form-item>

    <el-form-item v-if="showFollowUpOption" prop="user.shouldFollowUp" class="mt-16 mb-0">
      <el-checkbox v-model="modelValue.shouldFollowUp" :disabled="!isValidEmail(modelValue.email)">
        <span class="body1">Let me know when you resolve this issue</span>
      </el-checkbox>
    </el-form-item>

    <el-form-item prop="user.sendCopy" :class="['mb-0', { 'mt-16': !showFollowUpOption }]">
      <el-checkbox v-model="modelValue.sendCopy" :disabled="!isValidEmail(modelValue.email)">
        <span class="body1">Please send me a copy of this message</span>
      </el-checkbox>
    </el-form-item>

    <el-form-item prop="user.shouldSubscribe">
      <el-checkbox v-model="modelValue.shouldSubscribe" :disabled="!isValidEmail(modelValue.email)">
        <span class="body1">Subscribe to the SPARC Newsletter</span>
      </el-checkbox>
    </el-form-item>
  </div>
</template>

<script>
import ParseInputMixin from '@/mixins/parse-input/index'

export default {
  name: 'UserContactFormItem',
  mixins: [ParseInputMixin],
  props: {
    showFollowUpOption: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Object
    }
  },
}
</script>
