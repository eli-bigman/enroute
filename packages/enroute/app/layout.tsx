import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Web3Provider } from "@/components/providers/web3-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "EnRoute - ENS Payments",
  description: "Web3 dApp for programmable payments with ENS integration",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Web3Provider>
          <Suspense fallback={null}>{children}</Suspense>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
