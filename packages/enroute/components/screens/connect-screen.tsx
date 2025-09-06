"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { ConnectKitButton } from "connectkit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, LogOut, Network } from "lucide-react"
import { UsernameRegistration } from "@/components/username-registration"
import { useUserRegistration } from "@/hooks/use-user-registration"

interface ConnectScreenProps {
  onConnect: (username: string) => void
  isConnected: boolean
  address: `0x${string}` | undefined
}

export function ConnectScreen({ onConnect, isConnected, address }: ConnectScreenProps) {
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // Use our registration hook
  const registration = useUserRegistration()

  // Handle user status changes - only auto-navigate for newly registered users
  // Remove auto-navigation for existing users so they can see their status and choose to proceed

  // Helper function to get network name
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 11155111:
        return "Sepolia Testnet"
      case 84532:
        return "Base Sepolia"
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

  // Check if we need to switch to Base Sepolia
  const needsNetworkSwitch = isConnected && chainId !== 84532

  // If connected and on correct network, handle registration flow
  if (isConnected && address) {
    // Show loading while checking registration status
    if (registration.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white text-balance">Loading...</h1>
                <p className="text-xl text-gray-400 text-balance">Checking your registration status</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // If user is not registered, show registration form
    if (!registration.isRegistered) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <UsernameRegistration
            onRegister={registration.register}
            isRegistering={registration.isRegistering}
            error={registration.error}
          />
        </div>
      )
    }

    // If user is registered, show their profile with navigation options
    if (registration.isRegistered && registration.username) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <div className="w-full max-w-md space-y-8">
            {/* User Profile Header */}
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold text-black">{registration.username.charAt(0).toUpperCase()}</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white text-balance">Welcome back!</h1>
                <p className="text-xl text-emerald-400 text-balance">{registration.username}.enrouteapp.eth</p>
                <p className="text-sm text-gray-400 text-balance">Connected to {getNetworkName(chainId)}</p>
              </div>
            </div>

            {/* User Info Card */}
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-center text-white">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">ENS Name:</span>
                    <span className="text-emerald-400 font-semibold">{registration.username}.enrouteapp.eth</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Wallet:</span>
                    <span className="text-white font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">{getNetworkName(chainId)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={() => onConnect(registration.username!)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Continue to Dashboard
                  </Button>
                  
                  {needsNetworkSwitch && (
                    <Button
                      onClick={() => switchChain({ chainId: 84532 })}
                      variant="outline"
                      className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
                    >
                      Switch to Base Sepolia
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => disconnect()}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                  >
                    🚪 Disconnect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  }

  // Default connect screen
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
                        <span className="text-xl">✓</span>
                        Connected
                      </>
                    ) : (
                      <>
                        💼 Connect Wallet
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
          <p>Powered by Ethereum Name Service on Base</p>
          <p className="mt-1">Web3 • Decentralized • Ghanaian Futurism</p>
        </div>
      </div>
    </div>
  )
}
