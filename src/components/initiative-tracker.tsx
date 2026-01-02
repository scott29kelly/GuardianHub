'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useInitiativeStore, Initiative } from '@/lib/store'
import { PAIN_POINTS_DATA, getPainPointById } from '@/lib/pain-points-data'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CalendarIcon,
  MessageSquare,
  Target,
  Users,
  Zap,
  TrendingUp,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Initiative Card Component
function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const painPoint = getPainPointById(initiative.painPointId)
  const { updateInitiative, toggleActionItem, addComment } = useInitiativeStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!painPoint) return null

  const statusConfig = STATUS_CONFIG[initiative.status as keyof typeof STATUS_CONFIG]
  const StatusIcon = statusConfig.icon

  const handleStatusChange = async (newStatus: string) => {
    await updateInitiative(initiative.painPointId, { 
      status: newStatus as Initiative['status'],
      ...(newStatus === 'in_progress' && !initiative.startDate ? { startDate: new Date().toISOString() } : {}),
    })
  }

  const handleActionToggle = async (actionId: string, completed: boolean) => {
    await toggleActionItem(initiative.painPointId, actionId, completed)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    await addComment(initiative.painPointId, 'User', newComment)
    setNewComment('')
    setIsSubmitting(false)
  }

  const completedActions = initiative.actionItems.filter(a => a.completed).length
  const totalActions = initiative.actionItems.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'overflow-hidden transition-all duration-300',
        initiative.status === 'completed' && 'opacity-75',
        painPoint.priority === 'P0' && 'border-l-4 border-l-[#F7941D]'
      )}>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left: ID + Title */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-sm',
                painPoint.priority === 'P0' 
                  ? 'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] text-white shadow' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {painPoint.id}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight truncate">
                  {painPoint.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-xs">
                    {painPoint.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {initiative.owner || painPoint.owner}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status + Progress */}
            <div className="flex flex-col items-end gap-2">
              <Select value={initiative.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={cn(
                  'w-[140px] h-8 text-xs font-medium',
                  statusConfig.bgColor,
                  statusConfig.textColor
                )}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">
                    <span className="flex items-center gap-2">
                      <Circle className="h-3.5 w-3.5" /> Not Started
                    </span>
                  </SelectItem>
                  <SelectItem value="planning">
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> Planning
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="flex items-center gap-2">
                      <PlayCircle className="h-3.5 w-3.5" /> In Progress
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 w-[140px]">
                <Progress value={initiative.progress} className="h-1.5 flex-1" />
                <span className="text-xs font-medium tabular-nums w-8 text-right">
                  {initiative.progress}%
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Expandable Content */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                'w-full h-12 rounded-none border-t flex items-center justify-between px-4 group transition-all',
                isExpanded 
                  ? 'bg-[#015a84]/10 hover:bg-[#015a84]/15 dark:bg-[#015a84]/20' 
                  : 'bg-muted/30 hover:bg-[#015a84]/10'
              )}
            >
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {completedActions}/{totalActions} action items • {initiative.comments.length} comments
              </span>
              <div className={cn(
                'flex items-center gap-2 text-xs font-medium transition-all',
                isExpanded ? 'text-[#015a84] dark:text-[#4da6c9]' : 'text-[#F7941D]'
              )}>
                <span className="hidden sm:inline">
                  {isExpanded ? 'Collapse' : 'Expand details'}
                </span>
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full transition-all',
                  isExpanded 
                    ? 'bg-[#015a84] text-white rotate-180' 
                    : 'bg-[#F7941D] text-white group-hover:scale-110'
                )}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 space-y-4">
              {/* Action Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Target className="h-3.5 w-3.5" />
                  Action Items
                </h4>
                <div className="space-y-1">
                  {initiative.actionItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-start gap-3 p-2.5 rounded-lg transition-colors',
                        item.completed ? 'bg-[#2f855a]/10 dark:bg-[#2f855a]/20' : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => handleActionToggle(item.id, !!checked)}
                        className="mt-0.5"
                      />
                      <span className={cn(
                        'text-sm leading-relaxed flex-1',
                        item.completed && 'line-through text-muted-foreground'
                      )}>
                        {item.title}
                      </span>
                      {item.completed && item.completedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(item.completedAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {initiative.startDate 
                          ? format(new Date(initiative.startDate), 'MMM d, yyyy')
                          : 'Set date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={initiative.startDate ? new Date(initiative.startDate) : undefined}
                        onSelect={(date) => date && updateInitiative(initiative.painPointId, { 
                          startDate: date.toISOString() 
                        })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Target Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {initiative.targetDate 
                          ? format(new Date(initiative.targetDate), 'MMM d, yyyy')
                          : 'Set date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={initiative.targetDate ? new Date(initiative.targetDate) : undefined}
                        onSelect={(date) => date && updateInitiative(initiative.painPointId, { 
                          targetDate: date.toISOString() 
                        })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Notes & Blockers
                </label>
                <Textarea
                  placeholder="Add notes, blockers, or context..."
                  value={initiative.notes || ''}
                  onChange={(e) => updateInitiative(initiative.painPointId, { notes: e.target.value })}
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments ({initiative.comments.length})
                </h4>
                
                {initiative.comments.length > 0 && (
                  <ScrollArea className="max-h-[120px]">
                    <div className="space-y-2 pr-3">
                      {initiative.comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{comment.author}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Add comment */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                    className="h-8 text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddComment} 
                    disabled={isSubmitting || !newComment.trim()}
                    className="h-8 px-3"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}

// Summary Stats Component
function TrackerStats({ initiatives }: { initiatives: Initiative[] }) {
  const stats = {
    total: initiatives.length,
    notStarted: initiatives.filter(i => i.status === 'not_started').length,
    planning: initiatives.filter(i => i.status === 'planning').length,
    inProgress: initiatives.filter(i => i.status === 'in_progress').length,
    completed: initiatives.filter(i => i.status === 'completed').length,
    avgProgress: Math.round(initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length),
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Circle className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Not Started</span>
        </div>
        <div className="text-2xl font-bold">{stats.notStarted}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-[#015a84] dark:text-[#4da6c9] mb-1">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Planning</span>
        </div>
        <div className="text-2xl font-bold">{stats.planning}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-[#F7941D] dark:text-[#F7941D] mb-1">
          <PlayCircle className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
        </div>
        <div className="text-2xl font-bold">{stats.inProgress}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-[#2f855a] dark:text-[#68d391] mb-1">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
        </div>
        <div className="text-2xl font-bold">{stats.completed}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Avg Progress</span>
        </div>
        <div className="text-2xl font-bold">{stats.avgProgress}%</div>
      </Card>
    </div>
  )
}

// Main Initiative Tracker Component
export function InitiativeTracker() {
  const { initiatives, isLoading, error, fetchInitiatives } = useInitiativeStore()
  const [filter, setFilter] = useState<'all' | Initiative['status']>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'progress' | 'status'>('priority')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchInitiatives()
  }, [fetchInitiatives])

  const filteredInitiatives = initiatives
    .filter(i => filter === 'all' || i.status === filter)
    .sort((a, b) => {
      if (sortBy === 'priority') return a.painPointId - b.painPointId
      if (sortBy === 'progress') return b.progress - a.progress
      if (sortBy === 'status') {
        const statusOrder = ['in_progress', 'planning', 'not_started', 'completed']
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      }
      return 0
    })

  if (!mounted || (isLoading && initiatives.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#c53030]/30 bg-[#c53030]/5 dark:bg-[#c53030]/10 p-4 text-center">
        <AlertTriangle className="h-8 w-8 text-[#c53030] mx-auto mb-2" />
        <p className="text-sm text-[#c53030] dark:text-[#fc8181]">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchInitiatives} className="mt-3">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <TrackerStats initiatives={initiatives} />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all', 'not_started', 'planning', 'in_progress', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="h-8"
            >
              {status === 'all' ? 'All' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
            </Button>
          ))}
        </div>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[150px] h-8">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">By Priority</SelectItem>
            <SelectItem value="progress">By Progress</SelectItem>
            <SelectItem value="status">By Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Initiative Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredInitiatives.map((initiative) => (
            <InitiativeCard key={initiative.id} initiative={initiative} />
          ))}
        </AnimatePresence>
      </div>

      {filteredInitiatives.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No initiatives match the current filter.
        </div>
      )}
    </div>
  )
}
