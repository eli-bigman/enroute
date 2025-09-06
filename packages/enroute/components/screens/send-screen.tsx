"use client"

import { useState, useEffect } from "react"
import { useAccount, useSendTransaction } from "wagmi"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useUserPoliciesDetailed, usePolicyRecipients } from "@/hooks/use-enroute-contracts"
import { useToast } from "@/hooks/use-toast"

interface SendScreenProps {
  userENS: string | null
}

export function SendScreen({ userENS }: SendScreenProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  
  // Real data hooks
  const { policies, isLoading: policiesLoading } = useUserPoliciesDetailed(address)
  
  // Web3 transaction hook
  const { sendTransaction, isPending: isTransactionPending, isSuccess, isError, error } = useSendTransaction()
  
  // Form state
  const [selectedENS, setSelectedENS] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState("ETH")
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedPolicy, setResolvedPolicy] = useState<any>(null)
  const [resolutionError, setResolutionError] = useState("")
  const [selectedPolicyAddress, setSelectedPolicyAddress] = useState<`0x${string}` | undefined>(undefined)

  // Fetch real recipients data from blockchain
  const { data: recipients, isLoading: recipientsLoading } = usePolicyRecipients(selectedPolicyAddress)

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
      
      // Validate that the username matches the current user's ENS
      const currentUsername = userENS ? userENS.split('.')[0] : null
      if (!currentUsername) {
        throw new Error("No user ENS available. Please connect your wallet.")
      }
      
      if (username !== currentUsername) {
        throw new Error(`You can only send to your own policies. Use: ${subname}.${currentUsername}.enrouteapp.eth`)
      }
      
      // Find matching policy
      const matchingPolicy = policies.find(policy => 
        policy.name.toLowerCase() === subname.toLowerCase() && 
        policy.active
      )
      
      if (!matchingPolicy) {
        throw new Error(`No active policy found for ${subname}. Available policies: ${policies.map(p => p.name).join(', ')}`)
      }

      // Set the policy address to fetch recipients
      setSelectedPolicyAddress(matchingPolicy.policyContract as `0x${string}`)

      // Create policy details with real data (recipients will be fetched separately)
      const policyDetails = {
        ...matchingPolicy,
        fullENS: ensName,
        acceptedTokens: ["ETH", "USDC", "USDT", "DAI"],
        minAmount: "0.001"
      }

      setResolvedPolicy(policyDetails)
      
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
    if (!resolvedPolicy || !amount || !address) {
      toast({
        title: "Missing Information",
        description: "Please enter a valid ENS name and amount",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert amount to wei for ETH transactions
      const value = parseEther(amount)
      
      // Send transaction to the policy contract address
      sendTransaction({
        to: resolvedPolicy.policyContract as `0x${string}`,
        value: value,
        // For ETH transfers to a policy contract, we send to the contract address
        // The policy contract should handle the distribution automatically
      })
      
      toast({
        title: "Transaction Submitted",
        description: `Sending ${amount} ${selectedToken} to ${resolvedPolicy.fullENS}`,
      })
      
    } catch (error) {
      toast({
        title: "Transaction Failed", 
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  // Handle transaction completion
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Payment Sent Successfully!",
        description: `${amount} ${selectedToken} sent to ${resolvedPolicy?.fullENS}`,
      })
      
      // Reset form
      setAmount("")
      setSelectedENS("")
      setResolvedPolicy(null)
    }
  }, [isSuccess])

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }, [isError, error])

  const isValidAmount = amount && parseFloat(amount) > 0
  const canSend = resolvedPolicy && isValidAmount && !isTransactionPending

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-black text-lg">💸</span>
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
                <span className="text-emerald-500">🎯</span>
                Recipient ENS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder={userENS ? `savings.${userENS}` : "savings.username.enrouteapp.eth"}
                    value={selectedENS}
                    onChange={(e) => setSelectedENS(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-lg h-12 pr-12"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isResolving ? (
                      <span className="text-emerald-500">⏳</span>
                    ) : selectedENS ? (
                      resolvedPolicy ? (
                        <span className="text-emerald-500">✅</span>
                      ) : resolutionError ? (
                        <span className="text-red-500">❌</span>
                      ) : (
                        <span className="text-gray-500">🔍</span>
                      )
                    ) : (
                      <span className="text-gray-500">🔍</span>
                    )}
                  </div>
                </div>
                
                {resolutionError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <span>❌</span>
                    <span>{resolutionError}</span>
                  </div>
                )}
                
                {resolvedPolicy && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <span>✅</span>
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
                        className="cursor-pointer border-gray-600 text-gray-400 hover:border-emerald-500 hover:text-emerald-400"
                        onClick={() => setSelectedENS(`${policy.name}.${userENS || 'username.enrouteapp.eth'}`)}
                      >
                        {policy.name}.{userENS || 'username.enrouteapp.eth'}
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
                <span className="text-emerald-500">💰</span>
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
                          ? "bg-emerald-500 text-black hover:bg-emerald-600"
                          : "bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
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
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-4xl md:text-5xl lg:text-6xl h-20 md:h-24 lg:h-28 text-center font-mono [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    step="0.001"
                    min="0"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-400">{selectedToken}</span>
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
                      className="bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
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
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black text-lg h-14 disabled:bg-gray-700 disabled:text-gray-400"
          >
            {isTransactionPending ? (
              <>
                <span className="mr-2">⏳</span>
                Sending...
              </>
            ) : (
              <>
                <span className="mr-2">💸</span>
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
                  <span className="text-emerald-500">✅</span>
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
                    <h4 className="text-sm font-medium text-gray-300">Recipient Addresses:</h4>
                    {recipientsLoading ? (
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-gray-400">Loading recipients...</p>
                      </div>
                    ) : recipients && recipients.length > 0 ? (
                      recipients.map((recipient: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-500">💰</span>
                            <div>
                              <p className="text-sm font-medium text-white">{recipient.label}</p>
                              <p className="text-xs text-gray-400 font-mono break-all">
                                {recipient.wallet}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-emerald-400">{(Number(recipient.percentage) / 100).toFixed(1)}%</p>
                            {amount && (
                              <p className="text-xs text-gray-300">
                                {((parseFloat(amount) * Number(recipient.percentage)) / 10000).toFixed(4)} {selectedToken}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-gray-400">No recipients found for this policy</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Payment Distribution:</h4>
                    {recipients && recipients.length > 0 ? (
                      recipients.map((recipient: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500">→</span>
                            <div>
                              <p className="text-sm text-white">{recipient.label}</p>
                              <p className="text-xs text-gray-500 font-mono">
                                {recipient.wallet.slice(0, 6)}...{recipient.wallet.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">{(Number(recipient.percentage) / 100).toFixed(1)}%</p>
                            {amount && (
                              <p className="text-xs text-gray-400">
                                {((parseFloat(amount) * Number(recipient.percentage)) / 10000).toFixed(4)} {selectedToken}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No distribution data available</p>
                    )}
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
                  <span className="text-6xl text-gray-600">🔍</span>
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
