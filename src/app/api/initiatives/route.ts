import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PAIN_POINTS_DATA } from '@/lib/pain-points-data'

// GET all initiatives (with auto-creation for missing pain points)
export async function GET() {
  try {
    // Ensure all pain points have an initiative record
    const existingInitiatives = await prisma.initiative.findMany({
      include: {
        actionItems: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' }, take: 5 },
        updates: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { painPointId: 'asc' },
    })

    const existingIds = new Set(existingInitiatives.map(i => i.painPointId))
    
    // Create initiatives for any missing pain points
    const missingPainPoints = PAIN_POINTS_DATA.filter(p => !existingIds.has(p.id))
    
    if (missingPainPoints.length > 0) {
      await prisma.initiative.createMany({
        data: missingPainPoints.map(p => ({
          painPointId: p.id,
          owner: p.owner,
          status: 'not_started',
          progress: 0,
          priorityOrder: p.id,
        })),
      })

      // Create default action items for each new initiative
      for (const painPoint of missingPainPoints) {
        const initiative = await prisma.initiative.findUnique({
          where: { painPointId: painPoint.id },
        })
        
        if (initiative) {
          await prisma.actionItem.createMany({
            data: painPoint.actionItems.map((item, index) => ({
              initiativeId: initiative.id,
              title: item,
              order: index,
              completed: false,
            })),
          })
        }
      }

      // Refetch with new data
      const allInitiatives = await prisma.initiative.findMany({
        include: {
          actionItems: { orderBy: { order: 'asc' } },
          comments: { orderBy: { createdAt: 'desc' }, take: 5 },
          updates: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { painPointId: 'asc' },
      })

      return NextResponse.json(allInitiatives)
    }

    return NextResponse.json(existingInitiatives)
  } catch (error) {
    console.error('Error fetching initiatives:', error)
    return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 })
  }
}

// POST - create or update initiative
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { painPointId, status, progress, owner, notes, blockers, startDate, targetDate } = body

    const initiative = await prisma.initiative.upsert({
      where: { painPointId },
      update: {
        status,
        progress,
        owner,
        notes,
        blockers,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        completedDate: status === 'completed' ? new Date() : null,
      },
      create: {
        painPointId,
        status: status || 'not_started',
        progress: progress || 0,
        owner,
        notes,
        blockers,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      },
      include: {
        actionItems: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json(initiative)
  } catch (error) {
    console.error('Error creating/updating initiative:', error)
    return NextResponse.json({ error: 'Failed to save initiative' }, { status: 500 })
  }
}
