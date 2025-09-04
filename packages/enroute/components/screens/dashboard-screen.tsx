"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Home, Edit, CheckCircle, XCircle, ArrowDownLeft, Wallet, TrendingUp, Shield, Clock } from "lucide-react"

interface DashboardScreenProps {
  userENS: string | null
}

export function DashboardScreen({ userENS }: DashboardScreenProps) {
  const [activeRules] = useState([
    {
      id: "1",
      name: "Main Split Policy",
      description: "70% → main.alice.enroute.eth, 30% → savings.alice.enroute.eth",
      status: "active",
      conditions: ["Accept USDC, USDT, DAI", "Minimum amount: 5 USD"],
      lastTriggered: "2 hours ago",
      totalProcessed: "1,250 USDC",
    },
    {
      id: "2",
      name: "Reject Small Payments",
      description: "Reject payments < $5",
      status: "active",
      conditions: ["All tokens", "Amount < 5 USD"],
      lastTriggered: "1 day ago",
      totalProcessed: "15 rejections",
    },
    {
      id: "3",
      name: "Weekend Routing",
      description: "100% → savings.alice.enroute.eth on weekends",
      status: "inactive",
      conditions: ["Saturday-Sunday", "All accepted tokens"],
      lastTriggered: "Never",
      totalProcessed: "0 USDC",
    },
  ])

  const [recentActivity] = useState([
    {
      id: "1",
      type: "received",
      amount: "50 USDC",
      from: "bob.eth",
      timestamp: "2 hours ago",
      routing: "35 USDC → main, 15 USDC → savings",
      status: "completed",
    },
    {
      id: "2",
      type: "rejected",
      amount: "2 DAI",
      from: "charlie.eth",
      timestamp: "1 day ago",
      reason: "Below minimum threshold",
      status: "rejected",
    },
    {
      id: "3",
      type: "received",
      amount: "100 USDT",
      from: "dao.treasury.eth",
      timestamp: "2 days ago",
      routing: "70 USDT → main, 30 USDT → savings",
      status: "completed",
    },
  ])

  const stats = {
    totalReceived: "1,250 USDC",
    totalRejected: "15",
    activeRules: activeRules.filter((r) => r.status === "active").length,
    successRate: "98.8%",
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Home className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ENS Dashboard</h1>
            <p className="text-gray-400">Monitor your programmable payment policies</p>
          </div>
        </div>

        {userENS && (
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-transparent">
                    Your ENS
                  </Badge>
                  <span className="font-mono font-bold text-xl text-white">{userENS}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Total Received</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{stats.totalReceived}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{stats.successRate}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Active Rules</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{stats.activeRules}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-400">Rejected</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{stats.totalRejected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Rules */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-emerald-500" />
              Active Routing Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRules.map((rule) => (
              <Card key={rule.id} className="border-gray-700 bg-gray-800/50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{rule.name}</h4>
                      <Badge
                        variant={rule.status === "active" ? "default" : "secondary"}
                        className={rule.status === "active" ? "bg-emerald-500 text-black" : "bg-gray-600 text-gray-300"}
                      >
                        {rule.status === "active" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {rule.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-400">{rule.description}</p>

                    <div className="space-y-1">
                      {rule.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                          <span className="text-gray-400">{condition}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last: {rule.lastTriggered}</span>
                      </div>
                      <span>Processed: {rule.totalProcessed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage Rules
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <Card key={activity.id} className="border-gray-700 bg-gray-800/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activity.type === "received" ? (
                          <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className="font-medium text-white">{activity.amount}</span>
                        <span className="text-sm text-gray-400">from {activity.from}</span>
                      </div>
                      <Badge
                        variant={activity.status === "completed" ? "default" : "destructive"}
                        className={
                          activity.status === "completed" ? "bg-emerald-500 text-black" : "bg-red-600 text-white"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>

                    {activity.routing && <p className="text-sm text-gray-400">{activity.routing}</p>}

                    {activity.reason && <p className="text-sm text-red-400">{activity.reason}</p>}

                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
            >
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
