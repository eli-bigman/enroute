"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, CheckCircle, ArrowRight, ChevronDown } from "lucide-react"

export function SendScreen() {
  const [selectedPolicy, setSelectedPolicy] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState("USDC")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const userPolicies = [
    {
      id: "personal-split",
      name: "Personal 70/30 Split",
      ens: "alice.enroute.eth",
      description: "70% to main wallet, 30% to savings",
      routing: [
        { subname: "main.alice.enroute.eth", percentage: 70 },
        { subname: "savings.alice.enroute.eth", percentage: 30 },
      ],
      acceptedTokens: ["USDC", "USDT", "DAI"],
      minAmount: 5,
    },
    {
      id: "dao-treasury",
      name: "DAO Treasury Split",
      ens: "mydao.enroute.eth",
      description: "50% ops, 30% grants, 20% reserves",
      routing: [
        { subname: "ops.mydao.enroute.eth", percentage: 50 },
        { subname: "grants.mydao.enroute.eth", percentage: 30 },
        { subname: "reserves.mydao.enroute.eth", percentage: 20 },
      ],
      acceptedTokens: ["USDC", "USDT", "DAI", "ETH"],
      minAmount: 10,
    },
  ]

  const tokens = ["USDC", "USDT", "DAI", "ETH"]

  const selectedPolicyData = userPolicies.find((p) => p.id === selectedPolicy)

  const handleSend = async () => {
    setIsSending(true)
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSending(false)
    setShowConfirmation(false)
    setSelectedPolicy("")
    setAmount("")
  }

  const isValidTransaction =
    selectedPolicyData &&
    Number(amount) >= selectedPolicyData.minAmount &&
    selectedPolicyData.acceptedTokens.includes(selectedToken)

  if (showConfirmation && selectedPolicyData) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
              <Send className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Confirm Transaction</h1>
              <p className="text-gray-400">Review your payment details</p>
            </div>
          </div>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-center text-white">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold text-white">
                  {amount} {selectedToken}
                </p>
                <p className="text-gray-400">to {selectedPolicyData.ens}</p>
                <p className="text-sm text-gray-500">{selectedPolicyData.name}</p>
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-white">Distribution:</h4>
                {selectedPolicyData.routing.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ArrowRight className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-mono text-white truncate">{route.subname}</span>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-medium text-white">
                        {((Number(amount) * route.percentage) / 100).toFixed(2)} {selectedToken}
                      </p>
                      <p className="text-xs text-gray-400">{route.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-3">
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full h-12 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-black"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <>Confirm & Send</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  disabled={isSending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Send className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Send Payment</h1>
            <p className="text-gray-400">Send funds using your policies</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Select Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md appearance-none pr-10 text-white"
              >
                <option value="" className="bg-gray-900 text-white">
                  Choose a policy to send funds to...
                </option>
                {userPolicies.map((policy) => (
                  <option key={policy.id} value={policy.id} className="bg-gray-900 text-white">
                    {policy.name} ({policy.ens})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {selectedPolicyData && (
              <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{selectedPolicyData.name}</span>
                  <span className="text-sm text-gray-400">{selectedPolicyData.ens}</span>
                </div>
                <p className="text-sm text-gray-400">{selectedPolicyData.description}</p>

                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Distribution:</div>
                  {selectedPolicyData.routing.map((route, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-mono text-white truncate flex-1 mr-2">{route.subname}</span>
                      <span className="text-gray-300">{route.percentage}%</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Accepted tokens:</span>
                  <span className="text-gray-300">{selectedPolicyData.acceptedTokens.join(", ")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Minimum amount:</span>
                  <span className="text-gray-300">{selectedPolicyData.minAmount} USD</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount Input - only show if policy is selected */}
        {selectedPolicyData && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Amount & Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 text-lg h-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                />
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                >
                  {tokens.map((token) => (
                    <option key={token} value={token} className="bg-gray-900 text-white">
                      {token}
                    </option>
                  ))}
                </select>
              </div>

              {/* Validation feedback */}
              {amount && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedPolicyData.acceptedTokens.includes(selectedToken) ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-red-500" />
                    )}
                    <span className="text-white">
                      Token {selectedPolicyData.acceptedTokens.includes(selectedToken) ? "accepted" : "not accepted"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {Number(amount) >= selectedPolicyData.minAmount ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-red-500" />
                    )}
                    <span className="text-white">
                      Amount{" "}
                      {Number(amount) >= selectedPolicyData.minAmount
                        ? "meets minimum"
                        : `below minimum (${selectedPolicyData.minAmount})`}
                    </span>
                  </div>
                </div>
              )}

              {isValidTransaction && (
                <Button
                  onClick={() => setShowConfirmation(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black"
                >
                  Continue to Confirmation
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
