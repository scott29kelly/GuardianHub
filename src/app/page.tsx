'use client'

import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// New feature components
import { InitiativeTracker } from '@/components/initiative-tracker'
import { AIAssistantPanel, AIChat } from '@/components/ai-assistant'
import { EmailSubscriptionCard } from '@/components/email-subscription'
import { PDFExport } from '@/components/pdf-export'
import { OwnerDashboard } from '@/components/owner-dashboard'
import { DependencyMap } from '@/components/dependency-map'
import { PAIN_POINTS_DATA as CENTRAL_PAIN_POINTS, PainPoint as CentralPainPoint } from '@/lib/pain-points-data'
import { useChatStore, useInitiativeStore } from '@/lib/store'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  Pie,
  PieChart,
} from 'recharts'
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Search,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  ArrowRight,
  FileText,
  Lightbulb,
  TrendingDown,
  Play,
  XCircle,
  Layers,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  ListTodo,
  Bot,
  Sparkles,
  Link2,
  UserCircle,
  Mail,
} from 'lucide-react'

// ============================================================================
// DATA LAYER: Separated for scalability and API integration
// ============================================================================

const PAIN_POINTS_DATA = [
  {
    id: 1,
    name: 'Lead Intake → Inspection → Sale Handoffs',
    impact: 9,
    effort: 6,
    costType: 'Revenue',
    primaryCost: 'Lost Opportunities',
    solutionType: 'Automation',
    owner: 'Sales Ops Manager',
    quickWin: 'High',
    priority: 'P0',
    category: 'Sales',
    pain: 'Leads come from multiple sources (canvassing, referrals, storms, online). Inconsistent qualification and follow-up. Sales reps spend time chasing instead of selling.',
    whyCostly: 'Lost or delayed opportunities, Uneven close rates, Poor customer experience early on',
    solution: 'Centralized lead intake + qualification workflow, Clear ownership rules + automation triggers, AI-assisted lead scoring and routing',
    actionItems: [
      'Implement unified lead capture system',
      'Create automated qualification scoring',
      'Set up smart routing rules by territory/rep',
      'Build AI-powered lead scoring model'
    ],
    metrics: [
      { label: 'Lead Response Time', current: '>24 hours', target: '<15 minutes' },
      { label: 'Lead Conversion Rate', current: '25%', target: '35%' },
      { label: 'Handoff Time', current: '3-5 days', target: 'Same day' }
    ]
  },
  {
    id: 2,
    name: 'Sales Rep Performance',
    impact: 8,
    effort: 7,
    costType: 'Revenue',
    primaryCost: 'Revenue Volatility',
    solutionType: 'Standardization',
    owner: 'Sales Director',
    quickWin: 'Medium',
    priority: 'P1',
    category: 'Sales',
    pain: 'Top reps outperform dramatically, New or average reps struggle to ramp, Knowledge lives in people, not systems',
    whyCostly: 'Revenue volatility, High training and churn costs, You can\'t confidently scale',
    solution: 'Standardized sales playbooks (AI-searchable), Real-time coaching prompts and scripts, KPI-driven accountability dashboards',
    actionItems: [
      'Document top rep best practices',
      'Create role-based playbooks',
      'Implement real-time coaching tools',
      'Build performance dashboards'
    ],
    metrics: [
      { label: 'Rep Ramp-up Time', current: '90 days', target: '45 days' },
      { label: 'Top vs Bottom Gap', current: '4x', target: '1.5x' },
      { label: 'Training Adoption', current: '30%', target: '80%' }
    ]
  },
  {
    id: 3,
    name: 'Insurance Claim Process',
    impact: 7,
    effort: 8,
    costType: 'OpEx',
    primaryCost: 'Extended Cycle Times',
    solutionType: 'Process+Automation',
    owner: 'Claims Manager',
    quickWin: 'Medium',
    priority: 'P2',
    category: 'Claims',
    pain: 'Adjuster variability, Documentation inconsistencies, Homeowner confusion and anxiety',
    whyCostly: 'Extended cycle times, Underpaid claims, Sales and production friction',
    solution: 'Claim documentation SOPs + templates, Pre-adjuster prep workflows, Homeowner education automation (texts/videos)',
    actionItems: [
      'Standardize claim documentation templates',
      'Create pre-adjuster checklist',
      'Build homeowner communication workflows',
      'Implement claim tracking system'
    ],
    metrics: [
      { label: 'Claim Cycle Time', current: '45-60 days', target: '30 days' },
      { label: 'First Call Resolution', current: '60%', target: '85%' },
      { label: 'Claim Approval Rate', current: '70%', target: '85%' }
    ]
  },
  {
    id: 4,
    name: 'Production Handoffs',
    impact: 8,
    effort: 5,
    costType: 'OpEx',
    primaryCost: 'Rework & Delays',
    solutionType: 'Standardization',
    owner: 'Operations Manager',
    quickWin: 'High',
    priority: 'P1',
    category: 'Operations',
    pain: 'Missing measurements, scopes, or expectations, Production teams inherit problems they didn\'t create',
    whyCostly: 'Rework and delays, Internal conflict, Customer dissatisfaction',
    solution: 'Sales-to-Production Readiness Checklist, Digital handoff requirements (no exceptions), Automated rejection/feedback loop',
    actionItems: [
      'Create mandatory handoff checklist',
      'Implement digital handoff form',
      'Set up automated quality checks',
      'Build feedback loop system'
    ],
    metrics: [
      { label: 'Rework Rate', current: '25%', target: '<5%' },
      { label: 'Handoff Time', current: '2-3 days', target: '<4 hours' },
      { label: 'Complete Handoffs', current: '65%', target: '95%' }
    ]
  },
  {
    id: 5,
    name: 'Scheduling & Capacity',
    impact: 9,
    effort: 9,
    costType: 'OpEx',
    primaryCost: 'Idle Crews/Burnout',
    solutionType: 'Predictive Analytics',
    owner: 'Production Director',
    quickWin: 'Low',
    priority: 'P0',
    category: 'Operations',
    pain: 'Crews scheduled last-minute, Weather + material delays compound chaos, No clear view of future workload',
    whyCostly: 'Idle crews or burnout, Missed deadlines, Margin erosion',
    solution: 'Forecast-based scheduling, Capacity planning dashboards, Automated rescheduling logic tied to weather/materials',
    actionItems: [
      'Build capacity planning dashboard',
      'Integrate weather forecasting',
      'Implement predictive scheduling',
      'Create material tracking system'
    ],
    metrics: [
      { label: 'Crew Utilization', current: '65%', target: '85%' },
      { label: 'Schedule Lead Time', current: '2-3 days', target: '7-14 days' },
      { label: 'Weather Reschedule Rate', current: '15%', target: '<5%' }
    ]
  },
  {
    id: 6,
    name: 'Vendor & Crew Quality',
    impact: 7,
    effort: 6,
    costType: 'Quality',
    primaryCost: 'Callbacks/Warranty',
    solutionType: 'Performance Mgmt',
    owner: 'Vendor Manager',
    quickWin: 'Medium',
    priority: 'P1',
    category: 'Operations',
    pain: 'Quality varies by crew, Accountability is informal, Great crews aren\'t differentiated from average ones',
    whyCostly: 'Callbacks and warranty issues, Brand risk, Lost repeat/referral business',
    solution: 'Crew scorecards (quality, speed, callbacks), Preferred-vendor tiers, Performance-based assignment',
    actionItems: [
      'Implement crew scorecard system',
      'Create vendor tier structure',
      'Build performance tracking',
      'Link performance to assignment'
    ],
    metrics: [
      { label: 'Callback Rate', current: '12%', target: '<3%' },
      { label: 'Quality Score', current: '3.5/5', target: '4.5/5' },
      { label: 'Top Crew Retention', current: '60%', target: '90%' }
    ]
  },
  {
    id: 7,
    name: 'Homeowner Communication',
    impact: 6,
    effort: 4,
    costType: 'CX',
    primaryCost: 'High Inbound Volume',
    solutionType: 'Automation',
    owner: 'CX Manager',
    quickWin: 'High',
    priority: 'P2',
    category: 'Customer Experience',
    pain: 'Repetitive status update calls/texts, Customers feel "left in the dark", Staff spend time answering the same questions',
    whyCostly: 'Higher inbound volume, Lower satisfaction, Stress on team',
    solution: 'Automated status updates by project phase, Customer portal or SMS timeline, FAQ + expectation-setting automation',
    actionItems: [
      'Build automated status notifications',
      'Create customer portal',
      'Implement FAQ automation',
      'Set expectation-setting workflows'
    ],
    metrics: [
      { label: 'Inbound Call Volume', current: '8/day', target: '2/day' },
      { label: 'Customer Satisfaction', current: '3.8/5', target: '4.7/5' },
      { label: 'Auto-Response Rate', current: '20%', target: '80%' }
    ]
  },
  {
    id: 8,
    name: 'Data Fragmentation',
    impact: 9,
    effort: 10,
    costType: 'Data',
    primaryCost: 'Poor Decisions',
    solutionType: 'Centralization',
    owner: 'IT/BizOps',
    quickWin: 'Low',
    priority: 'P0',
    category: 'Technology',
    pain: 'CRM, spreadsheets, texts, emails, photos, Conflicting information, Reporting is slow or unreliable',
    whyCostly: 'Poor decisions, Time wasted reconciling data, Limited AI leverage',
    solution: 'Unified data architecture, Role-based dashboards, AI-readable operational data layer',
    actionItems: [
      'Design unified data model',
      'Build integration layer',
      'Create role-based dashboards',
      'Implement AI data pipeline'
    ],
    metrics: [
      { label: 'Data Sources', current: '10+', target: '2-3' },
      { label: 'Report Generation Time', current: '2-3 days', target: '<1 hour' },
      { label: 'Data Accuracy', current: '75%', target: '95%' }
    ]
  },
  {
    id: 9,
    name: 'Leadership Bottleneck',
    impact: 10,
    effort: 7,
    costType: 'Strategic',
    primaryCost: 'Bottlenecked Growth',
    solutionType: 'Delegation Framework',
    owner: 'CEO/COO',
    quickWin: 'High',
    priority: 'P0',
    category: 'Leadership',
    pain: 'You and key leaders solve daily fires, Strategic projects stall, Delegation is unclear or incomplete',
    whyCostly: 'Bottlenecked growth, Burnout, Missed opportunities',
    solution: 'Clear ownership by function, Decision frameworks (who decides what), AI copilots for leaders and managers',
    actionItems: [
      'Document decision authority matrix',
      'Create functional ownership chart',
      'Implement AI copilot tools',
      'Build delegation tracking'
    ],
    metrics: [
      { label: 'Leader Firefighting Time', current: '70%', target: '<20%' },
      { label: 'Strategic Project Velocity', current: 'Low', target: 'High' },
      { label: 'Decision Latency', current: '3-5 days', target: '<24 hours' }
    ]
  },
  {
    id: 10,
    name: 'Training & SOPs',
    impact: 8,
    effort: 6,
    costType: 'HR',
    primaryCost: 'Slower Ramp-up',
    solutionType: 'Knowledge System',
    owner: 'HR/Training Lead',
    quickWin: 'Medium',
    priority: 'P1',
    category: 'Operations',
    pain: 'Ask Bob culture, Inconsistent execution, Hard to onboard quickly',
    whyCostly: 'Slower ramp-up, Quality drift, Dependence on specific people',
    solution: 'Living SOP system (searchable, role-based), AI-powered internal knowledge assistant, Continuous improvement feedback loop',
    actionItems: [
      'Build living SOP platform',
      'Create role-based access',
      'Implement AI knowledge assistant',
      'Set up feedback loops'
    ],
    metrics: [
      { label: 'Onboarding Time', current: '60 days', target: '30 days' },
      { label: 'SOP Search Time', current: '15+ minutes', target: '<2 minutes' },
      { label: 'Process Adherence', current: '50%', target: '85%' }
    ]
  },
]

const SOLUTION_ARCHITECTURE_DATA = [
  { name: 'Automation', value: 40, fill: '#F7941D' },
  { name: 'Standardization', value: 35, fill: '#015a84' },
  { name: 'Centralization', value: 25, fill: '#1E3A4F' },
]

// Grouped and simplified cost impact data for cleaner visualization
const COST_IMPACT_DATA = [
  { category: 'Revenue Loss', shortName: 'Revenue', count: 4, fill: '#F7941D' },
  { category: 'Operational Drag', shortName: 'Operations', count: 3, fill: '#015a84' },
  { category: 'Strategic Bottlenecks', shortName: 'Strategy', count: 3, fill: '#1E3A4F' },
]

// Priority distribution for a cleaner chart
const PRIORITY_DISTRIBUTION_DATA = [
  { name: 'Critical (P0)', value: 4, fill: '#F7941D' },
  { name: 'High (P1)', value: 4, fill: '#015a84' },
  { name: 'Medium (P2)', value: 2, fill: '#1E3A4F' },
]

const CHART_CONFIG = {
  impact: { label: 'Impact Score', color: 'hsl(var(--chart-1))' },
  effort: { label: 'Effort Score', color: 'hsl(var(--chart-2))' },
}

// ============================================================================
// CUSTOM HOOK: Encapsulated filter logic for reusability and testing
// ============================================================================

type FilterState = {
  searchTerm: string
  priority: string
  category: string
  costType: string
  sortBy: 'priority' | 'impact' | 'name'
  sortOrder: 'asc' | 'desc'
}

type PainPoint = typeof PAIN_POINTS_DATA[0]

function usePainPoints(initialFilters: Partial<FilterState> = {}) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    priority: 'all',
    category: 'all',
    costType: 'all',
    sortBy: 'priority',
    sortOrder: 'asc',
    ...initialFilters,
  })

  const filteredAndSorted = useMemo(() => {
    let result = [...PAIN_POINTS_DATA]

    // Filter logic
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.primaryCost.toLowerCase().includes(searchLower) ||
        item.owner.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      )
    }

    if (filters.priority !== 'all') {
      result = result.filter(item => item.priority === filters.priority)
    }

    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category)
    }

    if (filters.costType !== 'all') {
      result = result.filter(item => item.costType === filters.costType)
    }

    // Sort logic
    result.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'priority':
          comparison = a.priority.localeCompare(b.priority)
          break
        case 'impact':
          comparison = b.impact - a.impact
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [filters.searchTerm, filters.priority, filters.category, filters.costType, filters.sortBy, filters.sortOrder])

  const stats = useMemo(() => {
    return {
      total: PAIN_POINTS_DATA.length,
      filtered: filteredAndSorted.length,
      quickWins: {
        high: PAIN_POINTS_DATA.filter(p => p.quickWin === 'High').length,
        medium: PAIN_POINTS_DATA.filter(p => p.quickWin === 'Medium').length,
        low: PAIN_POINTS_DATA.filter(p => p.quickWin === 'Low').length,
      },
      priorities: {
        p0: PAIN_POINTS_DATA.filter(p => p.priority === 'P0').length,
        p1: PAIN_POINTS_DATA.filter(p => p.priority === 'P1').length,
        p2: PAIN_POINTS_DATA.filter(p => p.priority === 'P2').length,
      },
    }
  }, [])

  return {
    filters,
    setFilters,
    painPoints: filteredAndSorted,
    stats,
  }
}

// ============================================================================
// MEMOIZED COMPONENTS: Performance optimization for repeated renders
// ============================================================================

interface PainPointCardProps {
  point: PainPoint
  isExpanded: boolean
  onToggle: (id: number) => void
  onViewDetails: (point: PainPoint) => void
}

const PainPointCard = memo<PainPointCardProps>(({ point, isExpanded, onToggle, onViewDetails }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  // Accessibility: keyboard expansion toggle
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(point.id)
    }
  }, [point.id, onToggle])

  const getPriorityConfig = useCallback((priority: string) => {
    const configs = {
      'P0': { bg: 'bg-gradient-to-r from-[#F7941D] to-[#E07D0C]', border: 'border-l-[#F7941D]', text: 'text-white', icon: AlertTriangle, label: 'Critical' },
      'P1': { bg: 'bg-gradient-to-r from-[#015a84] to-[#014668]', border: 'border-l-[#015a84]', text: 'text-white', icon: Zap, label: 'High' },
      'P2': { bg: 'bg-gradient-to-r from-[#1E3A4F] to-[#0F2A3D]', border: 'border-l-[#1E3A4F]', text: 'text-white', icon: Clock, label: 'Medium' },
    }
    return configs[priority as keyof typeof configs] || configs['P2']
  }, [])

  const getQuickWinConfig = useCallback((quickWin: string) => {
    const configs = {
      'High': { bg: 'bg-green-600 dark:bg-green-700', text: 'text-white', label: 'High ROI' },
      'Medium': { bg: 'bg-[#015a84]', text: 'text-white', label: 'Medium ROI' },
      'Low': { bg: 'bg-[#1E3A4F]', text: 'text-white', label: 'Low ROI' },
    }
    return configs[quickWin as keyof typeof configs] || configs['Medium']
  }, [])

  const priorityConfig = getPriorityConfig(point.priority)
  const quickWinConfig = getQuickWinConfig(point.quickWin)
  const PriorityIcon = priorityConfig.icon

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card
        className={`
          overflow-hidden transition-all duration-300
          ${isExpanded ? 'shadow-xl ring-2 ring-primary/20' : 'shadow-md hover:shadow-lg'}
          ${point.priority === 'P0' 
            ? 'border-l-4 border-l-[#F7941D]' 
            : point.priority === 'P1'
              ? 'border-l-4 border-l-[#015a84]'
              : 'border-l-4 border-l-[#1E3A4F]'}
        `}
      >
        {/* Compact header - always visible */}
        <div
          className="cursor-pointer p-6 hover:bg-muted/50 transition-colors"
          onClick={() => onToggle(point.id)}
          onKeyDown={handleKeyDown}
          role="button"
          aria-expanded={isExpanded}
          aria-controls={`panel-${point.id}`}
          tabIndex={0}
        >
          {/* Primary row: ID, name, priority */}
          <div className="flex items-start gap-4 mb-4">
            {/* ID badge */}
            <div className={`
              flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
              font-bold text-base
              ${point.priority === 'P0' 
                ? 'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] text-white shadow-lg' 
                : point.priority === 'P1'
                  ? 'bg-gradient-to-br from-[#015a84] to-[#014668] text-white shadow-lg'
                  : 'bg-gradient-to-br from-[#1E3A4F] to-[#0F2A3D] text-white shadow-md'}
            `}>
              {point.id}
            </div>

            {/* Name and meta */}
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className={`
                font-semibold leading-tight tracking-tight
                ${point.priority === 'P0' ? 'text-xl' : 'text-lg'}
              `}>
                {point.name}
              </h3>

              {/* Badge cluster */}
              <div className="flex flex-wrap gap-2">
                {/* Priority badge - accessible with icon + color */}
                <Badge className={`${priorityConfig.bg} ${priorityConfig.text} gap-1.5 text-xs px-2.5 py-1 font-medium`}>
                  <PriorityIcon className="h-3 w-3" />
                  {priorityConfig.label}
                </Badge>

                {/* Quick win badge */}
                <Badge className={`${quickWinConfig.bg} ${quickWinConfig.text} text-xs px-2.5 py-1 font-medium`}>
                  {quickWinConfig.label}
                </Badge>

                {/* Category badge - text-only for contrast */}
                <Badge variant="outline" className="text-xs px-2.5 py-1">
                  {point.category}
                </Badge>
              </div>
            </div>

            {/* Expand/collapse chevron - larger touch target */}
            <div className={`
              flex h-10 w-10 shrink-0 items-center justify-center rounded-full
              transition-all duration-300
              ${isExpanded ? 'bg-primary text-primary-foreground rotate-180' : 'bg-muted hover:bg-muted-foreground/10'}
            `}>
              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </div>
          </div>

          {/* Secondary row: owner, metrics */}
          <div className="grid grid-cols-3 gap-4 pl-16">
            {/* Owner */}
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Owner
              </div>
              <div className="text-sm flex items-center gap-1.5 font-medium">
                <Users className="h-3.5 w-3.5" />
                <span className="truncate">{point.owner}</span>
              </div>
            </div>

            {/* Impact */}
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Impact
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full dark:bg-slate-700">
                  <motion.div
                    className="h-1.5 rounded-full bg-blue-600 dark:bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(point.impact / 10) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums w-8">{point.impact}</span>
              </div>
            </div>

            {/* Effort */}
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Effort
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full dark:bg-slate-700">
                  <motion.div
                    className="h-1.5 rounded-full bg-orange-600 dark:bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(point.effort / 10) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums w-8">{point.effort}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable content panel */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              id={`panel-${point.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="border-t bg-muted/30 p-6 space-y-5">
                {/* Problem section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                      Problem
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed pl-6 text-muted-foreground">
                    {point.pain}
                  </p>
                </div>

                {/* Cost section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      Business Impact
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed pl-6 text-muted-foreground">
                    {point.whyCostly}
                  </p>
                </div>

                {/* Solution section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                      Solution
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed pl-6 text-muted-foreground">
                    {point.solution}
                  </p>
                </div>

                {/* Action items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Action Items
                  </h4>
                  <ul className="space-y-2 pl-6">
                    {point.actionItems.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-3 leading-relaxed">
                        <span className={`
                          flex h-5 w-5 shrink-0 items-center justify-center rounded-full
                          text-[11px] font-semibold
                          ${point.priority === 'P0' ? 'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] text-white' : 'bg-gradient-to-br from-[#015a84] to-[#014668] text-white'}
                        `}>
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Success metrics */}
                {point.metrics && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Success Metrics
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3 pl-6">
                      {point.metrics.map((metric, idx) => (
                        <div key={idx} className="rounded-lg border bg-card p-4">
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
                            {metric.label}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-center flex-1">
                              <div className="text-[11px] text-muted-foreground mb-1">Current</div>
                              <div className="text-sm font-semibold text-[#F7941D] tabular-nums leading-tight">
                                {metric.current}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="text-center flex-1">
                              <div className="text-[11px] text-muted-foreground mb-1">Target</div>
                              <div className="text-sm font-semibold text-[#015a84] dark:text-[#4da6c9] tabular-nums leading-tight">
                                {metric.target}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => onViewDetails(point)}
                    className="w-full sm:w-auto gap-2 bg-[#015a84] hover:bg-[#014668] text-white"
                  >
                    <Zap className="h-4 w-4" />
                    Take Action
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
})

PainPointCard.displayName = 'PainPointCard'

// ============================================================================
// STATS CARDS: Reusable stat display components
// ============================================================================

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  colorClass?: string
}

const StatCard = memo<StatCardProps>(({ title, value, description, icon: Icon, colorClass }) => (
  <div className="space-y-2">
    <div className={`flex items-center gap-2 text-sm ${colorClass || 'text-white/80'}`}>
      <Icon className="h-4 w-4" />
      <span className="font-medium uppercase tracking-wider">{title}</span>
    </div>
    <div className="text-4xl font-bold tracking-tight text-white">{value}</div>
    <p className="text-sm leading-relaxed text-white/70">{description}</p>
  </div>
))

StatCard.displayName = 'StatCard'

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function GuardianDashboard() {
  const {
    filters,
    setFilters,
    painPoints: filteredPoints,
    stats,
  } = usePainPoints()

  const [selectedPoint, setSelectedPoint] = useState<PainPoint | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards')
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)
  const { sendMessage, startNewConversation } = useChatStore()
  const { initiatives } = useInitiativeStore()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize filter setters to avoid recreating functions
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleCard = useCallback((id: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        // Limit expansions to 3 for performance
        if (newSet.size >= 3) {
          newSet.clear()
        }
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedCards(new Set(filteredPoints.slice(0, 3).map(p => p.id)))
  }, [filteredPoints])

  const collapseAll = useCallback(() => {
    setExpandedCards(new Set())
  }, [])

  const openPointDetails = useCallback((point: PainPoint) => {
    setSelectedPoint(point)
    setDialogOpen(true)
  }, [])

  const handleGetAIInsights = useCallback((point: PainPoint) => {
    setDialogOpen(false)
    setActiveTab('assistant')
    startNewConversation()
    
    // Build a clean, professional prompt with proper formatting
    const prompt = `I need strategic guidance on **Pain Point #${point.id}: ${point.name}**.

This initiative is rated **${point.impact}/10 impact** with **${point.effort}/10 effort** to implement. The owner is **${point.owner}** and it's classified as **${point.priority}** priority.

Please provide:
1. Quick wins I can implement in the next 30 days
2. A phased implementation approach
3. Key metrics to track success
4. Potential risks and how to mitigate them`
    
    sendMessage(prompt)
  }, [setActiveTab, sendMessage, startNewConversation])

  const hasActiveFilters = filters.searchTerm !== '' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.costType !== 'all'

  const clearAllFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      priority: 'all',
      category: 'all',
      costType: 'all',
      sortBy: 'priority',
      sortOrder: 'asc',
    })
  }, [setFilters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header - minimalist, purposeful */}
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-[#015a84] to-[#1E3A4F] backdrop-blur-md">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title block */}
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight leading-none text-white">
                Guardian Roofing
              </h1>
              <p className="text-sm text-white/80 mt-1">
                2026 Strategic Pain Points Analysis
              </p>
            </div>

            {/* Key stats badges - inline, not separate */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{stats.total} Pain Points</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                <Activity className="h-3.5 w-3.5" />
                <span>3 Solution Types</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                <Layers className="h-3.5 w-3.5" />
                <span>10 Owners</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="tracker" className="gap-2">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="owners" className="gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Owners</span>
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Dependencies</span>
              </TabsTrigger>
              <TabsTrigger value="assistant" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Advisor</span>
              </TabsTrigger>
            </TabsList>
            <PDFExport initiatives={initiatives} className="shrink-0" />
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
        {/* Executive Summary - integrated into surface, not separate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-[#015a84] to-[#1E3A4F] text-white rounded-xl p-6 shadow-lg">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-lg font-semibold tracking-tight">Executive Summary</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <StatCard
                title="Critical"
                value={stats.priorities.p0}
                description="High-impact items requiring immediate attention"
                icon={AlertTriangle}
                colorClass="text-[#F7941D]"
              />
              <StatCard
                title="Quick Wins"
                value={stats.quickWins.high}
                description="High ROI initiatives with low implementation effort"
                icon={DollarSign}
                colorClass="text-green-300"
              />
              <StatCard
                title="Assigned"
                value={stats.total}
                description="Clear ownership across all functional areas"
                icon={Users}
                colorClass="text-[#F7941D]"
              />
            </div>

            <div className="mt-5 pt-5 border-t border-slate-700">
              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-slate-300">
                Three Major Cost Categories
              </h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="bg-white/10 rounded-lg p-4 space-y-1">
                  <div className="text-xs text-slate-300 font-medium uppercase tracking-wider">Revenue Leakage</div>
                  <div className="text-sm leading-relaxed">Lost opportunities, underpaid claims, margin erosion</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 space-y-1">
                  <div className="text-xs text-slate-300 font-medium uppercase tracking-wider">Operational Inefficiency</div>
                  <div className="text-sm leading-relaxed">Extended cycle times, rework, resource waste</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 space-y-1">
                  <div className="text-xs text-slate-300 font-medium uppercase tracking-wider">Strategic Bottlenecks</div>
                  <div className="text-sm leading-relaxed">Leadership overload, scaling limitations, brand risk</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Bar - contextual, not modal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              {/* Search */}
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pain points, categories, or owners..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-11 h-11"
                />
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap gap-2">
                <Select value={filters.priority} onValueChange={(v) => updateFilter('priority', v)}>
                  <SelectTrigger className="w-[140px] h-11">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="P0">P0 - Critical</SelectItem>
                    <SelectItem value="P1">P1 - High</SelectItem>
                    <SelectItem value="P2">P2 - Medium</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.category} onValueChange={(v) => updateFilter('category', v)}>
                  <SelectTrigger className="w-[140px] h-11">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Claims">Claims</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Customer Experience">Customer Experience</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.costType} onValueChange={(v) => updateFilter('costType', v)}>
                  <SelectTrigger className="w-[140px] h-11">
                    <SelectValue placeholder="Cost Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="OpEx">OpEx</SelectItem>
                    <SelectItem value="Quality">Quality</SelectItem>
                    <SelectItem value="CX">CX</SelectItem>
                    <SelectItem value="Data">Data</SelectItem>
                    <SelectItem value="Strategic">Strategic</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(v: any) => updateFilter('sortBy', v)}>
                  <SelectTrigger className="w-[140px] h-11">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="impact">Impact</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort order toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="h-11"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Results count and bulk actions */}
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="flex items-center gap-6">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{stats.filtered}</span> of <span className="font-semibold text-foreground">{stats.total}</span> pain points
                </div>
                
                {/* Priority key - subtle and inconspicuous */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground opacity-60">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#F7941D]" />
                    <span>P0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#015a84]" />
                    <span>P1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#1E3A4F]" />
                    <span>P2</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandAll}
                  disabled={expandedCards.size === 3}
                  className="h-9"
                >
                  <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                  Expand First 3
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAll}
                  disabled={expandedCards.size === 0}
                  className="h-9"
                >
                  <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                  Collapse All
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pain Points Grid - with Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {filteredPoints.length === 0 ? (
            /* Empty state */
            <div className="rounded-xl border-2 border-dashed bg-muted/30 p-12 text-center">
              <div className="mb-4 flex justify-center">
                <XCircle className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No pain points match your filters</h3>
              <p className="mb-6 text-muted-foreground max-w-md mx-auto">
                Try adjusting your search terms or clearing some filters to see more results.
              </p>
              <Button onClick={clearAllFilters} size="lg">
                Clear All Filters
              </Button>
            </div>
          ) : (
            /* Pain points cards */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {filteredPoints.map((point) => (
                <PainPointCard
                  key={point.id}
                  point={point}
                  isExpanded={expandedCards.has(point.id)}
                  onToggle={toggleCard}
                  onViewDetails={openPointDetails}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Visual Analytics Section - Lazy mounted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 space-y-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-[#1E3A4F] dark:text-white">Strategic Analytics</h2>
            <p className="text-sm text-muted-foreground mt-1">Data-driven insights for prioritization</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Priority Distribution - Clean donut */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-[#1E3A4F] dark:text-white">Priority Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">10 initiatives by priority tier</p>
              </div>
              <div className="p-5 relative">
                <ChartContainer config={CHART_CONFIG}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={PRIORITY_DISTRIBUTION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {PRIORITY_DISTRIBUTION_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                {/* Center stat */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '20px' }}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#1E3A4F] dark:text-white">10</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  {PRIORITY_DISTRIBUTION_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.name.split(' ')[0]}</span>
                      <span className="font-semibold text-[#1E3A4F] dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Cost Impact - Horizontal bars */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-[#1E3A4F] dark:text-white">Impact Categories</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pain points by cost type</p>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {COST_IMPACT_DATA.map((item, index) => (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.category}</span>
                        <span className="font-semibold text-[#1E3A4F] dark:text-white">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / 4) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total pain points</span>
                  <span className="font-semibold text-[#F7941D]">10 identified</span>
                </div>
              </div>
            </Card>

            {/* Solution Types - Donut */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-[#1E3A4F] dark:text-white">Solution Mix</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Technology approach distribution</p>
              </div>
              <div className="p-5 relative">
                <ChartContainer config={CHART_CONFIG}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={SOLUTION_ARCHITECTURE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {SOLUTION_ARCHITECTURE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                {/* Center stat */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '20px' }}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#F7941D]">40%</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Automation</div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  {SOLUTION_ARCHITECTURE_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Impact vs Effort Matrix - Full Width */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#1E3A4F] dark:text-white">Strategic Prioritization Matrix</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Impact vs. effort analysis for decision-making</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
                  <span className="text-muted-foreground">Quick Wins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#F7941D]" />
                  <span className="text-muted-foreground">Strategic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#015a84]" />
                  <span className="text-muted-foreground">Consider</span>
                </div>
              </div>
            </div>
            <div className="p-5 relative">
              {/* Quadrant background labels */}
              <div className="absolute inset-5 pointer-events-none z-0">
                <div className="grid grid-cols-2 grid-rows-2 h-full text-xs font-medium opacity-60">
                  <div className="flex items-start justify-start p-3 text-[#22c55e] border-r border-b border-dashed border-slate-200 dark:border-slate-700 bg-[#22c55e]/5">
                    <span className="bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded">🎯 QUICK WINS</span>
                  </div>
                  <div className="flex items-start justify-end p-3 text-[#F7941D] border-b border-dashed border-slate-200 dark:border-slate-700 bg-[#F7941D]/5">
                    <span className="bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded">📈 STRATEGIC</span>
                  </div>
                  <div className="flex items-end justify-start p-3 text-slate-400 border-r border-dashed border-slate-200 dark:border-slate-700">
                    <span className="bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded">⏸️ FILL-INS</span>
                  </div>
                  <div className="flex items-end justify-end p-3 text-[#015a84]">
                    <span className="bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded">🔍 EVALUATE</span>
                  </div>
                </div>
              </div>
              
              <ChartContainer config={CHART_CONFIG}>
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      dataKey="effort"
                      name="Implementation Effort"
                      domain={[3, 11]}
                      ticks={[4, 5, 6, 7, 8, 9, 10]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    >
                      {/* @ts-expect-error recharts label type issue */}
                      <label value="← Lower Effort                    Higher Effort →" position="bottom" offset={25} style={{ fontSize: 11, fill: '#64748b' }} />
                    </XAxis>
                    <YAxis
                      type="number"
                      dataKey="impact"
                      name="Business Impact"
                      domain={[5, 11]}
                      ticks={[6, 7, 8, 9, 10]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    >
                      {/* @ts-expect-error recharts label type issue */}
                      <label value="Impact Score" angle={-90} position="insideLeft" offset={-35} style={{ fontSize: 11, fill: '#64748b' }} />
                    </YAxis>
                    <ChartTooltip
                      cursor={{ strokeDasharray: '3 3', stroke: '#F7941D' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const point = PAIN_POINTS_DATA.find(p => p.id === data.id)
                          return (
                            <div className="rounded-xl border-0 bg-white dark:bg-slate-800 p-4 shadow-xl min-w-[200px]">
                              <div className="font-semibold text-[#1E3A4F] dark:text-white mb-2">{data.name}</div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <span className="text-muted-foreground">Impact</span>
                                  <div className="font-bold text-[#F7941D]">{data.impact}/10</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Effort</span>
                                  <div className="font-bold text-[#015a84]">{data.effort}/10</div>
                                </div>
                              </div>
                              <div className="flex gap-1.5 mb-3">
                                <Badge className="bg-[#015a84] text-white text-[10px]">{data.priority}</Badge>
                                <Badge variant="outline" className="text-[10px]">{data.category}</Badge>
                              </div>
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-[#F7941D] to-[#E07D0C] text-white text-xs"
                                onClick={() => point && openPointDetails(point)}
                              >
                                Take Action →
                              </Button>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Scatter data={PAIN_POINTS_DATA} fill="hsl(var(--chart-1))">
                      {PAIN_POINTS_DATA.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.impact >= 8 && entry.effort <= 6
                              ? '#22c55e' // Green - Quick wins
                              : entry.impact >= 8
                                ? '#F7941D' // Guardian Orange - Strategic
                                : '#015a84' // Guardian Blue - Consider
                          }
                          stroke="#fff"
                          strokeWidth={2}
                          r={8}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>
        </motion.div>
          </TabsContent>

          {/* Tracker Tab */}
          <TabsContent value="tracker">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Initiative Tracker</h2>
                <p className="text-muted-foreground mt-1">Track progress on each pain point initiative with status updates, action items, and notes.</p>
              </div>
              <InitiativeTracker />
            </motion.div>
          </TabsContent>

          {/* Owners Tab */}
          <TabsContent value="owners">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <OwnerDashboard />
            </motion.div>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Link2 className="h-6 w-6 text-[#015a84]" />
                  Dependency Mapping
                </h2>
                <p className="text-muted-foreground mt-1">
                  Visualize and manage relationships between initiatives. Understand which pain points 
                  block, enable, or relate to each other.
                </p>
              </div>
              <DependencyMap />
            </motion.div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">AI Strategic Advisor</h2>
                  <p className="text-muted-foreground mt-1">Ask GuardianAI about pain points, get recommendations, and create action plans.</p>
                </div>
                <EmailSubscriptionCard />
              </div>
              <Card className="h-[600px] overflow-hidden">
                <AIChat />
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating AI Assistant */}
      <AIAssistantPanel />

      {/* Footer - minimal */}
      <footer className="mt-auto border-t bg-gradient-to-r from-[#015a84] to-[#1E3A4F] backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/80">
              Guardian Roofing 2026 Strategic Analysis Dashboard
            </p>
            <div className="flex gap-4 text-xs text-white/80">
              <span>{stats.total} Pain Points</span>
              <span>•</span>
              <span>3 Solution Types</span>
              <span>•</span>
              <span>{stats.total} Owners</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Detail Dialog - Accessible with focus management */}
      {/* Action Panel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {selectedPoint && (
            <>
              <DialogHeader className="pr-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className={`
                        flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg shrink-0
                        ${selectedPoint.priority === 'P0' 
                          ? 'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] text-white shadow-lg' 
                          : 'bg-gradient-to-br from-[#015a84] to-[#014668] text-white'}
                      `}>
                        {selectedPoint.id}
                      </div>
                      <DialogTitle className="text-2xl tracking-tight break-words">
                        {selectedPoint.name}
                      </DialogTitle>
                    </div>
                    <DialogDescription className="mt-2">
                      Pain Point #{selectedPoint.id} • {selectedPoint.category} • {selectedPoint.owner}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setActiveTab('tracker')}
                    variant="outline"
                    className="h-24 flex-col gap-2 border-2 border-[#015a84] text-[#015a84] hover:bg-[#015a84] hover:text-white transition-all"
                    size="lg"
                  >
                    <ListTodo className="h-8 w-8" />
                    <span className="font-semibold">Track Initiative</span>
                  </Button>
                  <Button
                    onClick={() => handleGetAIInsights(selectedPoint)}
                    className="h-24 flex-col gap-2 bg-gradient-to-r from-[#F7941D] to-[#E07D0C] hover:from-[#015a84] hover:to-[#014668] text-white transition-all"
                    size="lg"
                  >
                    <Bot className="h-8 w-8" />
                    <span className="font-semibold">Get AI Insights</span>
                  </Button>
                </div>

                {/* Key Metrics */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="rounded-lg border bg-gradient-to-br from-[#015a84]/5 to-[#1E3A4F]/5 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Impact</div>
                    <div className="text-2xl font-bold text-[#F7941D] tabular-nums">
                      {selectedPoint.impact}/10
                    </div>
                  </div>
                  <div className="rounded-lg border bg-gradient-to-br from-[#F7941D]/5 to-[#E07D0C]/5 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Effort</div>
                    <div className="text-2xl font-bold text-[#015a84] tabular-nums">
                      {selectedPoint.effort}/10
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Owner</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="truncate">{selectedPoint.owner}</span>
                    </div>
                  </div>
                </div>

                {/* Problem & Impact */}
                <div className="space-y-3 rounded-lg border-l-4 border-l-[#F7941D] border bg-[#F7941D]/5 p-5">
                  <h4 className="flex items-center gap-2 font-semibold text-sm text-[#1E3A4F] dark:text-white">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-[#F7941D]" />
                    The Challenge
                  </h4>
                  <p className="text-sm leading-relaxed pl-7 break-words">{selectedPoint.pain}</p>
                  <div className="mt-3 pt-3 border-t border-[#F7941D]/20">
                    <p className="text-sm leading-relaxed pl-7 break-words text-muted-foreground">
                      <strong className="text-[#015a84]">Business Impact:</strong> {selectedPoint.whyCostly}
                    </p>
                  </div>
                </div>

                {/* Implementation Phases */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-semibold text-sm">
                    <Play className="h-5 w-5 shrink-0 text-[#015a84]" />
                    Implementation Phases
                  </h4>
                  <div className="space-y-3 pl-7">
                    {selectedPoint.actionItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#015a84] to-[#014668] text-white text-sm font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-sm pt-0.5 leading-relaxed break-words">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Success Metric */}
                {selectedPoint.metrics && selectedPoint.metrics.length > 0 && (
                  <div className="space-y-3 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-5">
                    <h4 className="flex items-center gap-2 font-semibold text-sm text-green-700 dark:text-green-400">
                      <Target className="h-5 w-5 shrink-0" />
                      Primary Success Metric
                    </h4>
                    <div className="pl-7">
                      <div className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                        {selectedPoint.metrics[0].label}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-center flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Current</div>
                          <div className="text-base font-semibold text-[#F7941D] tabular-nums leading-tight">
                            {selectedPoint.metrics[0].current}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="text-center flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Target</div>
                          <div className="text-base font-semibold text-green-600 dark:text-green-400 tabular-nums leading-tight">
                            {selectedPoint.metrics[0].target}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Pain Points */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-sm mb-3">
                    <Link2 className="h-4 w-4 shrink-0 text-[#015a84]" />
                    Related Pain Points
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_POINTS_DATA
                      .filter(p => p.id !== selectedPoint.id && p.category === selectedPoint.category)
                      .slice(0, 3)
                      .map(related => (
                        <Badge
                          key={related.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-[#015a84] hover:text-white transition-colors"
                          onClick={() => {
                            setSelectedPoint(related)
                          }}
                        >
                          #{related.id}: {related.name.slice(0, 30)}...
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
