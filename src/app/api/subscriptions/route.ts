import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// GET - List all subscriptions (for admin purposes)
export async function GET() {
  try {
    const subscriptions = await prisma.emailSubscription.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, weeklyDigest, deadlineAlerts, statusUpdates, ownerFilter, categoryFilter, priorityFilter } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.emailSubscription.findUnique({
      where: { email },
    })

    if (existing) {
      // Reactivate if inactive
      if (!existing.active) {
        const updated = await prisma.emailSubscription.update({
          where: { email },
          data: {
            active: true,
            name: name || existing.name,
            weeklyDigest: weeklyDigest ?? true,
            deadlineAlerts: deadlineAlerts ?? true,
            statusUpdates: statusUpdates ?? false,
            ownerFilter,
            categoryFilter,
            priorityFilter,
            verificationToken: nanoid(32),
          },
        })
        return NextResponse.json(updated)
      }
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 409 })
    }

    const subscription = await prisma.emailSubscription.create({
      data: {
        email,
        name,
        weeklyDigest: weeklyDigest ?? true,
        deadlineAlerts: deadlineAlerts ?? true,
        statusUpdates: statusUpdates ?? false,
        ownerFilter,
        categoryFilter,
        priorityFilter,
        verificationToken: nanoid(32),
        unsubscribeToken: nanoid(32),
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Failed to create subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

// PATCH - Update subscription preferences
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, ...updates } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const subscription = await prisma.emailSubscription.update({
      where: { email },
      data: updates,
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

// DELETE - Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email && !token) {
      return NextResponse.json({ error: 'Email or token required' }, { status: 400 })
    }

    const where = token 
      ? { unsubscribeToken: token }
      : { email: email! }

    await prisma.emailSubscription.update({
      where,
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to unsubscribe:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
