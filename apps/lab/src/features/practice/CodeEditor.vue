<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorState, Transaction } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'

type Language = 'html' | 'css' | 'javascript'
const props = defineProps<{ modelValue: string; language: Language; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const host = ref<HTMLDivElement | null>(null)
const states = new Map<Language, EditorState>()
let editor: EditorView | null = null
let activeLanguage: Language = props.language

function createState(): EditorState {
  const language = { html, css, javascript }[props.language]
  return EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      language(),
      keymap.of([indentWithTab]),
      EditorView.contentAttributes.of({
        role: 'textbox',
        'aria-label': props.label,
        'aria-multiline': 'true',
        spellcheck: 'false',
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
      }),
      EditorView.theme({
        '&': { height: '100%', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'Consolas, monospace', fontSize: '14px' },
        '.cm-content': { padding: '12px 0', minHeight: '240px' },
        '.cm-gutters': {
          color: 'var(--color-text-muted)',
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        },
        '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--color-brand-soft)' },
        '.cm-cursor': { borderLeftColor: 'var(--color-text)' },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
          backgroundColor: 'var(--color-brand-soft)',
        },
        '.cm-tooltip': {
          color: 'var(--color-text)',
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        },
        '&.cm-focused': { outline: '2px solid var(--color-brand)', outlineOffset: '-2px' },
      }),
    ],
  })
}

onMounted(() => {
  if (host.value) editor = new EditorView({ state: createState(), parent: host.value })
})

watch(
  () => [props.language, props.modelValue],
  () => {
    if (!editor) return
    if (activeLanguage !== props.language) {
      states.set(activeLanguage, editor.state)
      activeLanguage = props.language
      editor.setState(states.get(activeLanguage) ?? createState())
    }
    if (editor.state.doc.toString() !== props.modelValue) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: props.modelValue },
        annotations: Transaction.addToHistory.of(false),
      })
    }
  },
)

onBeforeUnmount(() => {
  editor?.destroy()
  states.clear()
})
</script>

<template>
  <div ref="host" class="practice-code-editor" />
</template>
