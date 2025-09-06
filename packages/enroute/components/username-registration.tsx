"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Check, AlertCircle, User } from "lucide-react"
import { useUsernameValidation } from "@/hooks/use-user-registration"

interface UsernameRegistrationProps {
  onRegister: (username: string) => void
  isRegistering: boolean
  error: string | null
}

export function UsernameRegistration({ onRegister, isRegistering, error }: UsernameRegistrationProps) {
  const [username, setUsername] = useState("")
  const validation = useUsernameValidation(username)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validation.isValid && !isRegistering) {
      onRegister(username)
    }
  }

  const getInputClassName = () => {
    if (!username) return ""
    if (validation.isChecking) return "border-yellow-500"
    if (validation.error) return "border-red-500"
    if (validation.isValid) return "border-green-500"
    return ""
  }

  const getStatusIcon = () => {
    if (validation.isChecking) return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
    if (validation.error) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (validation.isValid) return <Check className="h-4 w-4 text-green-500" />
    return null
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
              {error && (
                <Alert className="border-red-500 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-sm text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!validation.isValid || isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
