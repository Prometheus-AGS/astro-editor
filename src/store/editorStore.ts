import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { info, error as logError } from '@tauri-apps/plugin-log'
import { queryClient } from '../lib/query-client'
import { saveRecoveryData, saveCrashReport } from '../lib/recovery'
import { toast } from '../lib/toast'
import { queryKeys } from '../lib/query-keys'
import { useProjectStore } from './projectStore'

export interface FileEntry {
  id: string
  path: string
  name: string
  extension: string
  isDraft: boolean
  collection: string
  last_modified?: number
  frontmatter?: Record<string, unknown>
}

export interface MarkdownContent {
  frontmatter: Record<string, unknown>
  content: string
  raw_frontmatter: string
  imports: string
}

interface EditorState {
  // File state
  currentFile: FileEntry | null

  // Content state
  editorContent: string // Content without frontmatter and imports
  frontmatter: Record<string, unknown> // Current frontmatter being edited
  rawFrontmatter: string // Original frontmatter string from disk
  imports: string // MDX imports (hidden from editor)

  // Status state
  isDirty: boolean // True if changes need to be saved
  recentlySavedFile: string | null // Track recently saved file to ignore file watcher
  autoSaveTimeoutId: number | null // Auto-save timeout ID

  // Actions
  openFile: (file: FileEntry) => Promise<void>
  closeCurrentFile: () => void
  saveFile: (showToast?: boolean) => Promise<void>
  setEditorContent: (content: string) => void
  updateFrontmatter: (frontmatter: Record<string, unknown>) => void
  updateFrontmatterField: (key: string, value: unknown) => void
  scheduleAutoSave: () => void
  updateCurrentFileAfterRename: (newPath: string) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentFile: null,
  editorContent: '',
  frontmatter: {},
  rawFrontmatter: '',
  imports: '',
  isDirty: false,
  recentlySavedFile: null,
  autoSaveTimeoutId: null,

  // Actions
  openFile: async (file: FileEntry) => {
    // Get project path using direct store access pattern (architecture guide: performance patterns)
    const { projectPath } = useProjectStore.getState()

    if (!projectPath) {
      throw new Error('No project path available')
    }

    try {
      const markdownContent = await invoke<MarkdownContent>(
        'parse_markdown_content',
        {
          filePath: file.path,
          projectRoot: projectPath,
        }
      )

      set({
        currentFile: file,
        editorContent: markdownContent.content,
        frontmatter: markdownContent.frontmatter,
        rawFrontmatter: markdownContent.raw_frontmatter,
        imports: markdownContent.imports,
        isDirty: false,
      })

      // Update the selected collection to match the opened file's collection
      // Use custom event to communicate with project store (Bridge Pattern)
      window.dispatchEvent(
        new CustomEvent('file-opened', {
          detail: { collectionName: file.collection },
        })
      )
    } catch (error) {
      toast.error('Failed to open file', {
        description: `Could not open ${file.name}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      })
      await logError(`Failed to open file ${file.path}: ${String(error)}`)

      // Save crash report for critical file parsing failures
      await saveCrashReport(error as Error, {
        currentFile: file.path,
        action: 'open_file',
      })
    }
  },

  closeCurrentFile: () => {
    // Clear auto-save timeout if it exists
    const { autoSaveTimeoutId } = get()
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId)
    }

    // Clear all file-related state
    set({
      currentFile: null,
      editorContent: '',
      frontmatter: {},
      rawFrontmatter: '',
      imports: '',
      isDirty: false,
      autoSaveTimeoutId: null,
    })
  },

  saveFile: async (showToast = true) => {
    const { currentFile, editorContent, frontmatter, imports } = get()
    if (!currentFile) return

    // Get project path using direct store access pattern (architecture guide: performance patterns)
    const { projectPath } = useProjectStore.getState()

    if (!projectPath) {
      throw new Error('No project path available')
    }

    try {
      // Get schema field order from collections data via custom event
      let schemaFieldOrder: string[] | null = null
      if (currentFile) {
        try {
          // Dispatch event to get schema field order for current collection
          const schemaEvent = new CustomEvent('get-schema-field-order', {
            detail: { collectionName: currentFile.collection },
          })

          // Set up a listener for the response
          let responseReceived = false
          const handleSchemaResponse = (event: Event) => {
            const customEvent = event as CustomEvent<{
              fieldOrder: string[] | null
            }>
            schemaFieldOrder = customEvent.detail.fieldOrder || null
            responseReceived = true
          }

          window.addEventListener(
            'schema-field-order-response',
            handleSchemaResponse
          )
          window.dispatchEvent(schemaEvent)

          // Wait a short time for the response (synchronous-style with events)
          await new Promise(resolve => {
            const checkResponse = () => {
              if (responseReceived) {
                resolve(null)
              } else {
                setTimeout(checkResponse, 10)
              }
            }
            checkResponse()
          })

          window.removeEventListener(
            'schema-field-order-response',
            handleSchemaResponse
          )
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Could not get schema field order:', error)
        }
      }

      // Track this file as recently saved to ignore file watcher events
      set({ recentlySavedFile: currentFile.path })

      await invoke('save_markdown_content', {
        filePath: currentFile.path,
        frontmatter,
        content: editorContent,
        imports,
        schemaFieldOrder,
        projectRoot: projectPath,
      })

      // Clear auto-save timeout since we just saved
      const { autoSaveTimeoutId } = get()
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId)
        set({ autoSaveTimeoutId: null })
      }

      set({ isDirty: false })

      // Invalidate queries to update UI with new frontmatter
      if (projectPath && currentFile.collection) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.collectionFiles(
            projectPath,
            currentFile.collection
          ),
        })
      }

      // Show success toast only if requested
      if (showToast) {
        toast.success('File saved successfully')
      }

      // Clear the recently saved file after a delay
      setTimeout(() => {
        set({ recentlySavedFile: null })
      }, 1000)
    } catch (error) {
      toast.error('Save failed', {
        description: `Could not save file: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Recovery data has been saved.`,
      })
      await logError(`Save failed: ${String(error)}`)
      await info('Attempting to save recovery data...')

      // Save recovery data
      const state = get()
      await saveRecoveryData({
        currentFile: state.currentFile,
        projectPath,
        editorContent: state.editorContent,
        frontmatter: state.frontmatter,
      })

      // Save crash report
      await saveCrashReport(error as Error, {
        currentFile: state.currentFile?.path,
        projectPath: projectPath || undefined,
        action: 'save',
      })

      // Keep the file marked as dirty since save failed, maintain user changes flag
      set({ isDirty: true, recentlySavedFile: null })
    }
  },

  setEditorContent: (content: string) => {
    set({ editorContent: content, isDirty: true })
    get().scheduleAutoSave()
  },

  updateFrontmatter: (frontmatter: Record<string, unknown>) => {
    set({ frontmatter, isDirty: true })
    get().scheduleAutoSave()
  },

  updateFrontmatterField: (key: string, value: unknown) => {
    const { frontmatter } = get()
    const newFrontmatter = { ...frontmatter }

    // Remove field if value is empty
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      delete newFrontmatter[key]
    } else {
      newFrontmatter[key] = value
    }

    set({
      frontmatter: newFrontmatter,
      isDirty: true,
    })
    get().scheduleAutoSave()
  },

  scheduleAutoSave: () => {
    const store = get()

    // Clear existing timeout
    if (store.autoSaveTimeoutId) {
      clearTimeout(store.autoSaveTimeoutId)
    }

    // Get auto-save delay from global settings (default to 2 seconds)
    const globalSettings = useProjectStore.getState().globalSettings
    const autoSaveDelay = globalSettings?.general?.autoSaveDelay || 2

    // Schedule new auto-save (without toast)
    const timeoutId = setTimeout(() => {
      void store.saveFile(false)
    }, autoSaveDelay * 1000) // Convert from seconds to milliseconds

    set({ autoSaveTimeoutId: timeoutId })
  },

  updateCurrentFileAfterRename: (newPath: string) => {
    const { currentFile } = get()
    if (currentFile) {
      set({
        currentFile: {
          ...currentFile,
          path: newPath,
          name: newPath
            .substring(newPath.lastIndexOf('/') + 1)
            .replace(/\.[^.]+$/, ''),
        },
      })
    }
  },
}))

// Components can use direct selectors like:
// const currentFile = useEditorStore(state => state.currentFile)
