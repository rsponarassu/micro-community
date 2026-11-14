import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import NotificationListener from '@/app/components/layout/NotificationListener'
import ToastProvider from '@/app/components/layout/ToastProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Micro Community',
    template: '%s | Micro Community',
  },
  description:
    'Small, focused communities for campus clubs, hostels, and interest groups. Post, comment, and connect in a safe, moderated space.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    siteName: 'Micro Community',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e11' },
  ],
  colorScheme: 'light dark',
}

/**
 * Applies the stored theme before first paint so the UI never flashes light
 * mode. Must stay inline + synchronous in <head>.
 */
const THEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={inter.variable}>
        {children}
        <NotificationListener />
        <ToastProvider />
      </body>
    </html>
  )
}
