import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'DevBlog — Write in terminal.',
  description: 'Terminal-aesthetic developer blogging platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <main style={{ paddingTop: '64px', minHeight: '100vh' }}>{children}</main>
        <footer className="border-t border-[var(--color-border)] mt-20 py-8">
          <div className="container-app flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span><span className="text-[var(--color-neon-green)]">$</span> devblog — part of deveco ecosystem</span>
            <a href="/" className="text-[var(--color-neon-cyan)] hover:underline">↗ DevBlog</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
