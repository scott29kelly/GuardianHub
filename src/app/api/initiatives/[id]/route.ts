import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single initiative by painPointId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const painPointId = parseInt(id)

    const initiative = await prisma.initiative.findUnique({
      where: { painPointId },
      include: {
        actionItems: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    return NextResponse.json(initiative)
  } catch (error) {
    console.error('Error fetching initiative:', error)
    return NextResponse.json({ error: 'Failed to fetch initiative' }, { status: 500 })
  }
}

// PATCH - update initiative status/progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const painPointId = parseInt(id)
    const body = await request.json()

    // Get current initiative for status tracking
    const current = await prisma.initiative.findUnique({
      where: { painPointId },
    })

    if (!current) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    // Track status change if status is being updated
    if (body.status && body.status !== current.status) {
      await prisma.statusUpdate.create({
        data: {
          initiativeId: current.id,
          fromStatus: current.status,
          toStatus: body.status,
          changedBy: body.changedBy || 'System',
          note: body.statusNote,
        },
      })
    }

    // Build update data
    const updateData: any = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.owner !== undefined) updateData.owner = body.owner
    if (body.ownerEmail !== undefined) updateData.ownerEmail = body.ownerEmail
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.blockers !== undefined) updateData.blockers = body.blockers
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.targetDate !== undefined) updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null
    if (body.status === 'completed') updateData.completedDate = new Date()

    const initiative = await prisma.initiative.update({
      where: { painPointId },
      data: updateData,
      include: {
        actionItems: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json(initiative)
  } catch (error) {
    console.error('Error updating initiative:', error)
    return NextResponse.json({ error: 'Failed to update initiative' }, { status: 500 })
  }
}
