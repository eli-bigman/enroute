"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Navigation } from "@/components/navigation"
import { ConnectScreen } from "@/components/screens/connect-screen"
import { PolicyBuilderScreen } from "@/components/screens/policy-builder-screen"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { SendScreen } from "@/components/screens/send-screen"
import { TransactionsScreen } from "@/components/screens/transactions-screen"
import { MarketplaceScreen } from "@/components/screens/marketplace-screen"
import { SettingsScreen } from "@/components/screens/settings-screen"

export default function EnRouteApp() {
  const [currentScreen, setCurrentScreen] = useState("connect")
  const [username, setUsername] = useState<string>("")
  const [userENS, setUserENS] = useState<string | null>(null)
  const { address, isConnected } = useAccount()

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setUsername("")
      setUserENS(null)
      setCurrentScreen("connect")
    }
  }, [isConnected])

  const handleWalletConnect = (enteredUsername: string) => {
    setUsername(enteredUsername)
    setUserENS(`${enteredUsername}.enrouteapp.eth`)
    setCurrentScreen("dashboard")
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "connect":
        return (
          <ConnectScreen
            onConnect={handleWalletConnect}
            isConnected={isConnected}
            address={address}
          />
        )
      case "policy-builder":
        return <PolicyBuilderScreen userENS={userENS} />
      case "dashboard":
        return <DashboardScreen userENS={userENS} />
      case "send":
        return <SendScreen />
      case "transactions":
        return <TransactionsScreen userENS={userENS} />
      case "marketplace":
        return <MarketplaceScreen userENS={userENS} onScreenChange={setCurrentScreen} />
      case "settings":
        return (
          <SettingsScreen
            onDisconnect={() => {
              setUsername("")
              setUserENS(null)
              setCurrentScreen("connect")
            }}
          />
        )
      default:
        return (
          <ConnectScreen
            onConnect={handleWalletConnect}
            isConnected={isConnected}
            address={address}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />

      {/* Main Content */}
      <div className="md:ml-64 pb-20 md:pb-0 pt-16 md:pt-0">{renderScreen()}</div>
    </div>
  )
}
