'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Circle,
  ChevronRight,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAIN_POINTS_DATA, PainPoint } from '@/lib/pain-points-data'
import { useInitiativeStore, Initiative } from '@/lib/store'

const OWNERS = [...new Set(PAIN_POINTS_DATA.map(p => p.owner))]

// Status configuration
const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    color: 'bg-slate-500',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: Circle,
  },
  planning: {
    label: 'Planning',
    color: 'bg-[#015a84]',
    textColor: 'text-[#015a84] dark:text-[#4da6c9]',
    bgColor: 'bg-[#015a84]/10 dark:bg-[#015a84]/20',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-[#F7941D]',
    textColor: 'text-[#F7941D] dark:text-[#F7941D]',
    bgColor: 'bg-[#F7941D]/10 dark:bg-[#F7941D]/20',
    icon: PlayCircle,
  },
  completed: {
    label: 'Completed',
    color: 'bg-[#2f855a]',
    textColor: 'text-[#2f855a] dark:text-[#68d391]',
    bgColor: 'bg-[#2f855a]/10 dark:bg-[#2f855a]/20',
    icon: CheckCircle2,
  },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface OwnerStats {
  total: number
  notStarted: number
  planning: number
  inProgress: number
  completed: number
  avgProgress: number
  p0Count: number
  upcomingDeadlines: number
}

function OwnerCard({ 
  owner, 
  initiatives, 
  painPoints,
  isSelected,
  onClick 
}: { 
  owner: string
  initiatives: Initiative[]
  painPoints: PainPoint[]
  isSelected: boolean
  onClick: () => void
}) {
  const stats: OwnerStats = useMemo(() => {
    const ownerInitiatives = initiatives.filter(i => {
      const pp = painPoints.find(p => p.id === i.painPointId)
      return pp?.owner === owner || i.owner === owner
    })

    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return {
      total: ownerInitiatives.length,
      notStarted: ownerInitiatives.filter(i => i.status === 'not_started').length,
      planning: ownerInitiatives.filter(i => i.status === 'planning').length,
      inProgress: ownerInitiatives.filter(i => i.status === 'in_progress').length,
      completed: ownerInitiatives.filter(i => i.status === 'completed').length,
      avgProgress: ownerInitiatives.length > 0 
        ? Math.round(ownerInitiatives.reduce((sum, i) => sum + i.progress, 0) / ownerInitiatives.length)
        : 0,
      p0Count: painPoints.filter(p => p.owner === owner && p.priority === 'P0').length,
      upcomingDeadlines: ownerInitiatives.filter(i => 
        i.targetDate && 
        new Date(i.targetDate) <= nextWeek && 
        i.status !== 'completed'
      ).length,
    }
  }, [owner, initiatives, painPoints])

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200',
          isSelected 
            ? 'ring-2 ring-[#015a84] shadow-lg' 
            : 'hover:shadow-md'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border-2 border-[#015a84]/20">
              <AvatarFallback className="bg-[#015a84]/10 text-[#015a84] font-semibold">
                {getInitials(owner)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{owner}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {stats.total} initiatives
                </span>
                {stats.p0Count > 0 && (
                  <Badge className="bg-[#F7941D] text-white text-[10px] px-1.5 py-0">
                    {stats.p0Count} P0
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={stats.avgProgress} className="h-1.5 flex-1" />
                <span className="text-xs font-medium tabular-nums w-8">
                  {stats.avgProgress}%
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                {stats.completed > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-[#2f855a]">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {stats.completed}
                  </Badge>
                )}
                {stats.inProgress > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-[#F7941D]">
                    <PlayCircle className="h-2.5 w-2.5" />
                    {stats.inProgress}
                  </Badge>
                )}
                {stats.upcomingDeadlines > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-red-500">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {stats.upcomingDeadlines}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className={cn(
              'h-5 w-5 text-muted-foreground transition-transform',
              isSelected && 'rotate-90 text-[#015a84]'
            )} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function InitiativeItem({ 
  initiative, 
  painPoint 
}: { 
  initiative: Initiative
  painPoint: PainPoint 
}) {
  const statusConfig = STATUS_CONFIG[initiative.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      initiative.status === 'completed' && 'opacity-60',
      painPoint.priority === 'P0' && 'border-l-4 border-l-[#F7941D]'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs',
            painPoint.priority === 'P0' 
              ? 'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] text-white' 
              : 'bg-muted text-muted-foreground'
          )}>
            {painPoint.id}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-sm leading-tight truncate">
              {painPoint.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {painPoint.category}
              </Badge>
              <Badge className={cn(
                'text-[10px] px-1.5 py-0 gap-1',
                statusConfig.bgColor,
                statusConfig.textColor
              )}>
                <StatusIcon className="h-2.5 w-2.5" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold">{initiative.progress}%</div>
          {initiative.targetDate && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(initiative.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <Progress value={initiative.progress} className="h-1.5" />
      </div>
      {initiative.actionItems.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {initiative.actionItems.filter(a => a.completed).length}/{initiative.actionItems.length} action items completed
        </div>
      )}
    </div>
  )
}

export function OwnerDashboard() {
  const { initiatives, fetchInitiatives, isLoading } = useInitiativeStore()
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchInitiatives()
  }, [fetchInitiatives])

  const ownerInitiatives = useMemo(() => {
    if (!selectedOwner) return []
    return initiatives.filter(i => {
      const pp = PAIN_POINTS_DATA.find(p => p.id === i.painPointId)
      return pp?.owner === selectedOwner || i.owner === selectedOwner
    })
  }, [selectedOwner, initiatives])

  const ownerStats = useMemo(() => {
    if (!selectedOwner || ownerInitiatives.length === 0) return null

    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return {
      total: ownerInitiatives.length,
      avgProgress: Math.round(
        ownerInitiatives.reduce((sum, i) => sum + i.progress, 0) / ownerInitiatives.length
      ),
      completed: ownerInitiatives.filter(i => i.status === 'completed').length,
      inProgress: ownerInitiatives.filter(i => i.status === 'in_progress').length,
      planning: ownerInitiatives.filter(i => i.status === 'planning').length,
      notStarted: ownerInitiatives.filter(i => i.status === 'not_started').length,
      totalActions: ownerInitiatives.reduce((sum, i) => sum + i.actionItems.length, 0),
      completedActions: ownerInitiatives.reduce(
        (sum, i) => sum + i.actionItems.filter(a => a.completed).length, 
        0
      ),
      upcomingDeadlines: ownerInitiatives.filter(i => 
        i.targetDate && 
        new Date(i.targetDate) <= nextWeek && 
        i.status !== 'completed'
      ),
    }
  }, [selectedOwner, ownerInitiatives])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Owner Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-[#015a84]" />
            Owner Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            View initiative progress by owner
          </p>
        </div>
        <Select value={selectedOwner || ''} onValueChange={setSelectedOwner}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select an owner" />
          </SelectTrigger>
          <SelectContent>
            {OWNERS.map(owner => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Owner Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {OWNERS.map(owner => (
          <OwnerCard
            key={owner}
            owner={owner}
            initiatives={initiatives}
            painPoints={PAIN_POINTS_DATA}
            isSelected={selectedOwner === owner}
            onClick={() => setSelectedOwner(selectedOwner === owner ? null : owner)}
          />
        ))}
      </div>

      {/* Selected Owner Details */}
      <AnimatePresence mode="wait">
        {selectedOwner && ownerStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-[#015a84] to-[#1E3A4F] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-white/80 mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Avg Progress</span>
                  </div>
                  <div className="text-3xl font-bold">{ownerStats.avgProgress}%</div>
                  <Progress value={ownerStats.avgProgress} className="h-1.5 mt-2 bg-white/20" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Initiatives</span>
                  </div>
                  <div className="text-3xl font-bold">{ownerStats.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ownerStats.completed} completed, {ownerStats.inProgress} active
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#2f855a]" />
                    <span className="text-xs font-medium uppercase tracking-wider">Action Items</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {ownerStats.completedActions}/{ownerStats.totalActions}
                  </div>
                  <Progress 
                    value={ownerStats.totalActions > 0 ? (ownerStats.completedActions / ownerStats.totalActions) * 100 : 0} 
                    className="h-1.5 mt-2" 
                  />
                </CardContent>
              </Card>

              <Card className={ownerStats.upcomingDeadlines.length > 0 ? 'border-[#F7941D]' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlertTriangle className={cn(
                      'h-4 w-4',
                      ownerStats.upcomingDeadlines.length > 0 && 'text-[#F7941D]'
                    )} />
                    <span className="text-xs font-medium uppercase tracking-wider">Due This Week</span>
                  </div>
                  <div className={cn(
                    'text-3xl font-bold',
                    ownerStats.upcomingDeadlines.length > 0 && 'text-[#F7941D]'
                  )}>
                    {ownerStats.upcomingDeadlines.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ownerStats.upcomingDeadlines.length > 0 ? 'Needs attention' : 'All on track'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Initiatives List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-[#015a84]/20">
                    <AvatarFallback className="bg-[#015a84]/10 text-[#015a84] text-xs font-semibold">
                      {getInitials(selectedOwner)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedOwner}&apos;s Initiatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {ownerInitiatives
                      .sort((a, b) => {
                        // Sort by status (in_progress first), then by priority
                        const statusOrder = ['in_progress', 'planning', 'not_started', 'completed']
                        const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
                        if (statusDiff !== 0) return statusDiff
                        
                        const ppA = PAIN_POINTS_DATA.find(p => p.id === a.painPointId)
                        const ppB = PAIN_POINTS_DATA.find(p => p.id === b.painPointId)
                        const priorityOrder = { P0: 0, P1: 1, P2: 2 }
                        return (priorityOrder[ppA?.priority || 'P2'] || 2) - (priorityOrder[ppB?.priority || 'P2'] || 2)
                      })
                      .map(initiative => {
                        const painPoint = PAIN_POINTS_DATA.find(p => p.id === initiative.painPointId)
                        if (!painPoint) return null
                        return (
                          <InitiativeItem
                            key={initiative.id}
                            initiative={initiative}
                            painPoint={painPoint}
                          />
                        )
                      })}
                    {ownerInitiatives.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No initiatives found for this owner.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedOwner && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select an Owner</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click on an owner card above or use the dropdown to view their initiative details, 
              progress metrics, and upcoming deadlines.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
