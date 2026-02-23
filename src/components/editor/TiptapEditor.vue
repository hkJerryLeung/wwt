<script setup lang="ts">
import { watch, ref, onMounted, onBeforeUnmount } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import { common, createLowlight } from 'lowlight'
import SlashCommandMenu from './SlashCommandMenu.vue'
import { supabase } from '@/plugins/supabase'

interface Props {
  modelValue?: Record<string, unknown> | null
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Type / for commands...',
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const lowlight = createLowlight(common)
const showSlashMenu = ref(false)
const slashMenuPos = ref({ top: 0, left: 0 })
const fileInput = ref<HTMLInputElement | null>(null)
const savedSelection = ref<{ from: number; to: number } | null>(null)
const editorMountRef = ref<HTMLElement | null>(null)
const editor = ref<InstanceType<typeof Editor> | null>(null)

const editorOptions = () => ({
  content: props.modelValue || {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  },
  extensions: [
    StarterKit.configure({
      codeBlock: false,
      link: false,
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full border border-bp-border',
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-bp-accent underline',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'bg-bp-deep border border-bp-border p-4 font-mono text-sm',
      },
    }),
    Youtube.configure({
      HTMLAttributes: {
        class: 'w-full aspect-video border border-bp-border',
      },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none min-h-[300px] outline-none px-4 py-3 prose-headings:font-blueprint prose-headings:tracking-wide prose-code:font-mono',
    },
    handleKeyDown(view, event) {
      if (event.key === '/') {
        const { from } = view.state.selection
        const textBefore = view.state.doc.textBetween(
          Math.max(0, from - 1),
          from,
          '\n'
        )
        if (textBefore === '' || textBefore === '\n') {
          setTimeout(() => {
            const coords = view.coordsAtPos(from)
            slashMenuPos.value = {
              top: coords.bottom + 4,
              left: coords.left,
            }
            showSlashMenu.value = true
          }, 10)
        }
      } else if (showSlashMenu.value && event.key === 'Escape') {
        showSlashMenu.value = false
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

onMounted(() => {
  if (!editorMountRef.value) return
  editor.value = new Editor({
    ...editorOptions(),
    element: editorMountRef.value,
  })
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const currentJSON = JSON.stringify(editor.value.getJSON())
  const newJSON = JSON.stringify(val)
  if (currentJSON !== newJSON && val) {
    editor.value.commands.setContent(val)
  }
})

function handleSlashCommand(command: string) {
  showSlashMenu.value = false
  if (!editor.value) return

  // Remove the "/" character
  const { from } = editor.value.state.selection
  editor.value.chain().focus().deleteRange({ from: from - 1, to: from }).run()

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
    return
  }

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(data.path)

  editor.value.chain().focus().setImage({ src: urlData.publicUrl }).run()
  target.value = ''
}

function handleInsertLink() {
  if (!editor.value) return
  const url = prompt('URL:')
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

function onToolbarMouseDown() {
  // #region agent log
  const ed = editor.value
  if (ed) {
    const { from, to } = ed.state.selection
    savedSelection.value = { from, to }
    fetch('http://127.0.0.1:7603/ingest/053d0f2b-5821-448e-80dc-96c0a0a284c1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a4c979'},body:JSON.stringify({sessionId:'a4c979',location:'TiptapEditor.vue:onToolbarMouseDown',message:'toolbar mousedown',data:{from,to,activeElement:document.activeElement?.tagName,hasFocus:ed.view?.dom===document.activeElement},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
}

function execCommand(command: string, attrs?: Record<string, unknown>) {
  const ed = editor.value
  if (!ed) return

  const level = (attrs?.level as 1 | 2 | 3) ?? 1
  const isBlockCommand = ['heading', 'bulletList', 'codeBlock', 'blockquote'].includes(command)
  // #region agent log
  fetch('http://127.0.0.1:7603/ingest/053d0f2b-5821-448e-80dc-96c0a0a284c1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a4c979'},body:JSON.stringify({sessionId:'a4c979',location:'TiptapEditor.vue:execCommand',message:'execCommand called',data:{command,isBlockCommand,level},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  const runBlockCommand = () => {
    const current = editor.value
    const sel = savedSelection.value
    // #region agent log
    fetch('http://127.0.0.1:7603/ingest/053d0f2b-5821-448e-80dc-96c0a0a284c1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a4c979'},body:JSON.stringify({sessionId:'a4c979',location:'TiptapEditor.vue:runBlockCommand',message:'runBlockCommand',data:{hasEditor:!!current,savedSelection:sel,command},timestamp:Date.now(),hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion
    if (!current) return
    let chain = current.chain().focus()
    if (sel) {
      chain = chain.setTextSelection(sel)
      savedSelection.value = null
    }
    let runResult: boolean | void
    switch (command) {
      case 'heading': runResult = chain.toggleHeading({ level }).run(); break
      case 'bulletList': runResult = chain.toggleBulletList().run(); break
      case 'codeBlock': runResult = chain.toggleCodeBlock().run(); break
      case 'blockquote': runResult = chain.toggleBlockquote().run(); break
      default: runResult = undefined; break
    }
    // #region agent log
    const doc = current.state.doc
    const firstType = doc.childCount ? doc.child(0).type.name : 'none'
    const viewInDoc = !!(current.view?.dom && document.body.contains(current.view.dom))
    const pos = sel?.from ?? 0
    const nodeAtSel = pos <= doc.content.size ? doc.resolve(pos).parent.type.name : 'outOfRange'
    fetch('http://127.0.0.1:7603/ingest/053d0f2b-5821-448e-80dc-96c0a0a284c1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a4c979'},body:JSON.stringify({sessionId:'a4c979',location:'TiptapEditor.vue:runBlockCommand:after',message:'after run',data:{command,runResult,firstNodeType:firstType,blockAtSelection:nodeAtSel,viewInDocument:viewInDoc},timestamp:Date.now(),hypothesisId:'F,G'})}).catch(()=>{});
    // #endregion
  }

  if (isBlockCommand) {
    ed.view?.dom?.focus()
    runBlockCommand()
  } else {
    switch (command) {
      case 'bold': ed.chain().focus().toggleBold().run(); break
      case 'italic': ed.chain().focus().toggleItalic().run(); break
      case 'strike': ed.chain().focus().toggleStrike().run(); break
      case 'code': ed.chain().focus().toggleCode().run(); break
      default: break
    }
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="relative border border-bp-border bg-bp-deep">
    <!-- Toolbar: prevent mousedown so editor keeps focus when clicking buttons -->
    <div v-if="editor" class="flex flex-wrap items-center gap-1 border-b border-bp-border px-2 py-1.5" @mousedown.prevent.stop="onToolbarMouseDown"
    >
      <button
        type="button"
        tabindex="-1"
        title="Bold"
        class="flex h-7 w-7 items-center justify-center border text-xs transition-colors"
        :class="editor.isActive('bold') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('bold')"
      >
        B
      </button>

      <button
        type="button"
        tabindex="-1"
        title="Italic"
        class="flex h-7 w-7 items-center justify-center border text-xs transition-colors"
        :class="editor.isActive('italic') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('italic')"
      >
        I
      </button>

      <button
        type="button"
        tabindex="-1"
        title="Strikethrough"
        class="flex h-7 w-7 items-center justify-center border text-xs transition-colors"
        :class="editor.isActive('strike') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('strike')"
      >
        S
      </button>

      <button
        type="button"
        tabindex="-1"
        title="Inline Code"
        class="flex h-7 w-7 items-center justify-center border text-xs transition-colors"
        :class="editor.isActive('code') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('code')"
      >
        &lt;&gt;
      </button>

      <div class="mx-1 h-4 w-px bg-bp-border" />

      <button
        type="button"
        tabindex="-1"
        title="Heading 1"
        class="flex h-7 items-center justify-center border px-1.5 text-xs transition-colors"
        :class="editor.isActive('heading', { level: 1 }) ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('heading', { level: 1 })"
      >
        H1
      </button>
      <button
        type="button"
        tabindex="-1"
        title="Heading 2"
        class="flex h-7 items-center justify-center border px-1.5 text-xs transition-colors"
        :class="editor.isActive('heading', { level: 2 }) ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('heading', { level: 2 })"
      >
        H2
      </button>
      <button
        type="button"
        tabindex="-1"
        title="Heading 3"
        class="flex h-7 items-center justify-center border px-1.5 text-xs transition-colors"
        :class="editor.isActive('heading', { level: 3 }) ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('heading', { level: 3 })"
      >
        H3
      </button>

      <div class="mx-1 h-4 w-px bg-bp-border" />

      <button
        type="button"
        tabindex="-1"
        title="Bullet List"
        class="flex h-7 w-7 items-center justify-center border text-xs transition-colors"
        :class="editor.isActive('bulletList') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('bulletList')"
      >
        •
      </button>

      <button
        type="button"
        tabindex="-1"
        title="Code Block"
        class="flex h-7 items-center justify-center border px-1.5 text-xs transition-colors"
        :class="editor.isActive('codeBlock') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('codeBlock')"
      >
        { }
      </button>

      <button
        type="button"
        tabindex="-1"
        title="Blockquote"
        class="flex h-7 w-7 items-center justify-center border text-xs transition-colors"
        :class="editor.isActive('blockquote') ? 'border-bp-accent bg-bp-accent/10 text-bp-accent' : 'border-transparent text-bp-muted hover:border-bp-border hover:text-bp-white'"
        @click.prevent="execCommand('blockquote')"
      >
        "
      </button>

      <div class="mx-1 h-4 w-px bg-bp-border" />

      <button
        type="button"
        tabindex="-1"
        title="Upload Image"
        class="flex h-7 items-center justify-center border border-transparent px-1.5 text-xs text-bp-muted transition-colors hover:border-bp-border hover:text-bp-white"
        @click.prevent="fileInput?.click()"
      >
        IMG
      </button>

      <button
        type="button"
        tabindex="-1"
        title="Insert Link"
        class="flex h-7 items-center justify-center border border-transparent px-1.5 text-xs text-bp-muted transition-colors hover:border-bp-border hover:text-bp-white"
        @click.prevent="handleInsertLink"
      >
        LINK
      </button>
    </div>

    <!-- Editor content: mount directly so view DOM stays in sync -->
    <div ref="editorMountRef" />

    <!-- Slash command menu -->
    <SlashCommandMenu
      v-if="showSlashMenu"
      :position="slashMenuPos"
      @select="handleSlashCommand"
      @close="showSlashMenu = false"
    />

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleImageUpload"
    />
  </div>
</template>
