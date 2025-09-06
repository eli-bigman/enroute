import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { CONTRACTS, ENROUTE_REGISTRY_ABI, POLICY_FACTORY_ABI, SIMPLE_SPLIT_POLICY_ABI, POLICY_TYPES } from '@/lib/contracts'
import { encodeFunctionData } from 'viem'

// Hook to get account balance
export function useAccountBalance(address: `0x${string}` | undefined) {
  return useBalance({
    address,
    query: {
      enabled: !!address,
    },
  })
}

// Hook to get user policies with detailed information
export function useUserPoliciesDetailed(userAddress: `0x${string}` | undefined) {
  const policiesResult = useReadContract({
    address: CONTRACTS.POLICY_FACTORY,
    abi: POLICY_FACTORY_ABI,
    functionName: 'getUserPolicies',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })

  return {
    policies: policiesResult.data,
    policyCount: policiesResult.data ? policiesResult.data.length : 0,
    isLoading: policiesResult.isLoading,
    error: policiesResult.error,
    refetch: policiesResult.refetch
  }
}

// Hook to check if a username is available
export function useIsUsernameAvailable(username: string) {
  return useReadContract({
    address: CONTRACTS.ENROUTE_REGISTRY,
    abi: ENROUTE_REGISTRY_ABI,
    functionName: 'isUsernameAvailable',
    args: [username],
    query: {
      enabled: !!username && username.length >= 3,
    },
  })
}

// Hook to get user's ENS node
export function useUserNode(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ENROUTE_REGISTRY,
    abi: ENROUTE_REGISTRY_ABI,
    functionName: 'getUserNode',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to get user's username by address
export function useUserUsername(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ENROUTE_REGISTRY,
    abi: ENROUTE_REGISTRY_ABI,
    functionName: 'getUsernameByAddress',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to register a user
export function useRegisterUser() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const registerUser = async (username: string) => {
    try {
      await writeContract({
        address: CONTRACTS.ENROUTE_REGISTRY,
        abi: ENROUTE_REGISTRY_ABI,
        functionName: 'selfRegister',
        args: [username],
        // Let wagmi estimate gas automatically for better accuracy
        gas: undefined,
      })
    } catch (err) {
      console.error('Registration error:', err)
      throw err
    }
  }

  return {
    registerUser,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook to get user policies
export function useUserPolicies(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.POLICY_FACTORY,
    abi: POLICY_FACTORY_ABI,
    functionName: 'getUserPolicies',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to get policy creation fee
export function usePolicyCreationFee(policyType: number) {
  return useReadContract({
    address: CONTRACTS.POLICY_FACTORY,
    abi: POLICY_FACTORY_ABI,
    functionName: 'getCreationFee',
    args: [policyType],
    query: {
      enabled: policyType !== undefined,
    },
  })
}

// Hook to create a policy
export function useCreatePolicy() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const createPolicy = (policyType: number, policyName: string, initData: `0x${string}`, value: bigint) => {
    try {
      const result = writeContract({
        address: CONTRACTS.POLICY_FACTORY,
        abi: POLICY_FACTORY_ABI,
        functionName: 'createPolicy',
        args: [policyType, policyName, initData],
        value,
        gas: BigInt(1000000), // Set explicit gas limit for policy creation
      })
      
      return result
    } catch (err) {
      throw err
    }
  }

  return {
    createPolicy,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Helper function to encode SimpleSplitPaymentPolicy initialization data
export function encodeSimpleSplitInitData(
  owner: `0x${string}`,
  policyName: string,
  description: string,
  recipients: `0x${string}`[],
  percentages: number[],
  labels: string[]
): `0x${string}` {
  return encodeFunctionData({
    abi: SIMPLE_SPLIT_POLICY_ABI,
    functionName: 'initialize',
    args: [
      owner,
      policyName,
      description,
      recipients,
      percentages.map(p => BigInt(p)), // Convert to BigInt for contract
      labels,
    ],
  })
}

// Hook to create a SimpleSplitPaymentPolicy specifically
export function useCreateSimpleSplitPolicy() {
  const { createPolicy, hash, isPending, isConfirming, isConfirmed, error } = useCreatePolicy()
  
  const createSimpleSplitPolicy = (
    owner: `0x${string}`,
    policyName: string,
    description: string,
    recipients: `0x${string}`[],
    percentages: number[],
    labels: string[],
    value: bigint
  ) => {
    const initData = encodeSimpleSplitInitData(
      owner,
      policyName,
      description,
      recipients,
      percentages,
      labels
    )
    
    createPolicy(POLICY_TYPES.SIMPLE_SPLIT, policyName, initData, value)
  }

  return {
    createSimpleSplitPolicy,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook to get policy recipients from a specific policy contract
export function usePolicyRecipients(policyAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: policyAddress,
    abi: SIMPLE_SPLIT_POLICY_ABI,
    functionName: 'getRecipients',
    query: {
      enabled: !!policyAddress,
    },
  })
}
