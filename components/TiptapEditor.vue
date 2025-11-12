<template>
  <div class="tiptap-editor border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
      <!-- Bold -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-blue-600 text-white': editor.isActive('bold'), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('bold') }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Gras (Ctrl+B)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.146 3.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 2.793L10.5 7.586 12.414 9.5 14.707 7.207 12.793 5.293zM10 8l-8 8 1.5 1.5 8-8L10 8z" />
        </svg>
      </button>

      <!-- Italic -->
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-blue-600 text-white': editor.isActive('italic'), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('italic') }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Italique (Ctrl+I)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
      </button>

      <!-- Heading 2 -->
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-blue-600 text-white': editor.isActive('heading', { level: 2 }), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('heading', { level: 2 }) }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors font-semibold"
        title="Titre 2"
      >
        H2
      </button>

      <!-- Heading 3 -->
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-blue-600 text-white': editor.isActive('heading', { level: 3 }), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('heading', { level: 3 }) }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors font-semibold"
        title="Titre 3"
      >
        H3
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-500 my-auto"></div>

      <!-- Bullet List -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-blue-600 text-white': editor.isActive('bulletList'), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('bulletList') }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Liste à puces"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Ordered List -->
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-blue-600 text-white': editor.isActive('orderedList'), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('orderedList') }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Liste numérotée"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-500 my-auto"></div>

      <!-- Link -->
      <button
        type="button"
        @click="setLink"
        :class="{ 'bg-blue-600 text-white': editor.isActive('link'), 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200': !editor.isActive('link') }"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Ajouter un lien"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Unlink -->
      <button
        v-if="editor.isActive('link')"
        type="button"
        @click="editor.chain().focus().unsetLink().run()"
        class="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Retirer le lien"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 101.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L11.414 11l3.293-3.293z" clip-rule="evenodd" />
        </svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-500 my-auto"></div>

      <!-- Image -->
      <button
        type="button"
        @click="addImage"
        class="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
        title="Insérer une image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-500 my-auto"></div>

      <!-- Undo -->
      <button
        type="button"
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        class="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Annuler (Ctrl+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Redo -->
      <button
        type="button"
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        class="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Rétablir (Ctrl+Y)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Editor -->
    <editor-content :editor="editor" class="prose prose-sm max-w-none p-4 min-h-[200px] dark:prose-invert" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Écrivez votre message...'
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 hover:underline'
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg my-4'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'focus:outline-none'
    }
  }
})

// Sync external changes
watch(() => props.modelValue, (value) => {
  const isSame = editor.value.getHTML() === value
  if (!isSame) {
    editor.value.commands.setContent(value, false)
  }
})

// Set link
const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL du lien:', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Add image
const addImage = () => {
  const url = window.prompt('URL de l\'image:')

  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Styles Tiptap de base */
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap {
  outline: none;
}

/* Prose styles pour le contenu */
.prose h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.prose h3 {
  font-size: 1.25em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.prose p {
  margin-bottom: 0.75em;
}

.prose ul, .prose ol {
  padding-left: 1.5em;
  margin-bottom: 0.75em;
}

.prose li {
  margin-bottom: 0.25em;
}

.prose a {
  color: #2563eb;
  text-decoration: underline;
}

.prose strong {
  font-weight: 600;
}

.prose em {
  font-style: italic;
}
</style>

