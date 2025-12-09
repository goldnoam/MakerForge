import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

const CodeBlock = ({ language, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden shadow-lg border border-slate-700">
      <div className="flex justify-between items-center bg-slate-800 px-4 py-2 text-xs text-slate-400 border-b border-slate-700">
        <span className="uppercase font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-maker-success" />
              <span className="text-maker-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0 }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-blue max-w-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <CodeBlock language={match[1]} children={children} {...props} />
            ) : (
              <code className={`${className} bg-slate-800 rounded px-1.5 py-0.5 text-orange-300 text-sm font-mono`} {...props}>
                {children}
              </code>
            );
          },
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-maker-accent mb-6 mt-8 border-b border-slate-700 pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-white mb-4 mt-8 flex items-center gap-2 before:content-['#'] before:text-maker-accent/50" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-medium text-slate-200 mb-3 mt-6" {...props} />,
          p: ({node, ...props}) => <p className="text-slate-300 mb-4 leading-relaxed" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2 marker:text-maker-accent" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-2 marker:text-maker-accent" {...props} />,
          li: ({node, ...props}) => <li className="ml-4" {...props} />,
          a: ({node, ...props}) => <a className="text-maker-accent hover:underline hover:text-maker-success transition-colors font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-maker-accent pl-4 italic text-slate-400 my-4 bg-slate-800/30 p-3 rounded-r-lg" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownView;