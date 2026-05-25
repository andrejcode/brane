import path from 'node:path'
import { getLlama, LlamaChatSession } from 'node-llama-cpp'

async function runLlamaDemo() {
  const llama = await getLlama()
  const model = await llama.loadModel({
    modelPath: path.join(process.cwd(), 'models', 'Qwen3-0.6B-Q8_0.gguf'),
  })
  const context = await model.createContext()
  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
  })

  const q1 = 'Hi there, how are you?'
  console.log('User: ' + q1)

  const a1 = await session.prompt(q1)
  console.log('AI: ' + a1)

  const q2 = 'Summarize what you said'
  console.log('User: ' + q2)

  const a2 = await session.prompt(q2)
  console.log('AI: ' + a2)
}

void runLlamaDemo().catch((error: unknown) => {
  console.error('Failed to run llama demo:', error)
})
