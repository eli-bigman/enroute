"use client"

import { useState, useEffect } from "react"
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { ConnectKitButton } from "connectkit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Sparkles, Check, LogOut, Network } from "lucide-react"

interface ConnectScreenProps {
  onConnect: (username: string) => void
  isConnected: boolean
  address: `0x${string}` | undefined
}

export function ConnectScreen({ onConnect, isConnected, address }: ConnectScreenProps) {
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)
  const [username, setUsername] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Helper function to get network name
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 11155111:
        return "Sepolia Testnet"
      case 137:
        return "Polygon Mainnet"
      case 80001:
        return "Mumbai Testnet"
      case 56:
        return "BSC Mainnet"
      case 97:
        return "BSC Testnet"
      default:
        return `Chain ${chainId}`
    }
  }

  // When wallet connects, show username prompt only if user hasn't set one yet
  useEffect(() => {
    if (isConnected && address && !showUsernamePrompt && !username) {
      setShowUsernamePrompt(true)
    } else if (!isConnected) {
      setShowUsernamePrompt(false)
      setUsername("")
    }
  }, [isConnected, address, showUsernamePrompt, username])

  // Handle username confirmation
  const handleConfirmUsername = async () => {
    if (!username.trim()) return

    setIsConfirming(true)
    // Simulate username processing
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onConnect(username)
    setIsConfirming(false)
  }

  // If wallet is connected but user already has username, show connected state
  if (isConnected && address && !showUsernamePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-3xl font-bold text-black">E</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-white text-balance">EnRoute</h1>
              <p className="text-xl text-gray-400 text-balance">Wallet Connected</p>
            </div>
          </div>

          {/* Connected Wallet Info */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <Wallet className="h-5 w-5" />
                Connected Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Wallet Address */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Wallet Address:</p>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm font-mono text-emerald-500 break-all flex-1 mr-3">{address}</p>
                  <Button
                    onClick={() => disconnect()}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-red-600 border-red-600 hover:bg-red-700 text-white flex-shrink-0"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {/* Network Info */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Network:</p>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-white">{getNetworkName(chainId)}</span>
                  </div>
                  <div className="flex gap-2">
                    <ConnectKitButton.Custom>
                      {({ show }) => (
                        <Button
                          onClick={show}
                          variant="outline"
                          size="sm"
                          className="text-xs bg-blue-600 border-blue-600 hover:bg-blue-700 text-white"
                        >
                          Switch
                        </Button>
                      )}
                    </ConnectKitButton.Custom>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>Powered by Ethereum Name Service</p>
            <p className="mt-1">Web3 • Decentralized • Ghanaian Futurism</p>
          </div>
        </div>
      </div>
    )
  }

  if (showUsernamePrompt && isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white text-balance">Choose Your Username</h1>
              <p className="text-gray-400 mt-2">Create your personalized identity for EnRoute</p>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">Connected Wallet:</p>
              <p className="text-sm font-mono text-emerald-500 break-all">{address}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Network:</p>
                <p className="text-sm text-white">{getNetworkName(chainId)}</p>
              </div>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <Button
                    onClick={show}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    Switch
                  </Button>
                )}
              </ConnectKitButton.Custom>
            </div>
          </div>

          {/* Username Creation Form */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-center text-white">Username Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">
                  Enter your desired username
                </label>
                <Input
                  id="username"
                  placeholder="alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                  className="text-lg h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  maxLength={20}
                />
              </div>

              {/* Live Preview */}
              {username && (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Preview:</p>
                  <div className="text-xl font-mono font-bold text-center">
                    <span className="text-emerald-500">{username}</span>
                    <span className="text-gray-400">.enroute.eth</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConfirmUsername}
                disabled={!username.trim() || isConfirming}
                className="w-full h-12 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-black"
                size="lg"
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating Profile...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Confirm Username & Continue
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
          <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show }) => {
              return (
                <Button
                  onClick={show}
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
                    ) : isConnected ? (
                      <>
                        <Check className="h-6 w-6" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Wallet className="h-6 w-6" />
                        Connect Wallet
                      </>
                    )}
                  </div>
                </Button>
              )
            }}
          </ConnectKitButton.Custom>

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
