'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import {
  Mail,
  Bell,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAIN_POINTS_DATA, getCategories } from '@/lib/pain-points-data'

interface SubscriptionFormData {
  email: string
  name: string
  weeklyDigest: boolean
  deadlineAlerts: boolean
  statusUpdates: boolean
  ownerFilter: string
  categoryFilter: string
  priorityFilter: string
}

const OWNERS = [...new Set(PAIN_POINTS_DATA.map(p => p.owner))]
const CATEGORIES = getCategories()

export function EmailSubscriptionCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<SubscriptionFormData>({
    email: '',
    name: '',
    weeklyDigest: true,
    deadlineAlerts: true,
    statusUpdates: false,
    ownerFilter: 'all',
    categoryFilter: 'all',
    priorityFilter: 'all',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ownerFilter: formData.ownerFilter === 'all' ? null : formData.ownerFilter,
          categoryFilter: formData.categoryFilter === 'all' ? null : formData.categoryFilter,
          priorityFilter: formData.priorityFilter === 'all' ? null : formData.priorityFilter,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setFormData({
          email: '',
          name: '',
          weeklyDigest: true,
          deadlineAlerts: true,
          statusUpdates: false,
          ownerFilter: 'all',
          categoryFilter: 'all',
          priorityFilter: 'all',
        })
      }, 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-2 border-dashed border-[#015a84]/30 bg-gradient-to-br from-[#015a84]/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#015a84] text-white">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Weekly Digest</CardTitle>
              <CardDescription>Get progress updates delivered to your inbox</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              Every Monday
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Bell className="h-3 w-3" />
              Deadline Alerts
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Stalled Initiatives
            </Badge>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2 bg-[#015a84] hover:bg-[#014668]">
                <Mail className="h-4 w-4" />
                Subscribe to Updates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#015a84]" />
                  Subscribe to Weekly Digest
                </DialogTitle>
              </DialogHeader>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2f855a]/10">
                      <CheckCircle2 className="h-8 w-8 text-[#2f855a]" />
                    </div>
                    <h3 className="text-lg font-semibold">You&apos;re Subscribed!</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check your inbox for a confirmation email.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Notification Types
                      </Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={formData.weeklyDigest}
                            onCheckedChange={(c) => setFormData(f => ({ ...f, weeklyDigest: !!c }))}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Weekly Digest</div>
                            <div className="text-xs text-muted-foreground">Summary of all initiative progress every Monday</div>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={formData.deadlineAlerts}
                            onCheckedChange={(c) => setFormData(f => ({ ...f, deadlineAlerts: !!c }))}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Deadline Alerts</div>
                            <div className="text-xs text-muted-foreground">Notifications when target dates are approaching</div>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={formData.statusUpdates}
                            onCheckedChange={(c) => setFormData(f => ({ ...f, statusUpdates: !!c }))}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Status Changes</div>
                            <div className="text-xs text-muted-foreground">Real-time alerts when initiatives change status</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Settings className="h-3 w-3" />
                        Filter Preferences (Optional)
                      </Label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Owner</Label>
                          <Select
                            value={formData.ownerFilter}
                            onValueChange={(v) => setFormData(f => ({ ...f, ownerFilter: v }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="All owners" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Owners</SelectItem>
                              {OWNERS.map(owner => (
                                <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={formData.categoryFilter}
                            onValueChange={(v) => setFormData(f => ({ ...f, categoryFilter: v }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Priority</Label>
                          <Select
                            value={formData.priorityFilter}
                            onValueChange={(v) => setFormData(f => ({ ...f, priorityFilter: v }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="All priorities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Priorities</SelectItem>
                              <SelectItem value="P0">P0 - Critical</SelectItem>
                              <SelectItem value="P1">P1 - High</SelectItem>
                              <SelectItem value="P2">P2 - Medium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.email}
                      className="w-full gap-2 bg-[#015a84] hover:bg-[#014668]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
