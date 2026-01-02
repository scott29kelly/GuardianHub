'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore, Message } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  Loader2,
  RefreshCw,
  Lightbulb,
  Target,
  Calendar,
  TrendingUp,
  X,
  ChevronRight,
  Globe,
  Search,
  ArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Quick action suggestions
const QUICK_ACTIONS = [
  { label: 'Quick Wins', icon: Lightbulb, prompt: 'What are the quick wins I should focus on first?' },
  { label: 'Critical Items', icon: Target, prompt: 'Show me the critical P0 priority items' },
  { label: '90-Day Plan', icon: Calendar, prompt: 'Create a 90-day implementation roadmap' },
  { label: 'ROI Analysis', icon: TrendingUp, prompt: 'What\'s the ROI potential for each pain point?' },
]

// Message bubble component
function MessageBubble({ 
  role, 
  content, 
  isLoading,
  isStreaming 
}: { 
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
  isStreaming?: boolean 
}) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex gap-3 max-w-full',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        isUser 
          ? 'bg-[#015a84] text-white' 
          : 'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] text-white',
        isStreaming && 'animate-pulse'
      )}>
        {isUser ? (
          <span className="text-xs font-semibold">You</span>
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        'flex-1 rounded-2xl px-4 py-3 max-w-[85%]',
        isUser 
          ? 'bg-gradient-to-br from-[#015a84] to-[#1E3A4F] text-white rounded-tr-sm' 
          : 'bg-muted rounded-tl-sm'
      )}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#F7941D]" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : isUser ? (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm space-y-1 my-2 list-decimal pl-4">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-medium mt-2 mb-1">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm space-y-1 my-2 list-disc pl-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm space-y-1 my-2 list-decimal pl-4">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                hr: () => <hr className="my-3 border-border/50" />,
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[#015a84]/10 dark:bg-[#015a84]/20">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/50 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-semibold text-[#015a84] dark:text-[#4da6c9] whitespace-nowrap">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-muted-foreground">{children}</td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-[#F7941D] animate-pulse ml-1" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Inline chat component (embeddable)
export function AIChat({ className }: { className?: string }) {
  const { messages, isLoading, sendMessage, startNewConversation, webSearchEnabled, toggleWebSearch } = useChatStore()
  const [input, setInput] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const lastMessageCountRef = useRef(0)

  // Smart scroll: Only auto-scroll if user is at bottom or hasn't scrolled yet
  useEffect(() => {
    // Reset scroll tracking when a new message conversation starts
    if (messages.length < lastMessageCountRef.current) {
      setUserHasScrolled(false)
      setIsAtBottom(true)
    }
    lastMessageCountRef.current = messages.length

    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollViewport) {
        // Only auto-scroll if user is already at bottom or streaming just started
        if (isAtBottom && !userHasScrolled) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight
        }
      }
    }
  }, [messages, isAtBottom, userHasScrolled])

  // Track user scroll behavior
  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollViewport) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollViewport as HTMLElement
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      
      // Consider "at bottom" if within 50px of bottom
      const atBottom = distanceFromBottom < 50
      setIsAtBottom(atBottom)
      
      // Mark that user has scrolled (only if they scroll up during streaming)
      if (!atBottom && isLoading) {
        setUserHasScrolled(true)
      }
    }

    scrollViewport.addEventListener('scroll', handleScroll)
    return () => scrollViewport.removeEventListener('scroll', handleScroll)
  }, [isLoading])

  // Reset scroll state when starting a new message
  useEffect(() => {
    if (isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setUserHasScrolled(false)
      setIsAtBottom(true)
    }
  }, [isLoading, messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const message = input.trim()
    setInput('')
    await sendMessage(message)
    inputRef.current?.focus()
  }

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return
    await sendMessage(prompt)
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollViewport) {
        scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' })
        setUserHasScrolled(false)
        setIsAtBottom(true)
      }
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-[#015a84]/10 to-[#1E3A4F]/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F7941D] to-[#E07D0C]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#1E3A4F] dark:text-white">GuardianAI</h3>
            <p className="text-[10px] text-muted-foreground">Strategic Advisor</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={startNewConversation}
          className="h-8 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F7941D]/20 to-[#015a84]/20 mx-auto mb-4">
                  <Bot className="h-8 w-8 text-[#015a84] dark:text-[#F7941D]" />
                </div>
                <h4 className="font-semibold mb-1">How can I help?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me about Guardian Roofing's 10 pain points, solutions, or strategies.
                </p>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2.5 px-3 text-left justify-start"
                      onClick={() => handleQuickAction(action.prompt)}
                    >
                      <action.icon className="h-4 w-4 mr-2 text-[#F7941D]" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => {
                  // Check if this is the last assistant message and we're loading
                  const isLastAssistantMessage = 
                    message.role === 'assistant' && 
                    index === messages.length - 1 &&
                    isLoading
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      isStreaming={isLastAssistantMessage}
                    />
                  )
                })}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                  <MessageBubble
                    role="assistant"
                    content=""
                    isLoading
                  />
                )}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
        
        {/* Scroll to bottom button - appears when user scrolls up */}
        <AnimatePresence>
          {!isAtBottom && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
            >
              <Button
                size="sm"
                onClick={scrollToBottom}
                className="h-8 shadow-lg bg-gradient-to-r from-[#F7941D] to-[#E07D0C] hover:from-[#E07D0C] hover:to-[#D06D0B] text-white"
              >
                <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
                Scroll to bottom
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            placeholder="Ask about pain points, solutions, or strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            variant={webSearchEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleWebSearch}
            className={cn(
              "h-10 w-10 shrink-0 transition-all",
              webSearchEnabled 
                ? "bg-gradient-to-r from-[#F7941D] to-[#E07D0C] hover:from-[#E07D0C] hover:to-[#D06D0B] text-white" 
                : "hover:border-[#F7941D] hover:text-[#F7941D]"
            )}
            title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
          >
            {webSearchEnabled ? (
              <Search className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-10 w-10 shrink-0 bg-gradient-to-r from-[#015a84] to-[#014668] hover:from-[#014668] hover:to-[#013a54]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Floating AI Assistant Button + Sheet
export function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { messages } = useChatStore()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Floating button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'bg-gradient-to-br from-[#F7941D] to-[#E07D0C] hover:from-[#015a84] hover:to-[#014668]',
            'transition-transform hover:scale-105'
          )}
        >
          <Sparkles className="h-6 w-6" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F7941D] text-[10px] font-bold text-white">
              {messages.length}
            </span>
          )}
        </Button>
      </motion.div>

      {/* Sheet panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <AIChat className="h-full" />
        </SheetContent>
      </Sheet>
    </>
  )
}

// Compact inline widget for embedding in cards
export function AIQuickAsk({ 
  context,
  placeholder = "Ask GuardianAI..." 
}: { 
  context?: string
  placeholder?: string 
}) {
  const { sendMessage, isLoading } = useChatStore()
  const [input, setInput] = useState('')
  const [showChat, setShowChat] = useState(false)

  const handleAsk = async () => {
    if (!input.trim() || isLoading) return
    const message = context 
      ? `${context}\n\nQuestion: ${input.trim()}`
      : input.trim()
    setInput('')
    setShowChat(true)
    await sendMessage(message)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          disabled={isLoading}
          className="flex-1 h-9 text-sm"
        />
        <Button 
          size="sm"
          onClick={handleAsk} 
          disabled={isLoading || !input.trim()}
          className="h-9 bg-[#015a84] hover:bg-[#014668]"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
