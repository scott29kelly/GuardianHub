import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PAIN_POINTS_DATA } from '@/lib/pain-points-data'

// GET - Generate weekly digest data (for preview or sending)
export async function GET() {
  try {
    const initiatives = await prisma.initiative.findMany({
      include: {
        actionItems: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    // Calculate summary stats
    const stats = {
      total: initiatives.length,
      notStarted: initiatives.filter(i => i.status === 'not_started').length,
      planning: initiatives.filter(i => i.status === 'planning').length,
      inProgress: initiatives.filter(i => i.status === 'in_progress').length,
      completed: initiatives.filter(i => i.status === 'completed').length,
      avgProgress: Math.round(
        initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length
      ),
    }

    // Get initiatives with upcoming deadlines (next 7 days)
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const upcomingDeadlines = initiatives
      .filter(i => i.targetDate && new Date(i.targetDate) <= nextWeek && i.status !== 'completed')
      .map(i => ({
        painPointId: i.painPointId,
        name: PAIN_POINTS_DATA.find(p => p.id === i.painPointId)?.name || `Pain Point #${i.painPointId}`,
        targetDate: i.targetDate,
        progress: i.progress,
        status: i.status,
      }))

    // Get stalled initiatives (no progress in 14+ days)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const stalledInitiatives = initiatives
      .filter(i => 
        i.status === 'in_progress' && 
        new Date(i.updatedAt) < twoWeeksAgo
      )
      .map(i => ({
        painPointId: i.painPointId,
        name: PAIN_POINTS_DATA.find(p => p.id === i.painPointId)?.name || `Pain Point #${i.painPointId}`,
        lastUpdated: i.updatedAt,
        progress: i.progress,
        owner: i.owner,
      }))

    // Recent activity
    const recentUpdates = initiatives
      .flatMap(i => i.updates.map(u => ({
        ...u,
        painPointId: i.painPointId,
        name: PAIN_POINTS_DATA.find(p => p.id === i.painPointId)?.name || `Pain Point #${i.painPointId}`,
      })))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    // Top performing (highest progress)
    const topPerforming = initiatives
      .filter(i => i.status !== 'completed')
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
      .map(i => ({
        painPointId: i.painPointId,
        name: PAIN_POINTS_DATA.find(p => p.id === i.painPointId)?.name || `Pain Point #${i.painPointId}`,
        progress: i.progress,
        owner: i.owner,
      }))

    // Needs attention (P0 items not in progress or completed)
    const needsAttention = initiatives
      .filter(i => {
        const painPoint = PAIN_POINTS_DATA.find(p => p.id === i.painPointId)
        return painPoint?.priority === 'P0' && !['in_progress', 'completed'].includes(i.status)
      })
      .map(i => ({
        painPointId: i.painPointId,
        name: PAIN_POINTS_DATA.find(p => p.id === i.painPointId)?.name || `Pain Point #${i.painPointId}`,
        status: i.status,
        owner: i.owner,
      }))

    const digest = {
      generatedAt: now.toISOString(),
      weekOf: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      stats,
      upcomingDeadlines,
      stalledInitiatives,
      recentUpdates,
      topPerforming,
      needsAttention,
    }

    return NextResponse.json(digest)
  } catch (error) {
    console.error('Failed to generate digest:', error)
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 })
  }
}
