'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RiArticleLine, RiPenNibLine, RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import AuthButton from '@/components/auth/AuthButton';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-[var(--color-border)] bg-[rgba(5,7,15,0.7)]">
      <div className="container-app flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <RiArticleLine className="text-[var(--color-neon-blue)]" size={20} />
          <span className="font-bold">
            <span className="text-[var(--color-neon-blue)]">dev</span>
            <span className="text-[var(--color-neon-cyan)]">blog</span>
            <span className="text-[var(--color-text-dim)]">.sh</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className="px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] rounded transition-colors">~/feed</Link>
          <Link href="/write" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-[var(--color-neon-blue)] text-[var(--color-neon-blue)] hover:bg-[rgba(77,140,255,0.08)] transition-colors">
            <RiPenNibLine size={13} /> write
          </Link>
          <a href="http://localhost:3000" className="ml-2 px-3 py-1.5 text-xs border border-[var(--color-border)] rounded hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)] text-[var(--color-text-muted)] transition-colors">↗ DevFolio</a>
          <AuthButton />
        </nav>
        <button className="md:hidden" onClick={() => setOpen(v => !v)}>
          {open ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
          <Link href="/" onClick={() => setOpen(false)} className="block px-6 py-3 text-sm text-[var(--color-text-muted)]">~/feed</Link>
          <Link href="/write" onClick={() => setOpen(false)} className="block px-6 py-3 text-sm text-[var(--color-neon-blue)]">+ write post</Link>
          <a href="http://localhost:3000" onClick={() => setOpen(false)} className="block px-6 py-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]">↩ DevFolio</a>
        </nav>
      )}
    </header>
  );
}
