"use client"

import { useAccount } from "wagmi"
import { useUserUsername, useUserNode } from "@/hooks/use-enroute-contracts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugRegistration() {
  const { address, isConnected } = useAccount()
  const { data: username, isLoading: usernameLoading, error: usernameError } = useUserUsername(address)
  const { data: userNode, isLoading: nodeLoading, error: nodeError } = useUserNode(address)

  if (!isConnected || !address) {
    return (
      <Card className="border-yellow-500 bg-yellow-500/10">
        <CardHeader>
          <CardTitle className="text-yellow-400">Debug: No Wallet Connected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-300">Please connect your wallet to debug registration status</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-500 bg-blue-500/10">
      <CardHeader>
        <CardTitle className="text-blue-400">Debug: Registration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <strong className="text-blue-300">Wallet Address:</strong>
          <p className="font-mono text-blue-200 break-all">{address}</p>
        </div>
        
        <div>
          <strong className="text-blue-300">Username Query:</strong>
          {usernameLoading ? (
            <p className="text-yellow-300">Loading...</p>
          ) : usernameError ? (
            <p className="text-red-300">Error: {usernameError.message}</p>
          ) : (
            <p className="text-green-300">
              Result: "{username}" (Length: {username ? username.length : 0})
            </p>
          )}
        </div>

        <div>
          <strong className="text-blue-300">User Node Query:</strong>
          {nodeLoading ? (
            <p className="text-yellow-300">Loading...</p>
          ) : nodeError ? (
            <p className="text-red-300">Error: {nodeError.message}</p>
          ) : (
            <p className="text-green-300 font-mono break-all">
              Result: {userNode || "null"}
            </p>
          )}
        </div>

        <div>
          <strong className="text-blue-300">Environment Check:</strong>
          <div className="space-y-1 text-xs">
            <p>Registry: {process.env.NEXT_PUBLIC_ENROUTE_REGISTRY_ADDRESS}</p>
            <p>Chain ID: {process.env.NEXT_PUBLIC_CHAIN_ID}</p>
            <p>RPC URL: {process.env.NEXT_PUBLIC_L2_RPC_URL}</p>
          </div>
        </div>

        <div>
          <strong className="text-blue-300">Registration Status:</strong>
          <div className="space-y-1">
            <p>Has Username: {username && username !== '' ? '✅' : '❌'}</p>
            <p>Has User Node: {userNode && userNode !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? '✅' : '❌'}</p>
            <p>Is Registered: {(username && username !== '' && userNode && userNode !== '0x0000000000000000000000000000000000000000000000000000000000000000') ? '✅' : '❌'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
