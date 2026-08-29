import { clsx } from 'clsx'
import 'katex/dist/katex.min.css'
import Markdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { CodeBlock } from './CodeBlock'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const markdownComponents: Components = {
  code({ className, children }) {
    const language = /language-(\w+)/.exec(className ?? '')?.[1]

    if (language) {
      return <CodeBlock language={language}>{children}</CodeBlock>
    }

    return <code className={className}>{children}</code>
  },
  pre({ children }) {
    return <pre className="w-full min-w-full">{children}</pre>
  },
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={clsx(
        'prose dark:prose-invert w-full max-w-full [font-size:inherit] select-text',
        // Tailwind Typography wraps inline code in decorative backticks; drop them.
        "prose-code:before:content-[''] prose-code:after:content-['']",
        'prose-pre:w-full prose-pre:bg-transparent prose-pre:p-0',
        'prose-hr:my-4',
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  )
}
