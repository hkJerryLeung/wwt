<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  position: { top: number; left: number }
}

defineProps<Props>()

const emit = defineEmits<{
  select: [command: string]
  close: []
}>()

const activeIndex = ref(0)

const commands = [
  { id: 'heading1', label: 'Heading 1', desc: 'Large heading', shortcut: 'H1' },
  { id: 'heading2', label: 'Heading 2', desc: 'Medium heading', shortcut: 'H2' },
  { id: 'heading3', label: 'Heading 3', desc: 'Small heading', shortcut: 'H3' },
  { id: 'bulletList', label: 'Bullet List', desc: 'Unordered list', shortcut: '•' },
  { id: 'orderedList', label: 'Numbered List', desc: 'Ordered list', shortcut: '1.' },
  { id: 'codeBlock', label: 'Code Block', desc: 'Syntax-highlighted code', shortcut: '{ }' },
  { id: 'blockquote', label: 'Quote', desc: 'Blockquote', shortcut: '"' },
  { id: 'image', label: 'Image', desc: 'Upload an image', shortcut: 'IMG' },
  { id: 'youtube', label: 'YouTube', desc: 'Embed a YouTube video', shortcut: 'YT' },
  { id: 'divider', label: 'Divider', desc: 'Horizontal rule', shortcut: '—' },
  { id: 'link', label: 'Link', desc: 'Insert a link', shortcut: '🔗' },
]

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % commands.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + commands.length) % commands.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const cmd = commands[activeIndex.value]
    if (cmd) emit('select', cmd.id)
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    class="fixed z-50 w-64 max-h-80 overflow-y-auto border border-bp-border bg-bp-deep shadow-lg"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
  >
    <div class="px-3 py-2 text-[10px] uppercase tracking-wider text-bp-muted">
      Blocks
    </div>
    <button
      v-for="(cmd, index) in commands"
      :key="cmd.id"
      class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
      :class="index === activeIndex ? 'bg-bp-surface text-bp-white' : 'text-bp-subtle hover:bg-bp-surface/50'"
      @click="emit('select', cmd.id)"
      @mouseenter="activeIndex = index"
    >
      <span class="flex h-7 w-7 items-center justify-center border border-bp-border bg-bp-primary font-mono text-[10px] text-bp-accent">
        {{ cmd.shortcut }}
      </span>
      <div>
        <span class="block text-sm">{{ cmd.label }}</span>
        <span class="block text-[10px] text-bp-muted">{{ cmd.desc }}</span>
      </div>
    </button>
  </div>
</template>
