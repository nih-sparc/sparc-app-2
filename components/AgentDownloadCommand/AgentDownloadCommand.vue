<script setup>
import { computed, ref, watch } from 'vue'
import useGetToken from '@/composables/useGetToken'
import CommandBox from './CommandBox.vue'
import {
  agentPublicCommand,
  agentSelectionCommand,
  awsAccess,
  awsCommands,
  createPublicSelection,
  selectionEndpoint,
  AGENT_DOCS_URL,
  AGENT_MIN_VERSION,
} from '@/utils/agentDownload'

// The Pennsieve agent command for a download too large for the browser.
// With paths, the selection is saved first (through download-service, as the
// visitor if signed in), so the command is short however many files were
// selected. If it can't be saved, the command names the version and paths
// itself.
//
// The agent needs an API key, which only Pennsieve workspace members can
// create; with awsUri (the latest version's S3 location) and awsItems, the
// AWS CLI is offered for everyone else.
const props = defineProps({
  datasetId: { type: [Number, String], required: true },
  version: { type: [Number, String], default: 0 },
  paths: { type: Array, default: () => [] },
  folderName: { type: String, default: '' },
  awsUri: { type: String, default: '' },
  // [{ path, isFolder }]
  awsItems: { type: Array, default: () => [] },
})

const runtimeConfig = useRuntimeConfig()

// saving → selection (a saved selection) or paths (the command names them).
const state = ref('paths')
const selectionId = ref('')
let latest = 0

watch(
  () => [props.datasetId, props.version, props.paths.join('\n')],
  async () => {
    const request = ++latest
    if (props.paths.length === 0) {
      state.value = 'paths'
      return
    }
    state.value = 'saving'
    try {
      const token = await useGetToken()
      const url = selectionEndpoint({
        api2Host: runtimeConfig.public.api2_host,
        publicHost: runtimeConfig.public.download_public_host,
        token,
      })
      if (!url) throw new Error('no way to save a selection here')
      const selection = await createPublicSelection({
        url,
        token,
        datasetId: props.datasetId,
        version: props.version,
        paths: props.paths,
      })
      if (request !== latest) return
      selectionId.value = selection.id
      state.value = 'selection'
    } catch (e) {
      if (request !== latest) return
      state.value = 'paths'
    }
  },
  { immediate: true }
)

const command = computed(() =>
  state.value === 'selection'
    ? agentSelectionCommand({ selectionId: selectionId.value, folderName: props.folderName })
    : agentPublicCommand(props)
)

const showAws = ref(false)
const aws = computed(() => awsCommands({ uri: props.awsUri, items: props.awsItems, folderName: props.folderName }))
const awsOpenData = computed(() => awsAccess(props.awsUri) === 'open-data')
</script>

<template>
  <div class="agent-download-command">
    <command-box :lines="[command]" :pending="state === 'saving' ? 'Preparing the command…' : ''" />
    <ol class="steps mt-16">
      <li>
        <a :href="runtimeConfig.public.PENNSIEVE_URL" target="_blank">Sign in to Pennsieve</a>
        with your SPARC Portal account, or create a free account.
      </li>
      <li>
        <a :href="AGENT_DOCS_URL" target="_blank">Install the Pennsieve agent</a>
        {{ AGENT_MIN_VERSION }} or later, and set it up with an API key from
        your Pennsieve workspace.
      </li>
      <li>
        Run the command in the folder to download into.
        <template v-if="state === 'selection'">It works for two days.</template>
      </li>
    </ol>

    <div v-if="aws.length" class="aws mt-16 pt-16">
      <a href="#" class="aws-toggle" @click.prevent="showAws = !showAws">
        Not in a Pennsieve workspace? Download with the AWS CLI instead
      </a>
      <template v-if="showAws">
        <command-box class="mt-8" :lines="aws" />
        <div class="mt-8">
          <template v-if="awsOpenData">
            The files are AWS Open Data: no AWS account required.
          </template>
          <template v-else>
            The files are in a Requester Pays bucket: your AWS account pays for the transfer.
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.agent-download-command {
  word-break: normal;

  .steps {
    margin-bottom: 0;
    padding-left: 1.25rem;

    li + li {
      margin-top: 0.5rem;
    }
  }

  a {
    text-decoration: underline;
  }

  .aws {
    border-top: 1px solid $lineColor1;
  }
}
</style>
