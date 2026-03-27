export const BLOCK_TYPES = {
  intro:     { label: 'Intro Screen',         color: '#6272f5', icon: 'Sparkles'      },
  context:   { label: 'Context Screen',       color: '#10b981', icon: 'BookOpen'      },
  task:      { label: 'Task / Mission',        color: '#f59e0b', icon: 'Target'        },
  question:  { label: 'Question',             color: '#8b5cf6', icon: 'MessageSquare' },
  followup:  { label: 'Follow-up Question',   color: '#ec4899', icon: 'CornerDownRight'},
  thankyou:  { label: 'Thank-you Screen',     color: '#06b6d4', icon: 'Heart'         },
  variant:   { label: 'Variant Comparison',   color: '#f97316', icon: 'GitBranch'     },
}

export const QUESTION_TYPES = [
  { value: 'open_text',       label: 'Open Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'single_choice',   label: 'Single Choice' },
  { value: 'rating',          label: 'Rating Scale' },
  { value: 'opinion',         label: 'Opinion Scale' },
  { value: 'yes_no',          label: 'Yes / No' },
  { value: 'ranking',         label: 'Ranking' },
  { value: 'nps',             label: 'NPS Score' },
]

export const TASK_TYPES = [
  { value: 'website',   label: 'Website / URL' },
  { value: 'prototype', label: 'Prototype Link' },
  { value: 'app',       label: 'App Experience' },
  { value: 'freeform',  label: 'Freeform Task' },
]

export const DEVICE_TYPES = [
  { value: 'desktop',    label: 'Desktop' },
  { value: 'laptop',     label: 'Laptop' },
  { value: 'tablet',     label: 'Tablet' },
  { value: 'mobile',     label: 'Mobile' },
  { value: 'responsive', label: 'Fully Responsive' },
]

export function blockLabel(type) {
  return BLOCK_TYPES[type]?.label || type
}

export function blockColor(type) {
  return BLOCK_TYPES[type]?.color || '#9099b8'
}
