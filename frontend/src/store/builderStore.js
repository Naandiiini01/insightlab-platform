import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuidv4 } from 'uuid'
import api from '../utils/api'

const DEFAULT_BLOCK_CONTENT = {
  intro: {
    title: 'Welcome to our study',
    description: 'Thank you for participating. This should take about 10 minutes.',
    researcherNote: '',
    mediaUrl: null,
    continueLabel: 'Get started',
  },
  context: {
    scenarioText: '',
    mediaUrl: null,
    deviceInstructions: '',
    continueLabel: 'Continue',
  },
  task: {
    taskTitle: '',
    instructions: '',
    taskType: 'website', // website | prototype | app | freeform
    mediaUrl: null,
    embedUrl: '',
    successCriteria: '',
    timeLimit: null,
    followUpQuestions: [],
  },
  question: {
    questionText: '',
    questionType: 'open_text', // open_text | multiple_choice | single_choice | rating | opinion | yes_no | ranking | nps
    options: [],
    required: true,
    scale: { min: 1, max: 5, minLabel: 'Poor', maxLabel: 'Excellent' },
  },
  followup: {
    questionText: '',
    questionType: 'open_text',
    options: [],
    required: false,
    linkedTaskId: null,
    conditionalLogic: null,
  },
  thankyou: {
    title: 'Thank you!',
    message: 'Your responses have been recorded. We appreciate your time.',
    nextSteps: '',
    redirectUrl: '',
    redirectLabel: '',
  },
  variant: {
    variantName: 'Variant A',
    description: '',
    variants: [
      { id: uuidv4(), name: 'Variant A', embedUrl: '', description: '' },
      { id: uuidv4(), name: 'Variant B', embedUrl: '', description: '' },
    ],
    assignmentMethod: 'random', // random | manual | weighted
    distribution: null,
  },
}

export const useBuilderStore = create(
  immer((set, get) => ({
    study: null,
    blocks: [],
    selectedBlockId: null,
    previewMode: false,
    saving: false,
    dirty: false,

    // Load study into builder
    loadStudy: (study, blocks) => {
      set((s) => {
        s.study = study
        s.blocks = blocks
        s.selectedBlockId = null
        s.dirty = false
      })
    },

    updateStudyMeta: (fields) => {
      set((s) => {
        Object.assign(s.study, fields)
        s.dirty = true
      })
    },

    // Block operations
    addBlock: (type, index = null) => {
      const newBlock = {
        id: uuidv4(),
        type,
        order: 0,
        content: JSON.parse(JSON.stringify(DEFAULT_BLOCK_CONTENT[type] || {})),
        mediaAssets: [],
        settings: {},
        variantReference: null,
      }
      set((s) => {
        const pos = index !== null ? index + 1 : s.blocks.length
        s.blocks.splice(pos, 0, newBlock)
        s.blocks.forEach((b, i) => { b.order = i })
        s.selectedBlockId = newBlock.id
        s.dirty = true
      })
    },

    removeBlock: (id) => {
      set((s) => {
        s.blocks = s.blocks.filter((b) => b.id !== id)
        s.blocks.forEach((b, i) => { b.order = i })
        if (s.selectedBlockId === id) s.selectedBlockId = null
        s.dirty = true
      })
    },

    duplicateBlock: (id) => {
      set((s) => {
        const idx = s.blocks.findIndex((b) => b.id === id)
        if (idx === -1) return
        const original = s.blocks[idx]
        const copy = JSON.parse(JSON.stringify(original))
        copy.id = uuidv4()
        s.blocks.splice(idx + 1, 0, copy)
        s.blocks.forEach((b, i) => { b.order = i })
        s.selectedBlockId = copy.id
        s.dirty = true
      })
    },

    reorderBlocks: (blocks) => {
      set((s) => {
        s.blocks = blocks.map((b, i) => ({ ...b, order: i }))
        s.dirty = true
      })
    },

    updateBlock: (id, content) => {
      set((s) => {
        const block = s.blocks.find((b) => b.id === id)
        if (block) {
          Object.assign(block.content, content)
          s.dirty = true
        }
      })
    },

    selectBlock: (id) => {
      set((s) => { s.selectedBlockId = id })
    },

    setPreviewMode: (val) => {
      set((s) => { s.previewMode = val })
    },

    // Persistence
    saveStudy: async () => {
      const { study, blocks } = get()
      set((s) => { s.saving = true })
      try {
        await api.put(`/studies/${study.id}`, {
          ...study,
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
        })
        set((s) => { s.dirty = false })
      } finally {
        set((s) => { s.saving = false })
      }
    },

    publishStudy: async () => {
      const { study } = get()
      const res = await api.post(`/studies/${study.id}/publish`)
      set((s) => { s.study.status = res.data.status; s.study.participantToken = res.data.participantToken })
      return res.data
    },

    unpublishStudy: async () => {
      const { study } = get()
      await api.post(`/studies/${study.id}/unpublish`)
      set((s) => { s.study.status = 'draft' })
    },
  }))
)
