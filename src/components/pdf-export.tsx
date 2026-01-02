'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { FileText, Loader2, BarChart3, ListTodo, Target } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { PAIN_POINTS_DATA } from '@/lib/pain-points-data'
import { Initiative } from '@/lib/store'

interface PDFExportProps {
  initiatives?: Initiative[]
  className?: string
}

// Helper to sanitize text for PDF (replace Unicode chars jsPDF can't handle)
function sanitizeText(text: string): string {
  return text
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/•/g, '-')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/…/g, '...')
}

export function PDFExport({ initiatives = [], className }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateExecutiveSummary = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // Header
      doc.setFillColor(1, 90, 132) // Guardian Teal
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Guardian Strategic Dashboard', margin, 28)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Executive Summary • ${new Date().toLocaleDateString()}`, margin, 36)

      y = 55
      doc.setTextColor(0, 0, 0)

      // Stats
      const stats = {
        total: PAIN_POINTS_DATA.length,
        p0: PAIN_POINTS_DATA.filter(p => p.priority === 'P0').length,
        p1: PAIN_POINTS_DATA.filter(p => p.priority === 'P1').length,
        p2: PAIN_POINTS_DATA.filter(p => p.priority === 'P2').length,
        quickWins: PAIN_POINTS_DATA.filter(p => p.quickWin === 'High').length,
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Overview', margin, y)
      y += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const overviewItems = [
        `Total Pain Points: ${stats.total}`,
        `Critical (P0): ${stats.p0}`,
        `High Priority (P1): ${stats.p1}`,
        `Medium Priority (P2): ${stats.p2}`,
        `High ROI Quick Wins: ${stats.quickWins}`,
      ]
      overviewItems.forEach(item => {
        doc.text(`• ${item}`, margin + 5, y)
        y += 6
      })

      y += 10

      // Initiative Status (if available)
      if (initiatives.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Initiative Status', margin, y)
        y += 10

        const statusCounts = {
          not_started: initiatives.filter(i => i.status === 'not_started').length,
          planning: initiatives.filter(i => i.status === 'planning').length,
          in_progress: initiatives.filter(i => i.status === 'in_progress').length,
          completed: initiatives.filter(i => i.status === 'completed').length,
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`• Not Started: ${statusCounts.not_started}`, margin + 5, y)
        y += 6
        doc.text(`• Planning: ${statusCounts.planning}`, margin + 5, y)
        y += 6
        doc.text(`• In Progress: ${statusCounts.in_progress}`, margin + 5, y)
        y += 6
        doc.text(`• Completed: ${statusCounts.completed}`, margin + 5, y)
        y += 15
      }

      // Critical Items
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(247, 148, 29) // Guardian Orange
      doc.text('Critical Pain Points (P0)', margin, y)
      y += 12

      doc.setTextColor(0, 0, 0)
      PAIN_POINTS_DATA.filter(p => p.priority === 'P0').forEach(point => {
        if (y > 250) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`#${point.id}: ${sanitizeText(point.name)}`, margin + 5, y)
        y += 7
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const wrappedPain = doc.splitTextToSize(sanitizeText(point.pain), pageWidth - margin * 2 - 15)
        doc.text(wrappedPain, margin + 10, y)
        y += wrappedPain.length * 4.5 + 2
        
        doc.setTextColor(100, 100, 100)
        doc.text(`Owner: ${point.owner}  |  Impact: ${point.impact}/10`, margin + 10, y)
        doc.setTextColor(0, 0, 0)
        y += 10
      })

      // Quick Wins
      if (y > 200) {
        doc.addPage()
        y = 20
      }

      y += 8
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(47, 133, 90) // Green
      doc.text('High ROI Quick Wins', margin, y)
      y += 12

      doc.setTextColor(0, 0, 0)
      PAIN_POINTS_DATA.filter(p => p.quickWin === 'High').forEach(point => {
        if (y > 265) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`#${point.id}: ${sanitizeText(point.name)}`, margin + 5, y)
        y += 6
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${point.category}  |  Effort: ${point.effort}/10  |  Impact: ${point.impact}/10`, margin + 10, y)
        doc.setTextColor(0, 0, 0)
        y += 9
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${pageCount} • Guardian Roofing & Siding • Generated ${new Date().toLocaleString()}`,
          pageWidth / 2,
          285,
          { align: 'center' }
        )
      }

      doc.save(`guardian-executive-summary-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generateDetailedReport = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // Header
      doc.setFillColor(1, 90, 132)
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Pain Points Detail Report', margin, 28)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Complete Analysis • ${new Date().toLocaleDateString()}`, margin, 36)

      y = 55

      // All Pain Points with details
      PAIN_POINTS_DATA.forEach((point, index) => {
        if (y > 240) {
          doc.addPage()
          y = 20
        }

        // Priority badge color
        const priorityColors = {
          P0: [247, 148, 29],
          P1: [1, 90, 132],
          P2: [113, 128, 150],
        }
        const [r, g, b] = priorityColors[point.priority] || [113, 128, 150]

        doc.setFillColor(r, g, b)
        doc.roundedRect(margin, y - 4, 25, 8, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text(point.priority, margin + 12.5, y + 1, { align: 'center' })

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`#${point.id}: ${sanitizeText(point.name)}`, margin + 30, y)
        y += 8

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`${point.category}  |  Owner: ${point.owner}  |  Quick Win: ${point.quickWin}`, margin + 5, y)
        y += 8

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Problem:', margin + 5, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        const wrappedPain = doc.splitTextToSize(sanitizeText(point.pain), pageWidth - margin * 2 - 10)
        doc.text(wrappedPain, margin + 5, y)
        y += wrappedPain.length * 4.5 + 4

        doc.setFont('helvetica', 'bold')
        doc.text('Solution:', margin + 5, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        const wrappedSolution = doc.splitTextToSize(sanitizeText(point.solution), pageWidth - margin * 2 - 10)
        doc.text(wrappedSolution, margin + 5, y)
        y += wrappedSolution.length * 4.5 + 4

        // Metrics
        if (point.metrics && point.metrics.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.text('Key Metrics:', margin + 5, y)
          y += 5
          doc.setFont('helvetica', 'normal')
          point.metrics.forEach(metric => {
            doc.text(`- ${sanitizeText(metric.label)}: ${sanitizeText(metric.current)} -> ${sanitizeText(metric.target)}`, margin + 10, y)
            y += 5
          })
        }

        y += 8

        // Separator line
        if (index < PAIN_POINTS_DATA.length - 1) {
          doc.setDrawColor(200, 200, 200)
          doc.line(margin, y - 4, pageWidth - margin, y - 4)
        }
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${pageCount} • Guardian Roofing & Siding`,
          pageWidth / 2,
          285,
          { align: 'center' }
        )
      }

      doc.save(`guardian-detailed-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const generateTrackerReport = async () => {
    if (initiatives.length === 0) {
      alert('No initiative data available. Please load the Tracker tab first.')
      return
    }

    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // Header
      doc.setFillColor(1, 90, 132)
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Initiative Progress Report', margin, 28)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Status Tracking • ${new Date().toLocaleDateString()}`, margin, 36)

      y = 55
      doc.setTextColor(0, 0, 0)

      // Summary stats
      const stats = {
        avgProgress: Math.round(initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length),
        completed: initiatives.filter(i => i.status === 'completed').length,
        inProgress: initiatives.filter(i => i.status === 'in_progress').length,
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Progress Summary', margin, y)
      y += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`• Average Progress: ${stats.avgProgress}%`, margin + 5, y)
      y += 6
      doc.text(`• Completed: ${stats.completed} of ${initiatives.length}`, margin + 5, y)
      y += 6
      doc.text(`• In Progress: ${stats.inProgress}`, margin + 5, y)
      y += 15

      // Individual initiatives
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Initiative Details', margin, y)
      y += 10

      initiatives
        .sort((a, b) => a.painPointId - b.painPointId)
        .forEach(init => {
          if (y > 250) {
            doc.addPage()
            y = 20
          }

          const painPoint = PAIN_POINTS_DATA.find(p => p.id === init.painPointId)
          if (!painPoint) return

          // Status color
          const statusColors = {
            not_started: [113, 128, 150],
            planning: [1, 90, 132],
            in_progress: [247, 148, 29],
            completed: [47, 133, 90],
          }
          const [r, g, b] = statusColors[init.status] || [113, 128, 150]

          doc.setFillColor(r, g, b)
          doc.roundedRect(margin, y - 4, 50, 8, 2, 2, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(8)
          doc.text(init.status.replace('_', ' ').toUpperCase(), margin + 25, y + 1, { align: 'center' })

          doc.setTextColor(0, 0, 0)
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(`#${painPoint.id}: ${sanitizeText(painPoint.name)}`, margin + 55, y)
          y += 7

          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')

          // Progress bar
          doc.setFillColor(230, 230, 230)
          doc.roundedRect(margin + 5, y, 100, 5, 2, 2, 'F')
          doc.setFillColor(r, g, b)
          doc.roundedRect(margin + 5, y, init.progress, 5, 2, 2, 'F')
          doc.text(`${init.progress}%`, margin + 110, y + 4)
          y += 10

          doc.text(`Owner: ${init.owner || painPoint.owner}`, margin + 5, y)
          if (init.targetDate) {
            doc.text(`Target: ${new Date(init.targetDate).toLocaleDateString()}`, margin + 80, y)
          }
          y += 6

          // Action items summary
          const completedActions = init.actionItems.filter(a => a.completed).length
          doc.text(`Action Items: ${completedActions}/${init.actionItems.length} completed`, margin + 5, y)
          y += 10

          doc.setDrawColor(220, 220, 220)
          doc.line(margin, y - 3, pageWidth - margin, y - 3)
        })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${pageCount} • Guardian Roofing & Siding`,
          pageWidth / 2,
          285,
          { align: 'center' }
        )
      }

      doc.save(`guardian-tracker-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Export PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Reports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={generateExecutiveSummary}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Executive Summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateDetailedReport}>
          <Target className="h-4 w-4 mr-2" />
          Detailed Pain Points
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateTrackerReport}>
          <ListTodo className="h-4 w-4 mr-2" />
          Initiative Progress
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
