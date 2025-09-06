import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS, ENROUTE_REGISTRY_ABI, POLICY_FACTORY_ABI } from '@/lib/contracts'

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

  const registerUser = (username: string) => {
    writeContract({
      address: CONTRACTS.ENROUTE_REGISTRY,
      abi: ENROUTE_REGISTRY_ABI,
      functionName: 'selfRegister',
      args: [username], // Only username needed for self-registration
      gas: BigInt(500000), // Set explicit gas limit
    })
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

  const createPolicy = (policyType: number, initData: `0x${string}`, value: bigint) => {
    writeContract({
      address: CONTRACTS.POLICY_FACTORY,
      abi: POLICY_FACTORY_ABI,
      functionName: 'createPolicy',
      args: [policyType, initData],
      value,
    })
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
