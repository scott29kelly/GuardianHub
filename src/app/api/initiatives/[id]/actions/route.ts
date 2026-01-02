import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH - toggle action item completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const painPointId = parseInt(id)
    const body = await request.json()
    const { actionItemId, completed } = body

    // Verify the action item belongs to this initiative
    const initiative = await prisma.initiative.findUnique({
      where: { painPointId },
      include: { actionItems: true },
    })

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    const actionItem = initiative.actionItems.find(a => a.id === actionItemId)
    if (!actionItem) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 })
    }

    // Update the action item
    await prisma.actionItem.update({
      where: { id: actionItemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    })

    // Recalculate progress
    const allActions = await prisma.actionItem.findMany({
      where: { initiativeId: initiative.id },
    })
    
    const completedCount = allActions.filter(a => a.completed).length
    const progress = Math.round((completedCount / allActions.length) * 100)

    // Update initiative progress
    const updatedInitiative = await prisma.initiative.update({
      where: { painPointId },
      data: { 
        progress,
        // Auto-complete if all items done
        status: progress === 100 ? 'completed' : undefined,
        completedDate: progress === 100 ? new Date() : undefined,
      },
      include: {
        actionItems: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json(updatedInitiative)
  } catch (error) {
    console.error('Error updating action item:', error)
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 })
  }
}
