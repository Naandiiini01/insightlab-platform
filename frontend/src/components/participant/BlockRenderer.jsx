import IntroBlock from './blocks/IntroBlock'
import ContextBlock from './blocks/ContextBlock'
import TaskBlock from './blocks/TaskBlock'
import QuestionBlock from './blocks/QuestionBlock'
import ThankyouBlock from './blocks/ThankyouBlock'
import VariantBlock from './blocks/VariantBlock'

const RENDERERS = {
  intro:    IntroBlock,
  context:  ContextBlock,
  task:     TaskBlock,
  question: QuestionBlock,
  followup: QuestionBlock,
  thankyou: ThankyouBlock,
  variant:  VariantBlock,
}

export default function BlockRenderer({ block, onNext, session, previewMode }) {
  const Component = RENDERERS[block?.type]
  if (!Component) return null
  return <Component block={block} onNext={onNext} session={session} previewMode={previewMode} />
}
