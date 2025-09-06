"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Wallet, ArrowRight, Save, Eye, Settings, Loader2 } from "lucide-react"
import { useCreateSimpleSplitPolicy, usePolicyCreationFee } from "@/hooks/use-enroute-contracts"
import { POLICY_TYPES } from "@/lib/contracts"
import { useToast } from "@/hooks/use-toast"

interface PolicyBuilderScreenProps {
  userENS: string | null
}

interface Recipient {
  id: string
  address: string
  percentage: number
  label: string // User-friendly label like "Main Savings", "Emergency Fund", etc.
}

interface PolicyRule {
  id: string
  name: string
  description: string
  recipients: Recipient[]
  conditions: string[]
}

export function PolicyBuilderScreen({ userENS }: PolicyBuilderScreenProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  
  // Web3 hooks
  const { data: creationFee } = usePolicyCreationFee(POLICY_TYPES.SIMPLE_SPLIT)
  const { 
    createSimpleSplitPolicy, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error,
    hash 
  } = useCreateSimpleSplitPolicy()

  // Debug Web3 state
  React.useEffect(() => {
    console.log("Web3 State Debug:", {
      address,
      creationFee: creationFee?.toString(),
      isPending,
      isConfirming,
      isConfirmed,
      error: error?.message,
      hash,
      createSimpleSplitPolicy: typeof createSimpleSplitPolicy
    })
    
    // Also debug contract addresses
    console.log("Contract addresses:", {
      POLICY_FACTORY: process.env.NEXT_PUBLIC_POLICY_FACTORY_ADDRESS,
      SIMPLE_SPLIT_IMPL: process.env.NEXT_PUBLIC_SIMPLE_SPLIT_IMPL,
      POLICY_TYPE: POLICY_TYPES.SIMPLE_SPLIT
    })
  }, [address, creationFee, isPending, isConfirming, isConfirmed, error, hash, createSimpleSplitPolicy])
  
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newRecipientAddress, setNewRecipientAddress] = useState("")
  const [newRecipientLabel, setNewRecipientLabel] = useState("")
  const [policies, setPolicies] = useState<PolicyRule[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [policyName, setPolicyName] = useState("")
  const [policyDescription, setPolicyDescription] = useState("")

  const addRecipient = () => {
    if (!newRecipientLabel.trim() || !newRecipientAddress.trim()) return

    const newRecipient: Recipient = {
      id: Date.now().toString(),
      address: newRecipientAddress,
      percentage: 0,
      label: newRecipientLabel,
    }

    setRecipients([...recipients, newRecipient])
    setNewRecipientLabel("")
    setNewRecipientAddress("")
  }

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter((recipient) => recipient.id !== id))
  }

  const updatePercentage = (id: string, percentage: number) => {
    setRecipients(recipients.map((recipient) => (recipient.id === id ? { ...recipient, percentage } : recipient)))
  }

  const totalPercentage = recipients.reduce((sum, recipient) => sum + recipient.percentage, 0)

  const savePolicy = async () => {
    console.log("savePolicy called!")
    console.log("Current state:", {
      totalPercentage,
      recipientsLength: recipients.length,
      address,
      isPending,
      isConfirming,
      policyName,
      recipients
    })

    if (totalPercentage !== 100) {
      console.log("Invalid percentage:", totalPercentage)
      toast({
        title: "Invalid percentages",
        description: "Total percentages must equal 100%",
        variant: "destructive",
      })
      return
    }

    console.log("Percentage check passed")

    if (!address) {
      console.log("No wallet address")
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a policy",
        variant: "destructive",
      })
      return
    }

    console.log("Address check passed")

    if (recipients.length === 0) {
      console.log("No recipients")
      toast({
        title: "No recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      })
      return
    }

    console.log("Recipients check passed")

    try {
      console.log("Starting policy creation...")
      // Prepare data for contract call
      const recipientAddresses = recipients.map(recipient => recipient.address as `0x${string}`)
      const percentages = recipients.map(recipient => recipient.percentage * 100) // Convert to basis points
      const labels = recipients.map(recipient => recipient.label)
      const value = creationFee ? creationFee : parseEther("0.001") // Fallback fee

      console.log("Prepared data:", {
        recipientAddresses,
        percentages,
        labels,
        value: value.toString(),
        policyName,
        policyDescription
      })

      // Create the policy on-chain
      console.log("Calling createSimpleSplitPolicy...")
      const result = createSimpleSplitPolicy(
        address,
        policyName,
        policyDescription,
        recipientAddresses,
        percentages,
        labels,
        value
      )

      console.log("createSimpleSplitPolicy called, result:", result)

      toast({
        title: "Creating policy...",
        description: "Transaction submitted. Please wait for confirmation.",
      })

    } catch (err) {
      console.error("Error creating policy:", err)
      console.error("Error details:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        cause: err instanceof Error ? err.cause : undefined
      })
      toast({
        title: "Error creating policy",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  // Handle transaction completion
  React.useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: "Policy created successfully!",
        description: `Your SimpleSplitPaymentPolicy is now active. Transaction: ${hash}`,
      })

      const newPolicy: PolicyRule = {
        id: hash,
        name: `${policyName} Policy`,
        description: `Auto-route payments: ${recipients.map((recipient) => `${recipient.percentage}% to ${recipient.label}`).join(", ")}`,
        recipients: [...recipients],
        conditions: [`ENS: ${policyName}.${userENS}`, "Auto-split enabled"],
      }

      setPolicies([...policies, newPolicy])
      setShowPreview(true)
    }
  }, [isConfirmed, hash])

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Transaction failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }, [error])

  return (
    <div className="min-h-screen bg-black p-4 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Define Your Routing Rules</h1>
            <p className="text-gray-400">Create custom payment policies for your ENS</p>
          </div>
        </div>

        {userENS && (
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-transparent">
                  Your ENS
                </Badge>
                <span className="font-mono font-bold text-lg text-white">{userENS}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Subname Management */}
        <div className="space-y-6 min-w-0">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5" />
                Payment Recipients & Distribution
              </CardTitle>
              <p className="text-sm text-gray-400">
                Add recipient addresses and set what percentage each should receive
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Policy Configuration */}
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                <h4 className="font-medium text-sm text-white">Policy Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Policy Name (for ENS)</label>
                    <Input
                      placeholder="policy-name"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Will create: {policyName}.{userENS}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Description</label>
                    <Input
                      placeholder="Describe your policy"
                      value={policyDescription}
                      onChange={(e) => setPolicyDescription(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add New Recipient */}
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                <h4 className="font-medium text-sm text-white">Add New Recipient</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Label</label>
                    <Input
                      placeholder="Recipient label"
                      value={newRecipientLabel}
                      onChange={(e) => setNewRecipientLabel(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Wallet Address</label>
                    <Input
                      placeholder="0x742d35Cc6634C0532925a3b8D4C053..."
                      value={newRecipientAddress}
                      onChange={(e) => setNewRecipientAddress(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button
                    onClick={addRecipient}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black"
                    disabled={!newRecipientLabel || !newRecipientAddress}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </div>

              {/* Current Recipients */}
              {recipients.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-white">Current Recipients</h4>
                  {recipients.map((recipient) => (
                  <Card key={recipient.id} className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-medium text-white">{recipient.label}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">
                            {recipient.address.slice(0, 20)}...
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(recipient.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={recipient.percentage}
                          onChange={(e) => updatePercentage(recipient.id, Number(e.target.value))}
                          className="w-20 bg-gray-900 border-gray-700 text-white"
                        />
                        <span className="text-sm text-gray-400">%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}

              {/* Percentage Summary */}
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Total Allocation:</span>
                  <Badge
                    variant="outline"
                    className={
                      totalPercentage === 100
                        ? "bg-emerald-500 text-black border-emerald-500"
                        : "bg-red-500 text-white border-red-500"
                    }
                  >
                    {totalPercentage}%
                  </Badge>
                </div>
                {totalPercentage !== 100 && (
                  <p className="text-xs text-gray-400 mt-1">Must equal 100% to save policy</p>
                )}
              </div>

              {/* Creation Fee Info */}
              {creationFee && (
                <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-300">Creation Fee:</span>
                    <span className="font-mono text-blue-200">
                      {(Number(creationFee) / 1e18).toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={(e) => {
                  console.log("Button clicked!", e)
                  console.log("Button disabled state:", totalPercentage !== 100 || recipients.length === 0 || isPending || isConfirming || !address)
                  savePolicy()
                }}
                disabled={totalPercentage !== 100 || recipients.length === 0 || isPending || isConfirming || !address}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black disabled:bg-gray-700 disabled:text-gray-400"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isPending ? "Creating Policy..." : "Confirming..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Policy On-Chain
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Policies */}
        <div className="space-y-6 min-w-0">
          {/* Live Preview */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5" />
                Payment Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="font-medium mb-3 text-white">Policy Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">ENS Address:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {policyName}.{userENS}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sample Amount:</span>
                    <span className="font-mono font-bold text-white">100 USDC</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="space-y-1">
                    {recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-gray-300 min-w-0">
                          <ArrowRight className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                          <span className="truncate text-xs">
                            {recipient.address.slice(0, 6)}...{recipient.address.slice(-4)}
                          </span>
                          <span className="text-emerald-400">({recipient.label})</span>
                        </span>
                        <span className="font-mono text-white whitespace-nowrap ml-2">
                          {((100 * recipient.percentage) / 100).toFixed(1)} USDC ({recipient.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {totalPercentage === 100 && (
                <div className="p-3 bg-emerald-900/30 rounded-lg border border-emerald-700">
                  <p className="text-sm text-center text-emerald-300">
                    ✓ Policy ready! Payments will be automatically routed according to your rules.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Policies */}
          {policies.length > 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Active Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {policies.map((policy) => (
                  <Card key={policy.id} className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{policy.name}</h4>
                          <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-transparent">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{policy.description}</p>
                        <div className="space-y-1">
                          {policy.conditions.map((condition, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                              <span className="text-gray-400">{condition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
