"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface RegistrationTroubleshootingProps {
  onRetry: () => void
}

export function RegistrationTroubleshooting({ onRetry }: RegistrationTroubleshootingProps) {
  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="text-yellow-400 text-lg">Having Trouble?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <Alert className="border-blue-500/20 bg-blue-500/10">
            <AlertDescription className="text-blue-300">
              <strong>Common Solutions:</strong>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2 text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              <span>Make sure to <strong>approve</strong> the transaction in your wallet (MetaMask, etc.)</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              <span>Check that you're connected to <strong>Base Sepolia</strong> network</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              <span>Ensure your username is <strong>3-20 characters</strong>, letters and numbers only</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              <span>Try a <strong>different username</strong> if yours might be taken</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">5.</span>
              <span>Make sure you have some <strong>ETH for gas fees</strong> on Base Sepolia</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={onRetry}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => window.open('https://docs.base.org/using-base', '_blank')}
          >
            Get Help
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
