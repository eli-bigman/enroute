"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Wallet,
  Globe,
  Moon,
  Sun,
  Shield,
  Fingerprint,
  Key,
  LogOut,
  ExternalLink,
  Bell,
  HelpCircle,
  Info,
} from "lucide-react"

interface SettingsScreenProps {
  onDisconnect: () => void
}

export function SettingsScreen({ onDisconnect }: SettingsScreenProps) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [biometricAuth, setBiometricAuth] = useState(false)
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "tw", name: "Twi", native: "Twi" },
    { code: "ga", name: "Ga", native: "Ga" },
    { code: "ee", name: "Ewe", native: "Eʋegbe" },
  ]

  const handleDisconnect = () => {
    if (
      confirm("Are you sure you want to disconnect your wallet? You'll need to reconnect to access your ENS policies.")
    ) {
      onDisconnect()
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Manage your EnRoute preferences and security</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Wallet Connection */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-black" />
                </div>
                <div>
                  <p className="font-medium text-white">MetaMask</p>
                  <p className="text-sm text-gray-400">0x742d...3b8D4</p>
                </div>
              </div>
              <Badge className="bg-emerald-500 text-black hover:bg-emerald-600">Connected</Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Etherscan
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} className="flex-1 bg-red-600 hover:bg-red-700">
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ENS Management */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5" />
              ENS Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div>
                <p className="font-medium font-mono text-white">alice.enroute.eth</p>
                <p className="text-sm text-gray-400">Primary ENS for routing policies</p>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                Active
              </Badge>
            </div>

            <Button variant="outline" className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800">
              Change Linked ENS
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Dark Mode</p>
                <p className="text-sm text-gray-400">Toggle between light and dark themes</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {languages.map((language) => (
                <Button
                  key={language.code}
                  variant={selectedLanguage === language.code ? "default" : "outline"}
                  className={`justify-start ${
                    selectedLanguage === language.code
                      ? "bg-emerald-500 text-black hover:bg-emerald-600"
                      : "bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedLanguage(language.code)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{language.name}</span>
                    <span
                      className={`text-sm ${selectedLanguage === language.code ? "text-black/70" : "text-gray-400"}`}
                    >
                      {language.native}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-white">Biometric Authentication</p>
                  <p className="text-sm text-gray-400">Use fingerprint or face ID for quick access</p>
                </div>
              </div>
              <Switch checked={biometricAuth} onCheckedChange={setBiometricAuth} />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-400">Add extra security to your account</p>
                </div>
              </div>
              <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-white">Transaction Notifications</p>
                  <p className="text-sm text-gray-400">Get notified of incoming payments</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-white">Auto Policy Backup</p>
                  <p className="text-sm text-gray-400">Automatically backup your routing policies</p>
                </div>
              </div>
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>
          </CardContent>
        </Card>

        {/* Support & Information */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <HelpCircle className="h-5 w-5" />
              Support & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Center
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <Info className="h-4 w-4 mr-2" />
              About EnRoute
            </Button>

            <Separator className="bg-gray-800" />

            <div className="text-center space-y-2 pt-2">
              <p className="text-sm text-gray-400">EnRoute v1.0.0</p>
              <p className="text-xs text-gray-500">Built with Web3 • ENS • Ghanaian Futurism</p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <button className="hover:text-emerald-500 transition-colors">Privacy Policy</button>
                <button className="hover:text-emerald-500 transition-colors">Terms of Service</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
