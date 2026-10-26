import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VRCircle — VR Gaming Communities',
  description: 'Discover and create VR gaming communities. Find your squad.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-white antialiased">
        {children}
      </body>
    </html>
  )
}
