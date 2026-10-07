<script setup>
import { computed } from 'vue'
import { successMessage, failMessage } from '@/utils/notification-messages'

// Shell commands to copy and run, one per line, in the copy boxes the Files
// tab shows its AWS commands in.
const props = defineProps({
  lines: { type: Array, default: () => [] },
  // While the command is being prepared: shown greyed out, not copyable.
  pending: { type: String, default: '' },
})

// Quoted paths keep their spaces: split only outside quotes.
const rows = computed(() => props.lines.map((line) => line.match(/(?:'[^']*'|\\'|[^\s'])+/g) || []))

function copyToClipboard() {
  navigator.clipboard.writeText(props.lines.join('\n')).then(
    () => successMessage('Copied to clipboard.'),
    () => failMessage("Couldn't copy the command. Select it and copy it instead.")
  )
}
</script>

<template>
  <div class="command-box p-4">
    <code v-if="pending" class="pending">{{ pending }}</code>
    <!-- Each word stays whole: browsers otherwise break after hyphens,
         splitting --path or a folder name across lines. -->
    <code v-else>
      <span v-for="(words, r) in rows" :key="r" class="line"><template
        v-for="(word, i) in words"
        :key="i"
      ><span class="word">{{ word }}</span>{{ i < words.length - 1 ? ' ' : '' }}</template></span>
    </code>
    <button class="copy-button" :disabled="Boolean(pending)" @click="copyToClipboard">
      <img src="../../static/images/copyIcon.png" alt="Copy" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.command-box {
  background-color: $background;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

code {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  line-height: 1.375rem;
  user-select: all;

  &.pending {
    color: $lightGrey;
    user-select: none;
  }
}

.line {
  display: block;

  & + .line {
    margin-top: 0.375rem;
  }
}

// A word stays on one line when it fits, and wraps inside only when it's
// longer than the line.
.word {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.copy-button {
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  img {
    width: 20px;
    height: 20px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
}
</style>
