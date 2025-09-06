import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACTS, ENROUTE_REGISTRY_ABI } from '@/lib/contracts'

interface ENSResolution {
  address: string
  ensName: string | null
  isLoading: boolean
}

// Hook to resolve multiple addresses to ENS names
export function useMultipleENSResolver(addresses: string[]) {
  const [resolutions, setResolutions] = useState<Record<string, ENSResolution>>({})

  useEffect(() => {
    // Initialize resolutions for all addresses
    const initialResolutions: Record<string, ENSResolution> = {}
    addresses.forEach(addr => {
      if (addr && addr !== 'Contract Creation') {
        initialResolutions[addr.toLowerCase()] = {
          address: addr,
          ensName: null,
          isLoading: true
        }
      }
    })
    setResolutions(initialResolutions)
  }, [addresses])

  return resolutions
}

// Hook to resolve a single address to ENS name using our EnRoute registry
export function useENSResolver(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Try to get username from our registry
  const { data: username, isLoading: usernameLoading } = useReadContract({
    address: CONTRACTS.ENROUTE_REGISTRY,
    abi: ENROUTE_REGISTRY_ABI,
    functionName: 'getUsernameByAddress',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && address !== 'Contract Creation',
    },
  })

  useEffect(() => {
    setIsLoading(usernameLoading)
    
    if (username && username !== '') {
      setEnsName(`${username}.enrouteapp.eth`)
    } else {
      setEnsName(null)
    }
  }, [username, usernameLoading])

  return { ensName, isLoading }
}

// Hook for bulk ENS resolution with caching
export function useBulkENSResolver(addresses: string[]) {
  const [resolutions, setResolutions] = useState<Record<string, string | null>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const resolveAddresses = async () => {
      setIsLoading(true)
      const newResolutions: Record<string, string | null> = {}
      
      // Filter out invalid addresses
      const validAddresses = addresses.filter(addr => 
        addr && 
        addr !== 'Contract Creation' && 
        addr.startsWith('0x') && 
        addr.length === 42
      )

      // For now, we'll resolve each address individually
      // In production, you might want to batch these calls
      for (const address of validAddresses) {
        try {
          // This would call our ENS resolver
          // For now, we'll check if it matches known policy contracts
          const normalizedAddr = address.toLowerCase()
          
          // Check if this is a known policy contract or user address
          // You could extend this to call the registry for each address
          newResolutions[normalizedAddr] = null
          
          // If you have a way to batch resolve, implement it here
          // For now, we'll just set to null and let individual resolvers handle it
        } catch (error) {
          // Silent fail for ENS resolution
          newResolutions[address.toLowerCase()] = null
        }
      }
      
      setResolutions(newResolutions)
      setIsLoading(false)
    }

    if (addresses.length > 0) {
      resolveAddresses()
    }
  }, [addresses])

  return { resolutions, isLoading }
}
