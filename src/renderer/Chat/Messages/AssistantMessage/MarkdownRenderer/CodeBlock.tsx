import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTranslation } from '@/contexts/LocaleContext'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { CopyButton } from '@/ui/CopyButton'

interface CodeBlockProps {
  language: string
  children: React.ReactNode
}

// Markdown passes fenced-code contents as strings (or an array of them); pull the
// text out without risking an object's '[object Object]' stringification.
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node
  }

  if (typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join('')
  }

  return ''
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const { t } = useTranslation()
  const { copyStatus, copy } = useCopyToClipboard()
  const isDark = useColorScheme()

  // The highlighter appends a trailing newline that would otherwise be copied.
  const codeText = extractText(children).replace(/\n$/, '')

  return (
    <div className="w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between bg-neutral-200 px-3 py-1 dark:bg-neutral-700">
        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-300">
          {language}
        </span>
        <CopyButton
          showLabel
          copyStatus={copyStatus}
          onClick={() => void copy(codeText)}
          labels={{
            copy: t('chat.copy'),
            copied: t('chat.copied'),
            error: t('chat.copyFailed'),
          }}
        />
      </div>

      <SyntaxHighlighter
        PreTag="div"
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          background: 'transparent',
          borderRadius: 0,
        }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  )
}
