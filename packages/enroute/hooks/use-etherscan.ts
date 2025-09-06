import { useState, useEffect } from 'react'

interface EtherscanTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  isError: string
  txreceipt_status: string
  input: string
  contractAddress: string
  cumulativeGasUsed: string
  gasUsed: string
  confirmations: string
  methodId: string
  functionName: string
}

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

export function useEtherscanTransactions(address: `0x${string}` | undefined, limit: number = 10) {
  const [transactions, setTransactions] = useState<FormattedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setTransactions([])
      return
    }

    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)

      console.log('🔍 Fetching transactions for address:', address)

      try {
        // Temporary: Add mock data to test if the component rendering works
        const mockTransactions: FormattedTransaction[] = [
          {
            id: 'test-1',
            hash: '0x1234567890abcdef1234567890abcdef12345678',
            type: 'received',
            amount: '0.1000 ETH',
            from: '0x38269215091e4fFf0DE6E0bd4DDF7e82d11f8957',
            to: address.toLowerCase(),
            timestamp: '2h ago',
            status: 'success',
            gasUsed: '21.0k',
            methodName: 'transfer'
          },
          {
            id: 'test-2',
            hash: '0xabcdef1234567890abcdef1234567890abcdef12',
            type: 'sent', 
            amount: '0.0500 ETH',
            from: address.toLowerCase(),
            to: '0x1567b6e39CA763059756898d94ccaad29af475e7',
            timestamp: '1d ago',
            status: 'success',
            gasUsed: '45.2k',
            methodName: 'makePayment'
          }
        ]
        
        console.log('🧪 Using temporary mock transactions for testing')
        setTransactions(mockTransactions)
        setIsLoading(false)
        return

        // Real API call (commented out for testing)
        /*
        // Base Sepolia Etherscan API
        const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY
        const baseUrl = 'https://api-sepolia.basescan.org/api'
        
        const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`
        
        console.log('📡 API URL:', url.replace(apiKey || '', '***API_KEY***'))
        console.log('🔑 Using API key:', apiKey ? 'Yes' : 'No')
        
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const data = await response.json()
        console.log('📊 API Response:', data)

        if (data.status === '0' && data.message === 'No transactions found') {
          console.log('❌ No transactions found for address')
          setTransactions([])
          return
        }

        if (data.status === '0') {
          throw new Error(data.message || 'Failed to fetch transactions')
        }

        console.log('✅ Found', data.result?.length || 0, 'transactions')

        const formattedTxs: FormattedTransaction[] = data.result.map((tx: EtherscanTransaction) => {
          const isSent = tx.from.toLowerCase() === address.toLowerCase()
          const isReceived = tx.to.toLowerCase() === address.toLowerCase()
          
          let type: 'sent' | 'received' | 'contract_interaction' = 'contract_interaction'
          if (isSent && !tx.to) {
            type = 'contract_interaction' // Contract creation
          } else if (isSent) {
            type = 'sent'
          } else if (isReceived) {
            type = 'received'
          }

          const valueInEth = parseFloat(tx.value) / 1e18
          const timestamp = new Date(parseInt(tx.timeStamp) * 1000)
          
          // Try to decode function name from methodId
          let methodName = tx.functionName || undefined
          if (!methodName && tx.input && tx.input.length >= 10) {
            const methodId = tx.input.slice(0, 10)
            // Common method signatures
            const knownMethods: { [key: string]: string } = {
              '0xa9059cbb': 'transfer',
              '0x23b872dd': 'transferFrom',
              '0x095ea7b3': 'approve',
              '0x232e1788': 'createPolicy',
              '0x60c80c50': 'initialize',
            }
            methodName = knownMethods[methodId] || `0x${methodId.slice(2, 6)}...`
          }

          return {
            id: tx.hash,
            hash: tx.hash,
            type,
            amount: valueInEth > 0 ? `${valueInEth.toFixed(4)} ETH` : '0 ETH',
            from: tx.from,
            to: tx.to || 'Contract Creation',
            timestamp: formatTimeAgo(timestamp),
            status: tx.txreceipt_status === '1' ? 'success' : 'failed',
            gasUsed: (parseInt(tx.gasUsed) / 1000).toFixed(1) + 'k',
            methodName
          }
        })

        console.log('🎉 Formatted transactions:', formattedTxs)
        setTransactions(formattedTxs)
        */
      } catch (err) {
        console.error('❌ Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [address, limit])

  return { transactions, isLoading, error, refetch: () => {} }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}
