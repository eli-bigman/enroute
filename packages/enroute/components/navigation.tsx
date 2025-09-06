"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Home, Settings, Wallet, FileText, Send, History, Store, Menu, X } from "lucide-react"

interface NavigationProps {
  currentScreen: string
  onScreenChange: (screen: string) => void
}

export function Navigation({ currentScreen, onScreenChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { id: "connect", label: "Connect", icon: Wallet },
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "policy-builder", label: "Policy Builder", icon: FileText },
    { id: "send", label: "Send", icon: Send },
    { id: "marketplace", label: "Marketplace", icon: Store },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="/enroute-logo.svg" 
                alt="EnRoute" 
                className="w-full h-full"
              />
            </div>
            <span className="font-bold text-lg text-white">EnRoute</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:bg-gray-900"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-sm">
          <div className="pt-20 p-4">
            <Card className="p-4 bg-gray-900/50 border-gray-800">
              <div className="grid gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`justify-start gap-3 h-12 text-white hover:bg-gray-800 ${
                        currentScreen === item.id ? "bg-emerald-500 text-black hover:bg-emerald-600" : ""
                      }`}
                      onClick={() => {
                        onScreenChange(item.id)
                        setIsMenuOpen(false)
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-black border-r border-gray-800 flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/enroute-logo.svg" 
                alt="EnRoute" 
                className="w-full h-full"
              />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">EnRoute</h1>
              <p className="text-sm text-gray-400">Distributed Payment with ENS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 text-white hover:bg-gray-900 ${
                    currentScreen === item.id ? "bg-emerald-500 text-black hover:bg-emerald-600" : ""
                  }`}
                  onClick={() => onScreenChange(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
        <div className="flex items-center justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={`flex-col gap-1 h-auto py-2 px-3 text-white hover:bg-gray-900 ${
                  currentScreen === item.id ? "bg-emerald-500 text-black hover:bg-emerald-600" : ""
                }`}
                onClick={() => onScreenChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
