"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Home, Edit, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Shield, Clock, ExternalLink, RefreshCw, Settings } from "lucide-react"
import { useUserPoliciesDetailed, useAccountBalance } from "@/hooks/use-enroute-contracts"
import { useEtherscanTransactions } from "@/hooks/use-etherscan"
import { TransactionCard } from "@/components/transaction-card"

interface DashboardScreenProps {
  userENS: string | null
  onScreenChange?: (screen: string) => void
}

export function DashboardScreen({ userENS, onScreenChange }: DashboardScreenProps) {
  const { address } = useAccount()
  
  // Real data hooks
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(address)
  const { policies, policyCount, isLoading: policiesLoading, refetch: refetchPolicies } = useUserPoliciesDetailed(address)
  const { transactions, isLoading: transactionsLoading, error: transactionsError } = useEtherscanTransactions(address, 5)
  
  // Last update time
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  // Refresh all data
  const refreshData = () => {
    refetchPolicies()
    setLastUpdated(new Date())
  }
  
  // Calculate stats from real data
  const stats = {
    balance: balance ? formatEther(balance.value) : '0',
    symbol: balance?.symbol || 'ETH',
    totalPolicies: policyCount,
    activePolicies: policies ? policies.filter(p => p.active).length : 0,
    successfulTxs: transactions.filter(tx => tx.status === 'success').length,
    failedTxs: transactions.filter(tx => tx.status === 'failed').length,
    successRate: transactions.length > 0 
      ? `${((transactions.filter(tx => tx.status === 'success').length / transactions.length) * 100).toFixed(1)}%`
      : '0%'
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Home className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ENS Dashboard</h1>
            <p className="text-gray-400">Monitor your programmable payment policies</p>
          </div>
        </div>

        {userENS && (
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-transparent">
                      Your ENS
                    </Badge>
                    <span className="font-mono font-bold text-xl text-white">{userENS}</span>
                  </div>
                  {address && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Wallet:</span>
                      <span className="font-mono text-gray-300 break-all">{address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Balance:</span>
                    <span className="font-mono text-emerald-400">
                      {balanceLoading ? '...' : `${parseFloat(stats.balance).toFixed(4)} ${stats.symbol}`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    className="bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Policies
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Balance</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {balanceLoading ? '...' : `${parseFloat(stats.balance).toFixed(4)}`}
            </p>
            <p className="text-xs text-gray-500">{stats.symbol}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Active Policies</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {policiesLoading ? '...' : stats.activePolicies}
            </p>
            <p className="text-xs text-gray-500">of {stats.totalPolicies} total</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{stats.successRate}</p>
            <p className="text-xs text-gray-500">{stats.successfulTxs} successful</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Last Updated</span>
            </div>
            <p className="text-lg font-bold mt-1 text-white">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-gray-500">{lastUpdated.toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Policies */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-emerald-500" />
              Active Policies
              {policiesLoading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {policiesLoading ? (
              <div className="text-center py-8 text-gray-400">Loading policies...</div>
            ) : !policies || policies.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-gray-400">No policies created yet</div>
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Create Your First Policy
                </Button>
              </div>
            ) : (
              <>
                {policies.map((policy, index) => (
                  <Card key={index} className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold text-white">{policy.name || `Policy #${index + 1}`}</h4>
                            <p className="text-sm text-emerald-400 font-mono">
                              {policy.name}.{userENS}
                            </p>
                          </div>
                          <Badge className={policy.active ? "bg-emerald-500 text-black" : "bg-gray-600 text-gray-300"}>
                            {policy.active ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {policy.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-500 font-mono break-all">
                          Contract: {policy.policyContract}
                        </p>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                            <span className="text-gray-400">
                              {policy.policyType === 3 ? 'SimpleSplitPaymentPolicy' : `Policy Type ${policy.policyType}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                            <span className="text-gray-400">Automated payment distribution</span>
                          </div>
                        </div>

                        <Separator className="bg-gray-700" />

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Created {new Date(Number(policy.createdAt) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:text-emerald-500"
                            onClick={() => window.open(`https://sepolia.basescan.org/address/${policy.policyContract}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  className="w-full bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                  onClick={() => onScreenChange?.('policy-builder')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Create New Policy
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Recent Transactions
              {transactionsLoading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
            </CardTitle>
            <p className="text-sm text-gray-400">
              Your latest transactions with ENS resolution
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactionsLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                Loading transactions...
              </div>
            ) : transactionsError ? (
              <div className="text-center py-8 text-red-400">
                <div className="text-red-500 mb-2">❌</div>
                <p>Error loading transactions</p>
                <p className="text-xs mt-1 text-gray-500">{transactionsError}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="h-8 w-8 mx-auto mb-2 opacity-50">💳</div>
                <p>No transactions found</p>
                <p className="text-xs mt-1">Start using your policies to see transaction history</p>
              </div>
            ) : (
              <>
                {transactions.slice(0, 5).map((tx) => (
                  <TransactionCard key={tx.hash} transaction={tx} userAddress={address || ''} />
                ))}

                <Button
                  variant="outline"
                  className="w-full bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500 mt-4"
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${address}`, '_blank')}
                >
                  <span className="mr-2">🔗</span>
                  View All Transactions on BaseScan
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
