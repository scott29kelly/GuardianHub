'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  Panel,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Link2,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAIN_POINTS_DATA, PainPoint } from '@/lib/pain-points-data'
import { useInitiativeStore, Initiative } from '@/lib/store'

interface Dependency {
  id: string
  fromPainPointId: number
  toPainPointId: number
  type: 'blocks' | 'enables' | 'relates_to'
  note?: string
  createdAt: string
}

// Custom Node Component
function PainPointNode({ data }: { data: { painPoint: PainPoint; initiative?: Initiative } }) {
  const { painPoint, initiative } = data
  
  const priorityColors = {
    P0: 'border-[#F7941D] bg-gradient-to-br from-[#F7941D]/10 to-[#F7941D]/5',
    P1: 'border-[#015a84] bg-gradient-to-br from-[#015a84]/10 to-[#015a84]/5',
    P2: 'border-slate-400 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900',
  }

  const statusColors = {
    not_started: 'bg-slate-500',
    planning: 'bg-[#015a84]',
    in_progress: 'bg-[#F7941D]',
    completed: 'bg-[#2f855a]',
  }

  return (
    <div className={cn(
      'px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px] max-w-[220px]',
      priorityColors[painPoint.priority]
    )}>
      <Handle type="target" position={Position.Left} className="!bg-[#015a84] !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-[#F7941D] !w-3 !h-3" />
      
      <div className="flex items-start gap-2">
        <div className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-bold text-xs',
          painPoint.priority === 'P0' 
            ? 'bg-[#F7941D] text-white' 
            : 'bg-white dark:bg-slate-800 border'
        )}>
          {painPoint.id}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs leading-tight line-clamp-2">
            {painPoint.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="outline" className="text-[9px] px-1 py-0">
              {painPoint.priority}
            </Badge>
            {initiative && (
              <div className={cn(
                'h-2 w-2 rounded-full',
                statusColors[initiative.status]
              )} title={initiative.status.replace('_', ' ')} />
            )}
          </div>
        </div>
      </div>
      
      {initiative && (
        <div className="mt-2 pt-2 border-t border-dashed">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{initiative.progress}%</span>
          </div>
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
            <div 
              className={cn('h-full rounded-full', statusColors[initiative.status])}
              style={{ width: `${initiative.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  painPoint: PainPointNode,
}

function DependencyMapInner() {
  const { initiatives, fetchInitiatives } = useInitiativeStore()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newDependency, setNewDependency] = useState({
    fromPainPointId: '',
    toPainPointId: '',
    type: 'blocks' as Dependency['type'],
    note: '',
  })

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Fetch dependencies
  const fetchDependencies = useCallback(async () => {
    try {
      const response = await fetch('/api/dependencies')
      if (!response.ok) throw new Error('Failed to fetch dependencies')
      const data = await response.json()
      setDependencies(data)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  // Initial load
  useEffect(() => {
    Promise.all([fetchInitiatives(), fetchDependencies()])
      .finally(() => setIsLoading(false))
  }, [fetchInitiatives, fetchDependencies])

  // Generate nodes and edges from data
  useEffect(() => {
    if (isLoading) return

    // Create nodes for all pain points
    const newNodes: Node[] = PAIN_POINTS_DATA.map((pp, index) => {
      const initiative = initiatives.find(i => i.painPointId === pp.id)
      
      // Position in a grid-like layout
      const cols = 4
      const row = Math.floor(index / cols)
      const col = index % cols
      
      return {
        id: `pp-${pp.id}`,
        type: 'painPoint',
        position: { x: col * 280 + 50, y: row * 180 + 50 },
        data: { painPoint: pp, initiative },
      }
    })

    // Create edges from dependencies
    const newEdges: Edge[] = dependencies.map(dep => {
      const edgeColors = {
        blocks: '#dc2626',
        enables: '#2f855a',
        relates_to: '#015a84',
      }
      
      return {
        id: dep.id,
        source: `pp-${dep.fromPainPointId}`,
        target: `pp-${dep.toPainPointId}`,
        type: 'smoothstep',
        animated: dep.type === 'blocks',
        style: { stroke: edgeColors[dep.type], strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColors[dep.type],
        },
        label: dep.type.replace('_', ' '),
        labelStyle: { fontSize: 10, fill: edgeColors[dep.type] },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      }
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [isLoading, initiatives, dependencies, setNodes, setEdges])

  // Handle new connection from drag
  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return
    
    const fromId = parseInt(connection.source.replace('pp-', ''))
    const toId = parseInt(connection.target.replace('pp-', ''))

    if (fromId === toId) return

    // Check if dependency already exists
    const exists = dependencies.some(
      d => d.fromPainPointId === fromId && d.toPainPointId === toId
    )
    if (exists) return

    setNewDependency({
      fromPainPointId: fromId.toString(),
      toPainPointId: toId.toString(),
      type: 'blocks',
      note: '',
    })
    setShowAddDialog(true)
  }, [dependencies])

  // Add dependency
  const handleAddDependency = async () => {
    if (!newDependency.fromPainPointId || !newDependency.toPainPointId) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPainPointId: parseInt(newDependency.fromPainPointId),
          toPainPointId: parseInt(newDependency.toPainPointId),
          type: newDependency.type,
          note: newDependency.note || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add dependency')
      }

      await fetchDependencies()
      setShowAddDialog(false)
      setNewDependency({ fromPainPointId: '', toPainPointId: '', type: 'blocks', note: '' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete dependency
  const handleDeleteDependency = async (id: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/dependencies?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete dependency')

      await fetchDependencies()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowAddDialog(true)} 
            className="gap-2 bg-[#015a84] hover:bg-[#014668]"
          >
            <Plus className="h-4 w-4" />
            Add Dependency
          </Button>
          <Button 
            variant="outline" 
            onClick={() => { fetchDependencies(); fetchInitiatives() }}
            disabled={isSaving}
          >
            <RefreshCw className={cn('h-4 w-4', isSaving && 'animate-spin')} />
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 bg-red-600 rounded" />
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 bg-[#2f855a] rounded" />
            <span>Enables</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 bg-[#015a84] rounded" />
            <span>Relates to</span>
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <Card className="overflow-hidden">
        <div className="h-[600px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                const pp = node.data?.painPoint as PainPoint
                if (pp?.priority === 'P0') return '#F7941D'
                if (pp?.priority === 'P1') return '#015a84'
                return '#718096'
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Background gap={16} size={1} />
            
            <Panel position="top-right" className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dependencies ({dependencies.length})
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {dependencies.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">
                    No dependencies yet. Drag between nodes to create one.
                  </div>
                ) : (
                  dependencies.map(dep => {
                    return (
                      <div 
                        key={dep.id} 
                        className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted group"
                      >
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          #{dep.fromPainPointId}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          #{dep.toPainPointId}
                        </Badge>
                        <Badge 
                          className={cn(
                            'text-[9px] px-1 py-0',
                            dep.type === 'blocks' && 'bg-red-500',
                            dep.type === 'enables' && 'bg-[#2f855a]',
                            dep.type === 'relates_to' && 'bg-[#015a84]'
                          )}
                        >
                          {dep.type.replace('_', ' ')}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteDependency(dep.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove dependency</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )
                  })
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </Card>

      {/* Info */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#015a84] shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">How to use:</strong> Drag from the orange handle on the right 
              of one pain point to the teal handle on the left of another to create a dependency. 
              Use the panel on the right to view and manage existing dependencies.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Dependency Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[#015a84]" />
              Add Dependency
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>From Pain Point</Label>
                <Select
                  value={newDependency.fromPainPointId}
                  onValueChange={(v) => setNewDependency(d => ({ ...d, fromPainPointId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAIN_POINTS_DATA.map(pp => (
                      <SelectItem key={pp.id} value={pp.id.toString()}>
                        #{pp.id}: {pp.name.slice(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Pain Point</Label>
                <Select
                  value={newDependency.toPainPointId}
                  onValueChange={(v) => setNewDependency(d => ({ ...d, toPainPointId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAIN_POINTS_DATA
                      .filter(pp => pp.id.toString() !== newDependency.fromPainPointId)
                      .map(pp => (
                        <SelectItem key={pp.id} value={pp.id.toString()}>
                          #{pp.id}: {pp.name.slice(0, 30)}...
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dependency Type</Label>
              <Select
                value={newDependency.type}
                onValueChange={(v: Dependency['type']) => setNewDependency(d => ({ ...d, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Blocks - Must complete first before starting the other
                    </span>
                  </SelectItem>
                  <SelectItem value="enables">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#2f855a]" />
                      Enables - Completing this makes the other easier/possible
                    </span>
                  </SelectItem>
                  <SelectItem value="relates_to">
                    <span className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[#015a84]" />
                      Relates to - General relationship, consider together
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Describe the relationship..."
                value={newDependency.note}
                onChange={(e) => setNewDependency(d => ({ ...d, note: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDependency}
              disabled={!newDependency.fromPainPointId || !newDependency.toPainPointId || isSaving}
              className="gap-2 bg-[#015a84] hover:bg-[#014668]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Add Dependency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Wrap with provider
export function DependencyMap() {
  return (
    <ReactFlowProvider>
      <DependencyMapInner />
    </ReactFlowProvider>
  )
}
