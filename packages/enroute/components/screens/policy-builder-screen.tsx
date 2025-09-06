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
  
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newRecipientAddress, setNewRecipientAddress] = useState("")
  const [newRecipientLabel, setNewRecipientLabel] = useState("")
  const [newRecipientPercentage, setNewRecipientPercentage] = useState<number>(0)
  const [policies, setPolicies] = useState<PolicyRule[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [policyName, setPolicyName] = useState("")
  const [policyDescription, setPolicyDescription] = useState("")

  const addRecipient = () => {
    if (!newRecipientLabel.trim() || !newRecipientAddress.trim()) return

    const newRecipient: Recipient = {
      id: Date.now().toString(),
      address: newRecipientAddress,
      percentage: newRecipientPercentage,
      label: newRecipientLabel,
    }

    setRecipients([...recipients, newRecipient])
    setNewRecipientLabel("")
    setNewRecipientAddress("")
    setNewRecipientPercentage(0)
  }

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter((recipient) => recipient.id !== id))
  }

  const updatePercentage = (id: string, percentage: number) => {
    setRecipients(recipients.map((recipient) => (recipient.id === id ? { ...recipient, percentage } : recipient)))
  }

  const totalPercentage = recipients.reduce((sum, recipient) => sum + recipient.percentage, 0)

  const savePolicy = async () => {
    if (totalPercentage !== 100) {
      toast({
        title: "Invalid percentages",
        description: "Total percentages must equal 100%",
        variant: "destructive",
      })
      return
    }

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a policy",
        variant: "destructive",
      })
      return
    }

    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare data for contract call
      const recipientAddresses = recipients.map(recipient => recipient.address as `0x${string}`)
      const percentages = recipients.map(recipient => recipient.percentage * 100) // Convert to basis points
      const labels = recipients.map(recipient => recipient.label)
      const value = creationFee ? creationFee : parseEther("0.001") // Fallback fee

      // Create the policy on-chain
      const result = createSimpleSplitPolicy(
        address,
        policyName,
        policyDescription,
        recipientAddresses,
        percentages,
        labels,
        value
      )

      toast({
        title: "Creating policy...",
        description: "Transaction submitted. Please wait for confirmation.",
      })

    } catch (err) {
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
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Percentage Allocation</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0"
                          value={newRecipientPercentage || ""}
                          onChange={(e) => setNewRecipientPercentage(Number(e.target.value) || 0)}
                          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 text-lg font-bold pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">
                          {newRecipientPercentage || 0}%
                        </div>
                        <div className="text-xs text-gray-500">
                          of total
                        </div>
                      </div>
                    </div>
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
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
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
                      
                      {/* Large Percentage Display */}
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-2 block">Percentage Allocation</label>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={recipient.percentage || ""}
                                onChange={(e) => updatePercentage(recipient.id, Number(e.target.value) || 0)}
                                className="w-32 bg-gray-800 border-gray-600 text-white font-bold text-lg"
                              />
                              <div className="text-right">
                                <div className="text-4xl font-bold text-emerald-400">
                                  {recipient.percentage || 0}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  of total policy
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}

              {/* Percentage Summary */}
              <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="text-center space-y-4">
                  <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Total Allocation</h4>
                  <div className="flex items-center justify-center">
                    <div className="text-6xl font-bold tabular-nums">
                      <span className={
                        totalPercentage === 100
                          ? "text-emerald-400"
                          : totalPercentage > 100
                          ? "text-red-400"
                          : "text-yellow-400"
                      }>
                        {totalPercentage}
                      </span>
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          totalPercentage === 100 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : totalPercentage > 100
                            ? "bg-gradient-to-r from-red-500 to-red-400"
                            : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                        }`}
                        style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="text-center">
                      {totalPercentage === 100 ? (
                        <p className="text-emerald-400 text-sm font-medium">✓ Perfect! Ready to create policy</p>
                      ) : totalPercentage > 100 ? (
                        <p className="text-red-400 text-sm font-medium">⚠ Over allocation - reduce percentages</p>
                      ) : (
                        <p className="text-yellow-400 text-sm font-medium">⚠ Under allocation - add {100 - totalPercentage}% more</p>
                      )}
                    </div>
                  </div>
                </div>
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
                onClick={savePolicy}
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