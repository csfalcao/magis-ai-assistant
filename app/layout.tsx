import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ConvexClientProvider } from './ConvexClientProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MAGIS - Your Personal AI Assistant',
  description: 'Revolutionary personal AI assistant with RAG memory and proactive intelligence',
  keywords: ['AI', 'assistant', 'personal', 'RAG', 'voice', 'proactive'],
  authors: [{ name: 'MAGIS Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <div id="root">
            {children}
          </div>
          <Toaster position="top-right" />
        </ConvexClientProvider>
      </body>
    </html>
  );
}