export function createMessageId() {
  return crypto.randomUUID()
}

// Model identifiers are the on-disk filenames. We only support .gguf files,
// so strip that extension for display while keeping the raw filename for
// selection and persistence.
export function formatModelName(model: string): string {
  return model.replace(/\.gguf$/i, '')
}

export * from './shortcut'
