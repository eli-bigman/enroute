"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUsernameValidation, useUserRegistration } from "@/hooks/use-user-registration"
import { useAccountBalance } from "@/hooks/use-enroute-contracts"
import { useAccount } from "wagmi"
import { formatEther } from "viem"

interface UsernameRegistrationProps {
  onRegister: (username: string) => void
  isRegistering: boolean
  error: string | null
  onSuccess?: (username: string) => void
}

export function UsernameRegistration({ onRegister, isRegistering, error, onSuccess }: UsernameRegistrationProps) {
  const [username, setUsername] = useState("")
  const [registeredUsername, setRegisteredUsername] = useState("")
  const validation = useUsernameValidation(username)
  const registration = useUserRegistration()
  const { address } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(address)

  // Check if user has sufficient balance for gas (rough estimate)
  const hasMinimumBalance = balance && balance.value > BigInt(100000000000000) // 0.0001 ETH minimum

  // Watch for successful registration
  useEffect(() => {
    // Check if registration was just confirmed and we have a pending username
    if (registration.isRegistered && registeredUsername && onSuccess) {
      onSuccess(registeredUsername)
      setRegisteredUsername("") // Reset after calling success
    }
  }, [registration.isRegistered, registeredUsername, onSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validation.isValid && !isRegistering && hasMinimumBalance) {
      setRegisteredUsername(username) // Store the username we're registering
      try {
        onRegister(username)
      } catch (err) {
        console.error('Registration failed:', err)
        setRegisteredUsername("") // Reset on error
      }
    }
  }

  const getErrorMessage = () => {
    if (error) {
      if (error.includes('User rejected')) {
        return "Transaction was cancelled. Please try again and approve the transaction in your wallet."
      }
      if (error.includes('insufficient funds')) {
        return "Insufficient ETH for gas fees. You need a small amount of ETH on Base Sepolia to register."
      }
      if (error.includes('already taken')) {
        return "This username is already taken. Please choose a different one."
      }
      if (error.includes('already registered')) {
        return "Your wallet is already registered. Please refresh the page."
      }
      if (error.includes('paused')) {
        return "Registration is temporarily paused. Please try again later."
      }
      if (error.includes('Invalid username')) {
        return "Username must be 3-20 characters, letters and numbers only."
      }
      return error
    }
    return null
  }

  const getInputClassName = () => {
    if (!username) return ""
    if (validation.isChecking) return "border-yellow-500"
    if (validation.error) return "border-red-500"
    if (validation.isValid) return "border-green-500"
    return ""
  }

  const getStatusIcon = () => {
    if (validation.isChecking) return (
      <svg className="h-4 w-4 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    )
    if (validation.error) return (
      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
    if (validation.isValid) return (
      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
    return null
  }

  const getBalanceStatus = () => {
    if (!balance) return null
    
    const balanceInEth = parseFloat(formatEther(balance.value || BigInt(0)))
    const hasMinimumBalance = balanceInEth >= 0.0001
    
    return (
      <div className="text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Current balance: {balanceInEth.toFixed(4)} ETH</span>
          {hasMinimumBalance ? (
            <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>
        {!hasMinimumBalance && (
          <div className="text-red-600 text-xs mt-1 space-y-1">
            <p>You need at least 0.0001 ETH for transaction fees.</p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="text-blue-300">
                💧 <strong>Get Base Sepolia ETH:</strong>{" "}
                <a 
                  href="https://www.alchemy.com/faucets/base-sepolia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-200"
                >
                  Visit Alchemy Faucet
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 flex items-center justify-center mx-auto">
          <img 
            src="/enroute-logo.svg" 
            alt="EnRoute" 
            className="w-full h-full"
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Choose Your Username</h2>
          <p className="text-gray-400 text-sm">
            This will create your unique ENS subname: <br />
            <span className="text-emerald-400 font-mono">
              {username ? `${username}.enrouteapp.eth` : "username.enrouteapp.eth"}
            </span>
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-center text-white">Create Your Identity</CardTitle>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">
              Your wallet will be prompted to sign a transaction to create your ENS identity.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                💡 <strong>Tip:</strong> Make sure to approve the transaction in your wallet when prompted. 
                This creates your unique <code>username.enrouteapp.eth</code> address on the blockchain.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 pr-10 ${getInputClassName()}`}
                  disabled={isRegistering}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getStatusIcon()}
                </div>
              </div>
              
              {/* Username Requirements */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Requirements:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>3-20 characters long</li>
                  <li>Letters, numbers, hyphens, and underscores only</li>
                  <li>Cannot start or end with a hyphen</li>
                </ul>
              </div>

              {/* Validation Message */}
              {username && (validation.error || validation.isValid) && (
                <Alert className={`${validation.error ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}`}>
                  <AlertDescription className={`text-sm ${validation.error ? 'text-red-400' : 'text-green-400'}`}>
                    {validation.error || "Username is available!"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Registration Error */}
              {getErrorMessage() && (
                <Alert className="border-red-500 bg-red-500/10">
                  <AlertDescription className="text-sm text-red-400">
                    {getErrorMessage()}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Balance Status */}
            {getBalanceStatus()}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!validation.isValid || isRegistering}
            >
              {isRegistering ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your ENS subname...
                </>
              ) : (
                "Create My ENS Identity"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>Your ENS subname will be permanently linked to your wallet</p>
        <p className="mt-1">Powered by Ethereum Name Service on Base</p>
      </div>
    </div>
  )
}
