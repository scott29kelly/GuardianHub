import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all dependencies
export async function GET() {
  try {
    const dependencies = await prisma.dependency.findMany({
      include: {
        initiative: true,
        dependsOn: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to include pain point IDs for easier frontend use
    const transformed = dependencies.map(dep => ({
      id: dep.id,
      fromPainPointId: dep.initiative.painPointId,
      toPainPointId: dep.dependsOn.painPointId,
      type: dep.type,
      note: dep.note,
      createdAt: dep.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Failed to fetch dependencies:', error)
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 })
  }
}

// POST - Create new dependency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromPainPointId, toPainPointId, type = 'blocks', note } = body

    if (!fromPainPointId || !toPainPointId) {
      return NextResponse.json({ error: 'Both pain point IDs are required' }, { status: 400 })
    }

    if (fromPainPointId === toPainPointId) {
      return NextResponse.json({ error: 'Cannot create self-dependency' }, { status: 400 })
    }

    // Find initiatives by pain point IDs
    const [fromInitiative, toInitiative] = await Promise.all([
      prisma.initiative.findUnique({ where: { painPointId: fromPainPointId } }),
      prisma.initiative.findUnique({ where: { painPointId: toPainPointId } }),
    ])

    if (!fromInitiative || !toInitiative) {
      return NextResponse.json({ error: 'One or both initiatives not found' }, { status: 404 })
    }

    // Check for existing dependency
    const existing = await prisma.dependency.findUnique({
      where: {
        initiativeId_dependsOnId: {
          initiativeId: fromInitiative.id,
          dependsOnId: toInitiative.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 409 })
    }

    const dependency = await prisma.dependency.create({
      data: {
        initiativeId: fromInitiative.id,
        dependsOnId: toInitiative.id,
        type,
        note,
      },
    })

    return NextResponse.json({
      id: dependency.id,
      fromPainPointId,
      toPainPointId,
      type: dependency.type,
      note: dependency.note,
      createdAt: dependency.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create dependency:', error)
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 })
  }
}

// DELETE - Remove dependency
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Dependency ID required' }, { status: 400 })
    }

    await prisma.dependency.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete dependency:', error)
    return NextResponse.json({ error: 'Failed to delete dependency' }, { status: 500 })
  }
}
