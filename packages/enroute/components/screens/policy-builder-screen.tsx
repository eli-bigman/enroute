"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Wallet, ArrowRight, Save, Eye, Settings } from "lucide-react"

interface PolicyBuilderScreenProps {
  userENS: string | null
}

interface Subname {
  id: string
  name: string
  address: string
  percentage: number
}

interface PolicyRule {
  id: string
  name: string
  description: string
  subnames: Subname[]
  conditions: string[]
}

export function PolicyBuilderScreen({ userENS }: PolicyBuilderScreenProps) {
  const [subnames, setSubnames] = useState<Subname[]>([
    { id: "1", name: "main", address: "0x742d35Cc6634C0532925a3b8D4C053", percentage: 70 },
    { id: "2", name: "savings", address: "0x8ba1f109551bD432803012645Hac189", percentage: 30 },
  ])
  const [newSubname, setNewSubname] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [policies, setPolicies] = useState<PolicyRule[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const addSubname = () => {
    if (!newSubname.trim() || !newAddress.trim()) return

    const newSub: Subname = {
      id: Date.now().toString(),
      name: newSubname.toLowerCase().replace(/[^a-z0-9]/g, ""),
      address: newAddress,
      percentage: 0,
    }

    setSubnames([...subnames, newSub])
    setNewSubname("")
    setNewAddress("")
  }

  const removeSubname = (id: string) => {
    setSubnames(subnames.filter((sub) => sub.id !== id))
  }

  const updatePercentage = (id: string, percentage: number) => {
    setSubnames(subnames.map((sub) => (sub.id === id ? { ...sub, percentage } : sub)))
  }

  const totalPercentage = subnames.reduce((sum, sub) => sum + sub.percentage, 0)

  const savePolicy = () => {
    if (totalPercentage !== 100) return

    const newPolicy: PolicyRule = {
      id: Date.now().toString(),
      name: `Split Policy ${policies.length + 1}`,
      description: `Auto-route payments: ${subnames.map((sub) => `${sub.percentage}% to ${sub.name}`).join(", ")}`,
      subnames: [...subnames],
      conditions: ["Accept USDC, USDT, DAI", "Minimum amount: 5 USD"],
    }

    setPolicies([...policies, newPolicy])
    setShowPreview(true)
  }

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
                Manage Subnames & Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Subname */}
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                <h4 className="font-medium text-sm text-white">Add New Subname</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="savings"
                      value={newSubname}
                      onChange={(e) => setNewSubname(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <span className="text-gray-400 text-sm whitespace-nowrap">.{userENS}</span>
                  </div>
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b8D4C053..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={addSubname}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black"
                    disabled={!newSubname || !newAddress}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subname
                  </Button>
                </div>
              </div>

              {/* Existing Subnames */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-white">Current Subnames</h4>
                {subnames.map((subname) => (
                  <Card key={subname.id} className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-mono font-medium text-white truncate">
                            {subname.name}.{userENS}
                          </p>
                          <p className="text-xs text-gray-400 font-mono truncate">{subname.address.slice(0, 20)}...</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubname(subname.id)}
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
                          value={subname.percentage}
                          onChange={(e) => updatePercentage(subname.id, Number(e.target.value))}
                          className="w-20 bg-gray-900 border-gray-700 text-white"
                        />
                        <span className="text-sm text-gray-400">%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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

              <Button
                onClick={savePolicy}
                disabled={totalPercentage !== 100 || subnames.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black disabled:bg-gray-700 disabled:text-gray-400"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Policy
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
                <h4 className="font-medium mb-3 text-white">Incoming Payment Simulation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="font-mono font-bold text-white">100 USDC</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="space-y-1">
                    {subnames.map((subname) => (
                      <div key={subname.id} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-gray-300 min-w-0">
                          <ArrowRight className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">
                            {subname.name}.{userENS}
                          </span>
                        </span>
                        <span className="font-mono text-white whitespace-nowrap ml-2">
                          {((100 * subname.percentage) / 100).toFixed(1)} USDC ({subname.percentage}%)
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

          {/* Policy Templates */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-white">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                onClick={() => {
                  setSubnames([
                    { id: "t1", name: "main", address: "0x742d35Cc6634C0532925a3b8D4C053", percentage: 80 },
                    { id: "t2", name: "savings", address: "0x8ba1f109551bD432803012645Hac189", percentage: 20 },
                  ])
                }}
              >
                <div>
                  <p className="font-medium">80/20 Split</p>
                  <p className="text-xs text-gray-400">80% main, 20% savings</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                onClick={() => {
                  setSubnames([
                    { id: "t3", name: "ops", address: "0x742d35Cc6634C0532925a3b8D4C053", percentage: 50 },
                    { id: "t4", name: "grants", address: "0x8ba1f109551bD432803012645Hac189", percentage: 30 },
                    { id: "t5", name: "reserves", address: "0x9cb2f209661cE532925a3b8D4C053292", percentage: 20 },
                  ])
                }}
              >
                <div>
                  <p className="font-medium">DAO Treasury</p>
                  <p className="text-xs text-gray-400">50% ops, 30% grants, 20% reserves</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
