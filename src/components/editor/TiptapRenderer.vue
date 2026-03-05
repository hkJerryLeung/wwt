<script setup lang="ts">
/**
 * TiptapRenderer — Read-only renderer for Tiptap JSON content.
 * Backward-compatible: if content is a plain string, renders it directly.
 */
import { computed } from 'vue'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const props = defineProps<{
  content?: string | Record<string, unknown> | null
  /** Fallback text when content is empty */
  fallback?: string
  /** HTML tag for the wrapper element */
  tag?: string
}>()

const lowlight = createLowlight(common)

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Link.configure({ openOnClick: true }),
  Image,
  Youtube,
  CodeBlockLowlight.configure({ lowlight }),
]

const renderedHtml = computed(() => {
  const c = props.content
  if (!c) return ''

  // Plain string — backward compatible
  if (typeof c === 'string') return c

  // Tiptap JSON
  try {
    return generateHTML(c as Parameters<typeof generateHTML>[0], extensions)
  } catch {
    return props.fallback ?? ''
  }
})

const isRichContent = computed(() => {
  return props.content && typeof props.content === 'object'
})
</script>

<template>
  <component
    v-if="renderedHtml"
    :is="tag || 'div'"
    :class="{ 'tiptap-rendered': isRichContent }"
    v-html="renderedHtml"
  />
  <component v-else-if="fallback" :is="tag || 'div'">
    {{ fallback }}
  </component>
</template>

<style scoped>
.tiptap-rendered :deep(p) {
  margin: 0.25em 0;
}
.tiptap-rendered :deep(h1),
.tiptap-rendered :deep(h2),
.tiptap-rendered :deep(h3) {
  margin: 0.5em 0 0.25em;
}
.tiptap-rendered :deep(ul),
.tiptap-rendered :deep(ol) {
  padding-left: 1.5em;
  margin: 0.25em 0;
}
.tiptap-rendered :deep(ul) {
  list-style-type: disc;
}
.tiptap-rendered :deep(ol) {
  list-style-type: decimal;
}
.tiptap-rendered :deep(blockquote) {
  border-left: 3px solid rgba(255,255,255,0.2);
  padding-left: 1em;
  margin: 0.5em 0;
  opacity: 0.8;
  font-style: italic;
}
.tiptap-rendered :deep(code) {
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.88em;
}
.tiptap-rendered :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.tiptap-rendered :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}
.tiptap-rendered :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin: 1em 0;
}
</style>
