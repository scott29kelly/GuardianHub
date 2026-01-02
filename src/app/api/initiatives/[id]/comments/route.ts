import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET comments for an initiative
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const painPointId = parseInt(id)

    const initiative = await prisma.initiative.findUnique({
      where: { painPointId },
    })

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    const comments = await prisma.comment.findMany({
      where: { initiativeId: initiative.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST - add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const painPointId = parseInt(id)
    const body = await request.json()
    const { author, content } = body

    if (!author || !content) {
      return NextResponse.json({ error: 'Author and content are required' }, { status: 400 })
    }

    const initiative = await prisma.initiative.findUnique({
      where: { painPointId },
    })

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        initiativeId: initiative.id,
        author,
        content,
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
