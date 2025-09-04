"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Sparkles, Check } from "lucide-react"

interface ConnectScreenProps {
  onConnect: (ens: string) => void
}

export function ConnectScreen({ onConnect }: ConnectScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSubnamePrompt, setShowSubnamePrompt] = useState(false)
  const [subname, setSubname] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  // Simulate wallet connection
  const handleConnect = async () => {
    setIsConnecting(true)
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsConnecting(false)
    setShowSubnamePrompt(true)
  }

  // Handle subname confirmation
  const handleConfirmSubname = async () => {
    if (!subname.trim()) return

    setIsConfirming(true)
    // Simulate ENS registration
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onConnect(`${subname}.enroute.eth`)
  }

  if (showSubnamePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white text-balance">Choose Your EnRoute Subname</h1>
              <p className="text-gray-400 mt-2">Create your personalized ENS identity for programmable payments</p>
            </div>
          </div>

          {/* Subname Creation Form */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-center text-white">ENS Subname Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="subname" className="text-sm font-medium text-gray-300">
                  Enter your desired subname
                </label>
                <Input
                  id="subname"
                  placeholder="alice"
                  value={subname}
                  onChange={(e) => setSubname(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                  className="text-lg h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  maxLength={20}
                />
              </div>

              {/* Live Preview */}
              {subname && (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Preview:</p>
                  <div className="text-xl font-mono font-bold text-center">
                    <span className="text-emerald-500">{subname}</span>
                    <span className="text-gray-400">.enroute.eth</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConfirmSubname}
                disabled={!subname.trim() || isConfirming}
                className="w-full h-12 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-black"
                size="lg"
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Registering...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Confirm Subname & Continue
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-gray-300">Programmable payment routing</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-gray-300">Custom policy templates</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-gray-300">Community marketplace access</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-black">E</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white text-balance">EnRoute</h1>
            <p className="text-xl text-gray-400 text-balance">Route money where it should go</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto text-balance">
              Connect your wallet to start creating custom payment routing policies with ENS integration
            </p>
          </div>
        </div>

        {/* Connect Button */}
        <div className="space-y-6">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full h-16 text-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-black"
            size="lg"
          >
            <div className="flex items-center justify-center gap-3">
              {isConnecting ? (
                <>
                  <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-6 w-6" />
                  Connect Wallet
                </>
              )}
            </div>
          </Button>

          {/* Features Preview */}
          <div className="grid gap-4 text-sm">
            <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <div>
                <p className="font-medium text-white">Smart Payment Routing</p>
                <p className="text-gray-400 text-xs">Automatically split incoming payments</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <div>
                <p className="font-medium text-white">ENS Integration</p>
                <p className="text-gray-400 text-xs">Human-readable wallet addresses</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <div>
                <p className="font-medium text-white">Policy Templates</p>
                <p className="text-gray-400 text-xs">Community-driven payment rules</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Powered by Ethereum Name Service</p>
          <p className="mt-1">Web3 • Decentralized • Ghanaian Futurism</p>
        </div>
      </div>
    </div>
  )
}
