import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useUserNode, useUserUsername, useRegisterUser, useIsUsernameAvailable } from './use-enroute-contracts'

export interface UserRegistrationState {
  isRegistered: boolean
  username: string | null
  userNode: string | null
  isLoading: boolean
  error: string | null
}

export function useUserRegistration() {
  const { address, isConnected } = useAccount()
  const [registrationState, setRegistrationState] = useState<UserRegistrationState>({
    isRegistered: false,
    username: null,
    userNode: null,
    isLoading: false,
    error: null,
  })

  // Get user's current registration status
  const { data: userNode, isLoading: nodeLoading } = useUserNode(address)
  const { data: username, isLoading: usernameLoading } = useUserUsername(address)
  
  // Registration mutation
  const { 
    registerUser, 
    isPending: isRegistering, 
    isConfirming, 
    isConfirmed, 
    error: registerError 
  } = useRegisterUser()

  // Update registration state when data changes
  useEffect(() => {
    if (!isConnected || !address) {
      setRegistrationState({
        isRegistered: false,
        username: null,
        userNode: null,
        isLoading: false,
        error: null,
      })
      return
    }

    const isLoading = nodeLoading || usernameLoading || isRegistering || isConfirming
    const hasUserNode = userNode && userNode !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    const hasUsername = username && username !== ''
    const isRegistered = Boolean(hasUserNode && hasUsername)

    setRegistrationState({
      isRegistered,
      username: hasUsername ? username : null,
      userNode: hasUserNode ? userNode : null,
      isLoading,
      error: registerError?.message || null,
    })
  }, [
    isConnected, 
    address, 
    userNode, 
    username, 
    nodeLoading, 
    usernameLoading, 
    isRegistering, 
    isConfirming,
    registerError
  ])

  // Handle successful registration
  useEffect(() => {
    if (isConfirmed) {
      // Refetch user data after successful registration
      // The wagmi hooks will automatically refetch
    }
  }, [isConfirmed])

  const register = (usernameToRegister: string) => {
    if (!address) return
    registerUser(usernameToRegister)
  }

  return {
    ...registrationState,
    register,
    isRegistering: isRegistering || isConfirming,
  }
}

// Hook to validate and check username availability
export function useUsernameValidation(username: string) {
  const [validationState, setValidationState] = useState({
    isValid: false,
    isChecking: false,
    error: null as string | null,
  })

  const { data: isAvailable, isLoading: isCheckingAvailability } = useIsUsernameAvailable(username)

  useEffect(() => {
    if (!username) {
      setValidationState({ isValid: false, isChecking: false, error: null })
      return
    }

    // Basic validation
    const errors: string[] = []
    if (username.length < 3) errors.push('Username must be at least 3 characters')
    if (username.length > 20) errors.push('Username must be less than 20 characters')
    if (!/^[a-zA-Z0-9-_]+$/.test(username)) errors.push('Username can only contain letters, numbers, hyphens, and underscores')
    if (username.startsWith('-') || username.endsWith('-')) errors.push('Username cannot start or end with a hyphen')

    if (errors.length > 0) {
      setValidationState({ isValid: false, isChecking: false, error: errors[0] })
      return
    }

    // Check availability
    if (isCheckingAvailability) {
      setValidationState({ isValid: false, isChecking: true, error: null })
      return
    }

    if (isAvailable === false) {
      setValidationState({ isValid: false, isChecking: false, error: 'Username is already taken' })
      return
    }

    if (isAvailable === true) {
      setValidationState({ isValid: true, isChecking: false, error: null })
      return
    }

  }, [username, isAvailable, isCheckingAvailability])

  return validationState
}
