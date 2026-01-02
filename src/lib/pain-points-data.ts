// Centralized pain points data - single source of truth
// Used by both the UI and AI assistant

export interface PainPointMetric {
  label: string
  current: string
  target: string
}

export interface PainPoint {
  id: number
  name: string
  impact: number
  effort: number
  costType: string
  primaryCost: string
  solutionType: string
  owner: string
  quickWin: 'High' | 'Medium' | 'Low'
  priority: 'P0' | 'P1' | 'P2'
  category: string
  pain: string
  whyCostly: string
  solution: string
  actionItems: string[]
  metrics: PainPointMetric[]
}

export const PAIN_POINTS_DATA: PainPoint[] = [
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

// Helper to get pain point by ID
export function getPainPointById(id: number): PainPoint | undefined {
  return PAIN_POINTS_DATA.find(p => p.id === id)
}

// Get all categories
export function getCategories(): string[] {
  return [...new Set(PAIN_POINTS_DATA.map(p => p.category))]
}

// Get pain points by category
export function getPainPointsByCategory(category: string): PainPoint[] {
  return PAIN_POINTS_DATA.filter(p => p.category === category)
}

// Get quick wins
export function getQuickWins(): PainPoint[] {
  return PAIN_POINTS_DATA.filter(p => p.quickWin === 'High' && p.effort <= 6)
}

// Get critical items (P0)
export function getCriticalItems(): PainPoint[] {
  return PAIN_POINTS_DATA.filter(p => p.priority === 'P0')
}

// Format pain points for AI context
export function getPainPointsContextForAI(): string {
  return PAIN_POINTS_DATA.map(p => `
## Pain Point #${p.id}: ${p.name}
- **Category:** ${p.category}
- **Priority:** ${p.priority}
- **Impact:** ${p.impact}/10 | **Effort:** ${p.effort}/10
- **Owner:** ${p.owner}
- **Quick Win Potential:** ${p.quickWin}

### Problem
${p.pain}

### Business Impact
${p.whyCostly}

### Recommended Solution
${p.solution}

### Action Items
${p.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

### Success Metrics
${p.metrics.map(m => `- ${m.label}: ${m.current} → ${m.target}`).join('\n')}
`).join('\n---\n')
}
