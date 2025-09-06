"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Sparkles, Zap, Rocket } from 'lucide-react'

interface AccountCreationCountdownProps {
  onComplete: () => void
}

const wittyMessages = [
  "🔮 Summoning your digital identity from the blockchain ether...",
  "⚡ Teaching smart contracts your name (they're slow learners)...",
  "🚀 Launching your ENS rocket into the decentralized stratosphere...",
  "✨ Convincing validators that you're worth the gas fees...",
  "🎭 Your address is getting a makeover from 0x123... to human-readable...",
  "🔐 Encrypting your awesomeness into immutable blockchain glory...",
  "🌟 Base L2 is rolling out the red carpet for your arrival...",
  "🎪 The smart contracts are having a party to celebrate you..."
]

export function AccountCreationCountdown({ onComplete }: AccountCreationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsVisible(false)
      setTimeout(onComplete, 500) // Small delay for smooth transition
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, onComplete])

  useEffect(() => {
    // Change message every 4 seconds
    const messageTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % wittyMessages.length)
    }, 4000)

    return () => clearInterval(messageTimer)
  }, [])

  if (!isVisible) return null

  const progress = ((30 - timeLeft) / 30) * 100

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-emerald-500/20 bg-gray-900/95 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Main Icon */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center relative overflow-hidden">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent animate-pulse" />
            </div>
            <Sparkles className="w-6 h-6 text-emerald-300 absolute -top-2 -right-2 animate-bounce" />
            <Zap className="w-4 h-4 text-emerald-400 absolute -bottom-1 -left-1 animate-pulse" />
          </div>

          {/* Countdown Display */}
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-emerald-400 tabular-nums">
              {timeLeft}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">
              seconds remaining
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-1000 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(progress)}% complete
            </div>
          </div>

          {/* Witty Message */}
          <div className="min-h-[60px] flex items-center justify-center">
            <p className="text-gray-300 text-sm leading-relaxed animate-fade-in key={currentMessageIndex}">
              {wittyMessages[currentMessageIndex]}
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-2 opacity-60">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
            <Rocket className="w-3 h-3" />
            <span>Creating your EnRoute identity...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
