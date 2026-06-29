'use client';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

const Monaco = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-background p-3 space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  ),
});

interface Props {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string | number;
}

export default function MonacoEditor({ value, onChange, language = 'json', readOnly = false, height = '100%' }: Props) {
  const { resolvedTheme } = useTheme();
  return (
    <Monaco
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange && onChange(v ?? '')}
      theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        lineNumbers: 'on',
        folding: true,
        formatOnPaste: true,
        formatOnType: true,
        wordWrap: 'on',
        tabSize: 2,
        renderLineHighlight: 'all',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        padding: { top: 8, bottom: 8 },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
