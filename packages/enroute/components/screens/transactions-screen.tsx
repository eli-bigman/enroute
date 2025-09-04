"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { History, ArrowDownLeft, XCircle, Clock, Search, ArrowRight, ExternalLink } from "lucide-react"

interface TransactionsScreenProps {
  userENS: string | null
}

export function TransactionsScreen({ userENS }: TransactionsScreenProps) {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [transactions] = useState([
    {
      id: "1",
      type: "received",
      amount: "50 USDC",
      from: "bob.eth",
      timestamp: "2024-01-15T14:30:00Z",
      status: "completed",
      routing: [
        { subname: "main.alice.enroute.eth", amount: "35 USDC", percentage: 70 },
        { subname: "savings.alice.enroute.eth", amount: "15 USDC", percentage: 30 },
      ],
      txHash: "0x742d35Cc6634C0532925a3b8D4C053292...",
    },
    {
      id: "2",
      type: "rejected",
      amount: "2 DAI",
      from: "charlie.eth",
      timestamp: "2024-01-14T09:15:00Z",
      status: "rejected",
      reason: "Below minimum threshold (5 USD required)",
      txHash: "0x8ba1f109551bD432803012645Hac189...",
    },
    {
      id: "3",
      type: "received",
      amount: "100 USDT",
      from: "dao.treasury.eth",
      timestamp: "2024-01-13T16:45:00Z",
      status: "completed",
      routing: [
        { subname: "main.alice.enroute.eth", amount: "70 USDT", percentage: 70 },
        { subname: "savings.alice.enroute.eth", amount: "30 USDT", percentage: 30 },
      ],
      txHash: "0x9cb2f209661cE532925a3b8D4C053292...",
    },
    {
      id: "4",
      type: "pending",
      amount: "25 USDC",
      from: "alice.dao.eth",
      timestamp: "2024-01-15T15:00:00Z",
      status: "pending",
      routing: [
        { subname: "main.alice.enroute.eth", amount: "17.5 USDC", percentage: 70 },
        { subname: "savings.alice.enroute.eth", amount: "7.5 USDC", percentage: 30 },
      ],
      txHash: "0x1cd3f309771dE632925a3b8D4C053292...",
    },
    {
      id: "5",
      type: "rejected",
      amount: "0.5 ETH",
      from: "random.eth",
      timestamp: "2024-01-12T11:20:00Z",
      status: "rejected",
      reason: "Token not accepted (only stablecoins allowed)",
      txHash: "0x2de4g409881eF732925a3b8D4C053292...",
    },
    {
      id: "6",
      type: "received",
      amount: "200 DAI",
      from: "grants.gitcoin.eth",
      timestamp: "2024-01-11T13:30:00Z",
      status: "completed",
      routing: [
        { subname: "main.alice.enroute.eth", amount: "140 DAI", percentage: 70 },
        { subname: "savings.alice.enroute.eth", amount: "60 DAI", percentage: 30 },
      ],
      txHash: "0x3ef5h509991fG832925a3b8D4C053292...",
    },
  ])

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = filter === "all" || tx.status === filter
    const matchesSearch =
      searchTerm === "" ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <ArrowDownLeft className="h-4 w-4 text-primary" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "pending":
        return <Clock className="h-4 w-4 text-accent" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-primary">
            Completed
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
        return (
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <History className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Transaction History</h1>
            <p className="text-gray-400">Track all your routed payments and rejections</p>
          </div>
        </div>

        {userENS && (
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-transparent">
                  Tracking
                </Badge>
                <span className="font-mono font-bold text-lg text-white">{userENS}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by sender or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={
                  filter === "all"
                    ? "bg-white text-black hover:bg-gray-100 border-white"
                    : "bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                }
              >
                All
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
                className={
                  filter === "completed"
                    ? "bg-white text-black hover:bg-gray-100 border-white"
                    : "bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                }
              >
                Accepted
              </Button>
              <Button
                variant={filter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("rejected")}
                className={
                  filter === "rejected"
                    ? "bg-white text-black hover:bg-gray-100 border-white"
                    : "bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                }
              >
                Rejected
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
                className={
                  filter === "pending"
                    ? "bg-white text-black hover:bg-gray-100 border-white"
                    : "bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                }
              >
                Pending
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <Card
            key={transaction.id}
            className="border-gray-800 bg-gray-900/30 hover:border-emerald-500/50 transition-colors"
          >
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium text-white">{transaction.amount}</p>
                      <p className="text-sm text-gray-400">from {transaction.from}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {getStatusBadge(transaction.status)}
                    <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
                  </div>
                </div>

                {/* Routing Details */}
                {transaction.routing && (
                  <>
                    <Separator className="bg-gray-800" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Auto-routing Applied:</h4>
                      <div className="grid gap-2">
                        {transaction.routing.map((route, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3 text-emerald-500" />
                              <span className="text-sm font-mono text-gray-300">{route.subname}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium text-sm text-white">{route.amount}</span>
                              <span className="text-xs text-gray-400 ml-1">({route.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Rejection Reason */}
                {transaction.reason && (
                  <>
                    <Separator className="bg-gray-800" />
                    <div className="flex items-center gap-2 p-2 bg-red-900/20 rounded border border-red-800/50">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">{transaction.reason}</span>
                    </div>
                  </>
                )}

                {/* Transaction Hash */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-500 font-mono">{transaction.txHash.slice(0, 20)}...</span>
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-gray-400 hover:text-emerald-500">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTransactions.length === 0 && (
          <Card className="border-gray-800 bg-gray-900/30">
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2 text-white">No transactions found</h3>
              <p className="text-sm text-gray-400">
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Your transaction history will appear here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
