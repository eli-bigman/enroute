"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Store, Search, Eye, GitFork, Users, Building, Heart, PiggyBank, Shield, Trophy, Star } from "lucide-react"

interface MarketplaceScreenProps {
  userENS: string | null
  onScreenChange: (screen: string) => void
}

interface PolicyTemplate {
  id: string
  name: string
  category: string
  description: string
  icon: any
  popularity: number
  routing: Array<{ name: string; percentage: number; description: string }>
  conditions: string[]
  useCase: string
  author: string
  forks: number
}

export function MarketplaceScreen({ userENS, onScreenChange }: MarketplaceScreenProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null)

  const categories = [
    { id: "all", name: "All Templates", count: 12 },
    { id: "dao", name: "DAOs", count: 3 },
    { id: "community", name: "Communities", count: 2 },
    { id: "personal", name: "Personal", count: 4 },
    { id: "business", name: "Business", count: 3 },
  ]

  const templates: PolicyTemplate[] = [
    {
      id: "1",
      name: "DAO Treasury Split",
      category: "dao",
      description: "Automatically route treasury funds across operations, grants, and reserves",
      icon: Building,
      popularity: 95,
      routing: [
        { name: "ops", percentage: 50, description: "Operations wallet" },
        { name: "grants", percentage: 30, description: "Community grants" },
        { name: "reserves", percentage: 20, description: "Emergency reserves" },
      ],
      conditions: ["Accept USDC, USDT, DAI", "Minimum 100 USD", "Multisig required"],
      useCase: "Perfect for DAOs managing treasury inflows with automated allocation",
      author: "dao.collective.eth",
      forks: 234,
    },
    {
      id: "2",
      name: "Community Fund Router",
      category: "community",
      description: "Route membership dues with automatic community fund allocation",
      icon: Users,
      popularity: 87,
      routing: [
        { name: "main", percentage: 90, description: "Main community wallet" },
        { name: "fund", percentage: 10, description: "Community development fund" },
      ],
      conditions: ["Accept all stablecoins", "No minimum amount", "Public contributions"],
      useCase: "Ideal for communities collecting membership fees or donations",
      author: "builders.community.eth",
      forks: 156,
    },
    {
      id: "3",
      name: "Family Remittance",
      category: "personal",
      description: "Split incoming payments between family members automatically",
      icon: Heart,
      popularity: 92,
      routing: [
        { name: "parent", percentage: 60, description: "Parent wallet" },
        { name: "savings", percentage: 40, description: "Family savings" },
      ],
      conditions: ["Accept USDC, USDT", "Minimum 10 USD", "Family verification"],
      useCase: "Perfect for international remittances with automatic family splits",
      author: "family.support.eth",
      forks: 189,
    },
    {
      id: "4",
      name: "Auto Savings",
      category: "personal",
      description: "Automatically divert percentage of incoming payments to savings",
      icon: PiggyBank,
      popularity: 89,
      routing: [
        { name: "main", percentage: 80, description: "Main spending wallet" },
        { name: "savings", percentage: 20, description: "Automatic savings" },
      ],
      conditions: ["Accept all stablecoins", "No minimum", "Auto-compound enabled"],
      useCase: "Build savings habits with automatic allocation of incoming funds",
      author: "defi.saver.eth",
      forks: 312,
    },
    {
      id: "5",
      name: "Treasury Management",
      category: "business",
      description: "Reject non-stablecoins and auto-sweep to multisig treasury",
      icon: Shield,
      popularity: 84,
      routing: [{ name: "treasury", percentage: 100, description: "Multisig treasury wallet" }],
      conditions: ["Only USDC, USDT, DAI", "Minimum 50 USD", "Multisig sweep"],
      useCase: "Enterprise-grade treasury management with strict token policies",
      author: "enterprise.treasury.eth",
      forks: 98,
    },
    {
      id: "6",
      name: "Hackathon Prize Pool",
      category: "dao",
      description: "Auto-route hackathon prizes between core team and community fund",
      icon: Trophy,
      popularity: 78,
      routing: [
        { name: "core", percentage: 70, description: "Core team allocation" },
        { name: "community", percentage: 30, description: "Community fund" },
      ],
      conditions: ["Accept ETH, USDC", "Event-based triggers", "Time-locked releases"],
      useCase: "Manage hackathon and event prize distributions automatically",
      author: "hackathon.dao.eth",
      forks: 67,
    },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesSearch =
      searchTerm === "" ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.useCase.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleForkTemplate = (template: PolicyTemplate) => {
    // In a real app, this would pre-fill the policy builder with the template
    alert(
      `Forking "${template.name}" to ${userENS || "your ENS"}. This would open the Policy Builder with pre-filled data.`,
    )
    onScreenChange("policy-builder")
  }

  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-black p-4 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="text-white hover:bg-gray-800">
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Policy Preview</h1>
              <p className="text-gray-400">Review template details before forking</p>
            </div>
          </div>

          {/* Template Details */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <selectedTemplate.icon className="h-6 w-6 text-black" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl text-white">{selectedTemplate.name}</CardTitle>
                  <p className="text-gray-400">{selectedTemplate.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                    <span className="font-medium text-white">{selectedTemplate.popularity}%</span>
                  </div>
                  <p className="text-xs text-gray-400">{selectedTemplate.forks} forks</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Routing Configuration */}
              <div className="space-y-3">
                <h3 className="font-medium text-white">Routing Configuration</h3>
                <div className="space-y-2">
                  {selectedTemplate.routing.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white">
                          {route.name}.{userENS || "your.enroute.eth"}
                        </p>
                        <p className="text-sm text-gray-400">{route.description}</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                        {route.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-800" />

              {/* Conditions */}
              <div className="space-y-3">
                <h3 className="font-medium text-white">Policy Conditions</h3>
                <div className="space-y-1">
                  {selectedTemplate.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                      <span className="text-gray-400">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-800" />

              {/* Use Case */}
              <div className="space-y-2">
                <h3 className="font-medium text-white">Use Case</h3>
                <p className="text-sm text-gray-400">{selectedTemplate.useCase}</p>
              </div>

              <Separator className="bg-gray-800" />

              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Created by</p>
                  <p className="font-mono font-medium text-white">{selectedTemplate.author}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  {selectedTemplate.category}
                </Badge>
              </div>

              {/* Fork Button */}
              <Button
                onClick={() => handleForkTemplate(selectedTemplate)}
                className="w-full h-12 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-black"
                disabled={!userENS}
              >
                <GitFork className="h-5 w-5 mr-2" />
                Fork to {userENS || "Your ENS"}
              </Button>

              {!userENS && (
                <p className="text-center text-sm text-gray-400">Connect your wallet to fork this template</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Store className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Community Policy Templates</h1>
            <p className="text-gray-400">Discover and fork proven payment routing strategies</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates by name, description, or use case..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? "bg-emerald-500 text-black hover:bg-emerald-600"
                    : "bg-transparent border-gray-700 text-white hover:bg-gray-800"
                }
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = template.icon
          return (
            <Card
              key={template.id}
              className="bg-gray-900/50 border-gray-800 hover:border-emerald-500/30 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                        {template.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                        <span className="text-xs text-gray-400">{template.popularity}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">{template.description}</p>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Routing Split:</h4>
                  <div className="space-y-1">
                    {template.routing.slice(0, 2).map((route, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{route.name}</span>
                        <span className="font-medium text-white">{route.percentage}%</span>
                      </div>
                    ))}
                    {template.routing.length > 2 && (
                      <p className="text-xs text-gray-400">+{template.routing.length - 2} more...</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{template.forks} forks</span>
                  <span>by {template.author.split(".")[0]}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleForkTemplate(template)}
                    disabled={!userENS}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black"
                  >
                    <GitFork className="h-4 w-4 mr-1" />
                    Fork
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium mb-2 text-white">No templates found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search criteria or browse different categories</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
