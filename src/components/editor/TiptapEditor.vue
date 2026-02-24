<script setup lang="ts">
import { watch, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu, FloatingMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import { ResizableImage } from './ResizableImage'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import { common, createLowlight } from 'lowlight'
import { supabase } from '@/plugins/supabase'
import { marked } from 'marked'

interface Props {
  modelValue?: Record<string, unknown> | null
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Type / for commands…',
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const lowlight = createLowlight(common)
const editor = ref<Editor | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

/* ─── Slash command state ─── */
const showSlashMenu = ref(false)
const slashMenuPos = ref({ top: 0, left: 0 })
const slashFilter = ref('')

const slashCommands = [
  { id: 'heading1', label: 'Heading 1', desc: 'Large section heading', icon: 'H1', category: 'Headings' },
  { id: 'heading2', label: 'Heading 2', desc: 'Medium section heading', icon: 'H2', category: 'Headings' },
  { id: 'heading3', label: 'Heading 3', desc: 'Small section heading', icon: 'H3', category: 'Headings' },
  { id: 'bulletList', label: 'Bullet List', desc: 'Unordered list', icon: '•', category: 'Lists' },
  { id: 'orderedList', label: 'Numbered List', desc: 'Ordered list', icon: '1.', category: 'Lists' },
  { id: 'codeBlock', label: 'Code Block', desc: 'Syntax highlighted code', icon: '⟨⟩', category: 'Blocks' },
  { id: 'blockquote', label: 'Quote', desc: 'Blockquote', icon: '❝', category: 'Blocks' },
  { id: 'image', label: 'Image', desc: 'Upload an image', icon: '🖼', category: 'Media' },
  { id: 'youtube', label: 'YouTube', desc: 'Embed a video', icon: '▶', category: 'Media' },
  { id: 'divider', label: 'Divider', desc: 'Horizontal rule', icon: '—', category: 'Blocks' },
  { id: 'link', label: 'Link', desc: 'Insert a link', icon: '🔗', category: 'Inline' },
]

const filteredCommands = computed(() => {
  if (!slashFilter.value) return slashCommands
  const q = slashFilter.value.toLowerCase()
  return slashCommands.filter(
    c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  )
})

const slashActiveIndex = ref(0)

/* ─── Markdown detection ─── */
function looksLikeMarkdown(text: string): boolean {
  const patterns = [
    /^#{1,6}\s+/m,                // Headings: # H1, ## H2, etc.
    /^\s*[-*+]\s+/m,              // Unordered lists: - item, * item
    /^\s*\d+\.\s+/m,             // Ordered lists: 1. item
    /\*\*[^*]+\*\*/,              // Bold: **text**
    /\*[^*]+\*/,                  // Italic: *text*
    /```[\s\S]*?```/,             // Code blocks: ```code```
    /`[^`]+`/,                    // Inline code: `code`
    /^\s*>/m,                     // Blockquotes: > text
    /\[.+?\]\(.+?\)/,           // Links: [text](url)
    /^---+$/m,                    // Horizontal rules: ---
    /^===+$/m,                    // Alt headings: ===
  ]
  // Must match at least 2 patterns to be considered markdown
  let matchCount = 0
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matchCount++
      if (matchCount >= 2) return true
    }
  }
  return false
}

/* ─── Editor setup ─── */
onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue || { type: 'doc', content: [{ type: 'paragraph' }] },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      ResizableImage.configure({
        HTMLAttributes: { class: 'editor-image' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: 'editor-code-block' },
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'editor-youtube' },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
      handlePaste: (_view, event) => {
        const clipboardText = event.clipboardData?.getData('text/plain') || ''
        const clipboardHtml = event.clipboardData?.getData('text/html') || ''

        // Only convert if there's no HTML already (i.e. plain text paste)
        // and the text looks like markdown
        if (!clipboardHtml && clipboardText && looksLikeMarkdown(clipboardText)) {
          event.preventDefault()
          const html = marked.parse(clipboardText, { async: false }) as string
          editor.value?.chain().focus().insertContent(html).run()
          return true
        }
        return false
      },
      handleKeyDown: (view, event) => {
        /* Open slash menu */
        if (event.key === '/') {
          const { from } = view.state.selection
          const textBefore = view.state.doc.textBetween(
            Math.max(0, from - 1), from, '\n'
          )
          if (textBefore === '' || textBefore === '\n') {
            setTimeout(() => {
              const coords = view.coordsAtPos(from)
              const editorEl = view.dom.closest('.notion-editor')
              const rect = editorEl?.getBoundingClientRect() || { top: 0, left: 0 }
              slashMenuPos.value = {
                top: coords.bottom - rect.top + 4,
                left: coords.left - rect.left,
              }
              slashFilter.value = ''
              slashActiveIndex.value = 0
              showSlashMenu.value = true
            }, 10)
          }
        }
        /* Close slash menu on Escape */
        if (showSlashMenu.value && event.key === 'Escape') {
          showSlashMenu.value = false
          return true
        }
        /* Navigate slash menu */
        if (showSlashMenu.value) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            slashActiveIndex.value = (slashActiveIndex.value + 1) % filteredCommands.value.length
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            slashActiveIndex.value = (slashActiveIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            const cmd = filteredCommands.value[slashActiveIndex.value]
            if (cmd) executeSlashCommand(cmd.id)
            return true
          }
          /* Filter: capture typed characters */
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            slashFilter.value += event.key
            slashActiveIndex.value = 0
          }
          if (event.key === 'Backspace') {
            if (slashFilter.value.length > 0) {
              slashFilter.value = slashFilter.value.slice(0, -1)
              slashActiveIndex.value = 0
            } else {
              showSlashMenu.value = false
            }
          }
        }
        return false
      },
    },
    onUpdate: ({ editor: ed }) => {
      emit('update:modelValue', ed.getJSON() as Record<string, unknown>)
      if (showSlashMenu.value) {
        showSlashMenu.value = false
      }
    },
  })
})

/* ─── Sync external model changes ─── */
watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const currentJSON = JSON.stringify(editor.value.getJSON())
  const newJSON = JSON.stringify(val)
  if (currentJSON !== newJSON && val) {
    editor.value.commands.setContent(val)
  }
})

/* ─── Slash command execution ─── */
function executeSlashCommand(command: string) {
  showSlashMenu.value = false
  if (!editor.value) return

  // Remove the "/" character that triggered the menu
  const { from } = editor.value.state.selection
  editor.value.chain().focus().deleteRange({ from: from - 1 - slashFilter.value.length, to: from }).run()

  switch (command) {
    case 'heading1':
      editor.value.chain().focus().toggleHeading({ level: 1 }).run()
      break
    case 'heading2':
      editor.value.chain().focus().toggleHeading({ level: 2 }).run()
      break
    case 'heading3':
      editor.value.chain().focus().toggleHeading({ level: 3 }).run()
      break
    case 'bulletList':
      editor.value.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.value.chain().focus().toggleOrderedList().run()
      break
    case 'codeBlock':
      editor.value.chain().focus().toggleCodeBlock().run()
      break
    case 'blockquote':
      editor.value.chain().focus().toggleBlockquote().run()
      break
    case 'image':
      fileInput.value?.click()
      break
    case 'youtube': {
      const url = window.prompt('YouTube URL:')
      if (url) {
        editor.value.chain().focus().setYoutubeVideo({ src: url }).run()
      }
      break
    }
    case 'divider':
      editor.value.chain().focus().setHorizontalRule().run()
      break
    case 'link': {
      const href = window.prompt('Link URL:')
      if (href) {
        editor.value.chain().focus().setLink({ href }).run()
      }
      break
    }
  }
}

/* ─── Floating menu block commands ─── */
function setBlockType(type: string) {
  if (!editor.value) return
  switch (type) {
    case 'heading1':
      editor.value.chain().focus().toggleHeading({ level: 1 }).run()
      break
    case 'heading2':
      editor.value.chain().focus().toggleHeading({ level: 2 }).run()
      break
    case 'heading3':
      editor.value.chain().focus().toggleHeading({ level: 3 }).run()
      break
    case 'bulletList':
      editor.value.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.value.chain().focus().toggleOrderedList().run()
      break
    case 'codeBlock':
      editor.value.chain().focus().toggleCodeBlock().run()
      break
    case 'blockquote':
      editor.value.chain().focus().toggleBlockquote().run()
      break
    case 'image':
      fileInput.value?.click()
      break
    case 'divider':
      editor.value.chain().focus().setHorizontalRule().run()
      break
  }
}

/* ─── Bubble menu inline commands ─── */
function toggleLink() {
  if (!editor.value) return
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('URL:')
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

/* ─── Image upload ─── */
async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !editor.value) return

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filename, file)

  if (error) {
    console.error('Upload failed:', error)
    alert(`Upload failed: ${error.message}`)
    return
  }

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(data.path)

  editor.value.chain().focus().setImage({ src: urlData.publicUrl }).run()
  target.value = ''
}

/* ─── Click outside to close slash menu ─── */
function onClickOutsideSlash(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.slash-menu')) {
    showSlashMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutsideSlash)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutsideSlash)
  editor.value?.destroy()
})
</script>

<template>
  <div class="notion-editor">
    <!-- Bubble Menu: floating formatting on text selection -->
    <BubbleMenu
      v-if="editor"
      :editor="(editor as any)"
      :options="{ placement: 'top', offset: 8, flip: true }"
      class="bubble-toolbar"
    >
      <button
        type="button"
        :class="{ active: editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('strike') }"
        @click="editor.chain().focus().toggleStrike().run()"
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('code') }"
        @click="editor.chain().focus().toggleCode().run()"
        title="Inline Code"
      >
        &lt;&gt;
      </button>
      <div class="bubble-divider" />
      <button
        type="button"
        :class="{ active: editor.isActive('link') }"
        @click="toggleLink"
        title="Link"
      >
        🔗
      </button>
    </BubbleMenu>

    <!-- Floating Menu: block type options on empty lines -->
    <FloatingMenu
      v-if="editor"
      :editor="(editor as any)"
      :options="{ placement: 'left-start', offset: { mainAxis: 8, crossAxis: -2 } }"
      class="floating-toolbar"
    >
      <button type="button" @click="setBlockType('heading1')" title="Heading 1">H1</button>
      <button type="button" @click="setBlockType('heading2')" title="Heading 2">H2</button>
      <button type="button" @click="setBlockType('heading3')" title="Heading 3">H3</button>
      <div class="floating-divider" />
      <button type="button" @click="setBlockType('bulletList')" title="Bullet List">•</button>
      <button type="button" @click="setBlockType('orderedList')" title="Numbered List">1.</button>
      <button type="button" @click="setBlockType('codeBlock')" title="Code Block">⟨⟩</button>
      <button type="button" @click="setBlockType('blockquote')" title="Blockquote">❝</button>
      <div class="floating-divider" />
      <button type="button" @click="setBlockType('image')" title="Image">🖼</button>
      <button type="button" @click="setBlockType('divider')" title="Divider">—</button>
    </FloatingMenu>

    <!-- Editor content area -->
    <EditorContent v-if="editor" :editor="(editor as any)" />

    <!-- Slash command menu (Notion-style) -->
    <Transition name="slash-fade">
      <div
        v-if="showSlashMenu"
        class="slash-menu"
        :style="{ top: `${slashMenuPos.top}px`, left: `${slashMenuPos.left}px` }"
      >
        <div class="slash-menu-header">
          <span class="slash-menu-label">Blocks</span>
          <span v-if="slashFilter" class="slash-menu-filter">/ {{ slashFilter }}</span>
        </div>
        <div v-if="filteredCommands.length === 0" class="slash-menu-empty">
          No results
        </div>
        <button
          v-for="(cmd, index) in filteredCommands"
          :key="cmd.id"
          class="slash-menu-item"
          :class="{ 'slash-menu-item--active': index === slashActiveIndex }"
          @click="executeSlashCommand(cmd.id)"
          @mouseenter="slashActiveIndex = index"
        >
          <span class="slash-menu-icon">{{ cmd.icon }}</span>
          <div class="slash-menu-text">
            <span class="slash-menu-item-label">{{ cmd.label }}</span>
            <span class="slash-menu-item-desc">{{ cmd.desc }}</span>
          </div>
        </button>
      </div>
    </Transition>

    <!-- Hidden file input for image upload -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden-input"
      @change="handleImageUpload"
    />
  </div>
</template>

<style scoped>
/*
 * Notion-style Editor Styles
 */
.notion-editor {
  position: relative;
  border: 1px solid var(--bp-border, #2a2a2a);
  background: var(--bp-deep, #0d0d0d);
}

/* ─── Editor Content ─── */
:deep(.notion-editor-content) {
  min-height: 300px;
  outline: none;
  padding: 16px 20px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--bp-white, #e8e8e8);
}

:deep(.notion-editor-content p) {
  margin: 4px 0;
}

:deep(.notion-editor-content h1) {
  font-size: 2em;
  font-weight: 700;
  margin: 24px 0 8px;
  letter-spacing: 0.02em;
  color: var(--bp-white, #e8e8e8);
}

:deep(.notion-editor-content h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 20px 0 6px;
  letter-spacing: 0.02em;
  color: var(--bp-white, #e8e8e8);
}

:deep(.notion-editor-content h3) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 16px 0 4px;
  letter-spacing: 0.02em;
  color: var(--bp-white, #e8e8e8);
}

:deep(.notion-editor-content ul),
:deep(.notion-editor-content ol) {
  padding-left: 24px;
  margin: 4px 0;
}

:deep(.notion-editor-content li) {
  margin: 2px 0;
}

:deep(.notion-editor-content blockquote) {
  border-left: 3px solid var(--bp-accent, #87ceeb);
  padding-left: 16px;
  margin: 8px 0;
  color: var(--bp-subtle, #a0a0a0);
  font-style: italic;
}

:deep(.notion-editor-content code) {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--bp-border, #2a2a2a);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.88em;
  color: var(--bp-accent, #87ceeb);
}

:deep(.notion-editor-content hr) {
  border: none;
  border-top: 1px solid var(--bp-border, #2a2a2a);
  margin: 16px 0;
}

:deep(.notion-editor-content .editor-image) {
  max-width: 100%;
  margin: 8px 0;
}

:deep(.notion-editor-content .editor-link) {
  color: var(--bp-accent, #87ceeb);
  text-decoration: underline;
  text-underline-offset: 3px;
}

:deep(.notion-editor-content .editor-code-block) {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--bp-border, #2a2a2a);
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  overflow-x: auto;
}

:deep(.notion-editor-content .editor-youtube) {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--bp-border, #2a2a2a);
  border-radius: 4px;
  margin: 8px 0;
}

/* Image resize handles */
:deep(.tiptap-resizable-node-view) {
  display: inline-block;
  position: relative;
}

:deep(.tiptap-resizable-node-view.is-resizing),
:deep(.tiptap-resizable-node-view:hover) {
  outline: 2px solid #87ceeb;
  outline-offset: 2px;
  border-radius: 4px;
}

:deep(.tiptap-resize-handle) {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #87ceeb;
  border: 2px solid #1a1a1a;
  border-radius: 50%;
  z-index: 10;
}

:deep(.ProseMirror-selectednode .editor-image) {
  outline: 2px solid #87ceeb;
  outline-offset: 2px;
}

/* Placeholder styling */
:deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--bp-muted, #555);
  pointer-events: none;
  height: 0;
}

/* ─── Bubble Menu (inline formatting on selection) ─── */
.bubble-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
}

.bubble-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #b0b0b0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.bubble-toolbar button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.bubble-toolbar button.active {
  background: rgba(135, 206, 235, 0.15);
  color: #87ceeb;
}

.bubble-divider {
  width: 1px;
  height: 20px;
  background: #333;
  margin: 0 2px;
}

/* ─── Floating Menu (block type selection on empty lines) ─── */
.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
}

.floating-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 12px;
  padding: 0 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
}

.floating-toolbar button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.floating-divider {
  width: 1px;
  height: 20px;
  background: #333;
  margin: 0 2px;
}

/* ─── Slash Command Menu ─── */
.slash-menu {
  position: absolute;
  z-index: 50;
  width: 280px;
  max-height: 360px;
  overflow-y: auto;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
  padding: 4px;
}

.slash-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 4px;
}

.slash-menu-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #666;
  font-weight: 600;
}

.slash-menu-filter {
  font-size: 11px;
  color: #87ceeb;
  font-family: monospace;
}

.slash-menu-empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: #555;
}

.slash-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;
}

.slash-menu-item:hover,
.slash-menu-item--active {
  background: rgba(255, 255, 255, 0.06);
}

.slash-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #333;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 14px;
  color: #87ceeb;
  flex-shrink: 0;
}

.slash-menu-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.slash-menu-item-label {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
}

.slash-menu-item-desc {
  font-size: 11px;
  color: #666;
}

/* ─── Slash menu transition ─── */
.slash-fade-enter-active,
.slash-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.slash-fade-enter-from,
.slash-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Hidden input ─── */
.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
}
</style>
