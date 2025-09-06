"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, CheckCircle, ArrowRight, Search, AlertCircle, Loader2, Wallet, Target } from "lucide-react"
import { useUserPoliciesDetailed } from "@/hooks/use-enroute-contracts"
import { useToast } from "@/hooks/use-toast"

interface SendScreenProps {
  userENS: string | null
}

export function SendScreen({ userENS }: SendScreenProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  
  // Real data hooks
  const { policies, isLoading: policiesLoading } = useUserPoliciesDetailed(address)
  
  // Form state
  const [selectedENS, setSelectedENS] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState("ETH")
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedPolicy, setResolvedPolicy] = useState<any>(null)
  const [resolutionError, setResolutionError] = useState("")
  const [isSending, setIsSending] = useState(false)

  const tokens = [
    { symbol: "ETH", name: "Ethereum", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", decimals: 6 },
    { symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  ]

  // ENS resolution simulation (in real app, this would call ENS resolver)
  const resolveENS = async (ensName: string) => {
    setIsResolving(true)
    setResolutionError("")
    setResolvedPolicy(null)

    try {
      // Simulate ENS resolution delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if the ENS name matches any of our policies
      if (!policies) {
        throw new Error("No policies available")
      }

      // Extract the subname from the full ENS (e.g., "savings" from "savings.username.enrouteapp.eth")
      const parts = ensName.split('.')
      if (parts.length < 3) {
        throw new Error("Invalid ENS format. Expected format: subdomain.username.enrouteapp.eth")
      }
      
      const subname = parts[0]
      const username = parts[1]
      const domain = parts.slice(2).join('.')
      
      // Check if it matches our domain structure
      if (domain !== "enrouteapp.eth") {
        throw new Error("ENS name must end with .enrouteapp.eth")
      }
      
      // Find matching policy
      const matchingPolicy = policies.find(policy => 
        policy.name.toLowerCase() === subname.toLowerCase() && 
        policy.active
      )
      
      if (!matchingPolicy) {
        throw new Error(`No active policy found for ${subname}. Available policies: ${policies.map(p => p.name).join(', ')}`)
      }

      // Mock policy details (in real app, this would come from contract)
      const mockPolicyDetails = {
        ...matchingPolicy,
        fullENS: ensName,
        recipients: [
          { 
            address: "0x38269215091e4fFf0DE6E0bd4DDF7e82d11f8957", 
            percentage: 50, 
            label: "Main Account" 
          },
          { 
            address: "0x101Fd5E95a397A43E7C102Cf4E0870B1174dAAf9", 
            percentage: 50, 
            label: "Savings Account" 
          }
        ],
        acceptedTokens: ["ETH", "USDC", "USDT", "DAI"],
        minAmount: "0.001"
      }

      setResolvedPolicy(mockPolicyDetails)
      
    } catch (error) {
      setResolutionError(error instanceof Error ? error.message : "Failed to resolve ENS name")
    } finally {
      setIsResolving(false)
    }
  }

  // Auto-resolve when ENS input changes
  useEffect(() => {
    if (selectedENS && selectedENS.includes('.')) {
      const timeoutId = setTimeout(() => {
        resolveENS(selectedENS)
      }, 500) // Debounce
      
      return () => clearTimeout(timeoutId)
    } else {
      setResolvedPolicy(null)
      setResolutionError("")
    }
  }, [selectedENS, policies])

  const handleSend = async () => {
    if (!resolvedPolicy || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter a valid ENS name and amount",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Payment Sent Successfully!",
        description: `${amount} ${selectedToken} sent to ${resolvedPolicy.fullENS}`,
      })
      
      // Reset form
      setAmount("")
      setSelectedENS("")
      setResolvedPolicy(null)
      
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const isValidAmount = amount && parseFloat(amount) > 0
  const canSend = resolvedPolicy && isValidAmount && !isSending

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Send className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Send Payment</h1>
            <p className="text-gray-400">Send crypto to any ENS policy instantly</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <div className="space-y-6">
          {/* ENS Input */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5 text-blue-500" />
                Recipient ENS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="savings.username.enrouteapp.eth"
                    value={selectedENS}
                    onChange={(e) => setSelectedENS(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-lg h-12 pr-12"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isResolving ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : selectedENS ? (
                      resolvedPolicy ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : resolutionError ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Search className="h-5 w-5 text-gray-500" />
                      )
                    ) : (
                      <Search className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {resolutionError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{resolutionError}</span>
                  </div>
                )}
                
                {resolvedPolicy && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Policy found and active</span>
                  </div>
                )}
              </div>

              {/* Available Policies Hint */}
              {policies && policies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Available policies:</p>
                  <div className="flex flex-wrap gap-2">
                    {policies.filter(p => p.active).map((policy, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                        onClick={() => setSelectedENS(`${policy.name}.${userENS}`)}
                      >
                        {policy.name}.{userENS}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount Input */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5 text-blue-500" />
                Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Token Selection */}
                <div className="grid grid-cols-4 gap-2">
                  {tokens.map((token) => (
                    <Button
                      key={token.symbol}
                      variant={selectedToken === token.symbol ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedToken(token.symbol)}
                      className={
                        selectedToken === token.symbol
                          ? "bg-blue-500 text-black hover:bg-blue-600"
                          : "bg-transparent border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400"
                      }
                    >
                      {token.symbol}
                    </Button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-3xl h-16 text-center font-mono"
                    step="0.001"
                    min="0"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-xl font-medium text-gray-400">{selectedToken}</span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {['0.01', '0.1', '1', '10'].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount)}
                      className="bg-transparent border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400"
                    >
                      {quickAmount}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full bg-blue-500 hover:bg-blue-600 text-black text-lg h-14 disabled:bg-gray-700 disabled:text-gray-400"
          >
            {isSending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send Payment
              </>
            )}
          </Button>
        </div>

        {/* Policy Preview */}
        <div className="space-y-6">
          {resolvedPolicy ? (
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Policy Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{resolvedPolicy.name}</h3>
                    <p className="text-emerald-400 font-mono">{resolvedPolicy.fullENS}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Payment Distribution:</h4>
                    {resolvedPolicy.recipients.map((recipient: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm text-white">{recipient.label}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              {recipient.address.slice(0, 6)}...{recipient.address.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{recipient.percentage}%</p>
                          {amount && (
                            <p className="text-xs text-gray-400">
                              {((parseFloat(amount) * recipient.percentage) / 100).toFixed(4)} {selectedToken}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contract:</span>
                      <span className="text-gray-300 font-mono">
                        {resolvedPolicy.policyContract.slice(0, 6)}...{resolvedPolicy.policyContract.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className="bg-emerald-500 text-black">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Amount:</span>
                      <span className="text-gray-300">{resolvedPolicy.minAmount} ETH</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="p-8 text-center">
                <div className="space-y-3">
                  <Search className="h-12 w-12 text-gray-600 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-400">Enter ENS Name</h3>
                  <p className="text-gray-500">
                    Enter a valid ENS name to see the policy details and payment distribution
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
