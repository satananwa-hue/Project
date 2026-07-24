'use client';

import { useState } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export function CopyButtons({ code }: { code: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  function copy(text: string, kind: 'code' | 'link') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const signupLink = `${SITE_URL || window.location.origin}/signup?code=${code}`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => copy(code, 'code')}
        className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
      >
        {copied === 'code' ? '✓ Copied' : 'Copy code'}
      </button>
      <button
        onClick={() => copy(signupLink, 'link')}
        className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
      >
        {copied === 'link' ? '✓ Copied' : 'Copy link'}
      </button>
    </div>
  );
}
