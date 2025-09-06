import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, Settings, ExternalLink, User } from "lucide-react"
import { useENSResolver } from "@/hooks/use-ens-resolver"

interface FormattedTransaction {
  id: string
  hash: string
  type: 'sent' | 'received' | 'contract_interaction'
  amount: string
  from: string
  to: string
  timestamp: string
  status: 'success' | 'failed'
  gasUsed: string
  methodName?: string
}

interface TransactionCardProps {
  transaction: FormattedTransaction
  userAddress: string
}

function AddressDisplay({ address, label }: { address: string; label: string }): React.JSX.Element {
  const { ensName, isLoading } = useENSResolver(address)
  
  if (address === 'Contract Creation') {
    return (
      <span className="flex items-center gap-1">
        <Settings className="h-3 w-3 text-purple-400" />
        <span className="font-mono text-purple-400">Contract Creation</span>
      </span>
    )
  }

  if (isLoading) {
    return (
      <span className="flex items-center gap-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono animate-pulse">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </span>
    )
  }

  if (ensName) {
    return (
      <span className="flex items-center gap-1">
        <User className="h-3 w-3 text-emerald-400" />
        <span className="text-emerald-400 font-medium">{ensName}</span>
        <span className="text-xs text-gray-500 font-mono">
          ({address.slice(0, 6)}...{address.slice(-4)})
        </span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </span>
  )
}

export function TransactionCard({ transaction, userAddress }: TransactionCardProps): React.JSX.Element {
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'received':
        return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
      case 'sent':
        return <ArrowUpRight className="h-4 w-4 text-blue-400" />
      default:
        return <Settings className="h-4 w-4 text-purple-400" />
    }
  }

  const getTransactionLabel = () => {
    switch (transaction.type) {
      case 'received':
        return 'Received'
      case 'sent':
        return 'Sent'
      default:
        return 'Contract Interaction'
    }
  }

  const relevantAddress = transaction.type === 'sent' ? transaction.to : transaction.from
  const addressLabel = transaction.type === 'sent' ? 'To:' : 'From:'

  return (
    <Card className="border-gray-700 bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Transaction Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTransactionIcon()}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{transaction.amount}</span>
                  {transaction.methodName && (
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 px-1.5 py-0.5">
                      {transaction.methodName}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-400">{getTransactionLabel()}</span>
              </div>
            </div>
            <Badge
              variant={transaction.status === 'success' ? 'default' : 'destructive'}
              className={
                transaction.status === 'success' 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-red-600 text-white'
              }
            >
              {transaction.status}
            </Badge>
          </div>

          {/* Address Information */}
          <div className="text-sm">
            <AddressDisplay address={relevantAddress} label={addressLabel} />
          </div>

          {/* Transaction Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>{transaction.timestamp}</span>
              <span>Gas: {transaction.gasUsed}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:text-emerald-500 transition-colors"
              onClick={() => window.open(`https://sepolia.basescan.org/tx/${transaction.hash}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
