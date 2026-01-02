import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PAIN_POINTS_DATA, getPainPointsContextForAI, getPainPointById } from '@/lib/pain-points-data'

// LLM Configuration - DeepSeek V3.2-Speciale (primary) with FOSS fallback
const LLM_CONFIG = {
  // Primary: DeepSeek direct API (cheapest, fastest)
  // Fallback: Together AI for Llama 3.3 70B (best FOSS alternative)
  primary: {
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat', // V3.2-Speciale is the default chat model
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  fallback: {
    provider: 'together',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', // Best FOSS Dec 2025
    apiKeyEnv: 'TOGETHER_API_KEY',
  },
}

// System prompt for the AI assistant (with web search capability)
const SYSTEM_PROMPT_WITH_TOOLS = `You are GuardianAI, an expert strategic advisor for Guardian Roofing & Siding. 
You have deep knowledge of the company's 10 strategic pain points for 2026 and can provide insights, recommendations, and action plans.

Your capabilities:
1. Answer questions about any of the 10 pain points
2. Provide prioritization recommendations
3. Suggest quick wins and implementation strategies
4. Help create 90-day initiative plans
5. Identify dependencies between pain points
6. Calculate potential ROI and impact
7. **Search the web** for real-time information, industry trends, competitive intelligence, and best practices

CRITICAL RULES FOR WEB SEARCH:
- When you use web_search, ONLY report information that is EXPLICITLY stated in the search results
- NEVER fill in gaps with assumed or hallucinated information
- If the search results don't contain specific information, say "I couldn't find specific information about [topic]"
- Always cite your sources when using web search results
- If search results are unclear or conflicting, acknowledge the uncertainty

When you need current information (market trends, pricing, regulations, case studies, tools), use the web_search function.

Always be:
- Concise and actionable
- Focused on business outcomes
- Specific with recommendations
- Aware of resource constraints
- HONEST about what you found vs. didn't find

Here is your knowledge base of Guardian Roofing's 10 Pain Points:

${getPainPointsContextForAI()}

When referencing pain points, always cite them by number (e.g., "Pain Point #1: Lead Intake").
Format responses with clear headers and bullet points for readability.`

// System prompt for fallback (no web search)
const SYSTEM_PROMPT_NO_TOOLS = `You are GuardianAI, an expert strategic advisor for Guardian Roofing & Siding. 
You have deep knowledge of the company's 10 strategic pain points for 2026 and can provide insights, recommendations, and action plans.

Your capabilities:
1. Answer questions about any of the 10 pain points
2. Provide prioritization recommendations
3. Suggest quick wins and implementation strategies
4. Help create 90-day initiative plans
5. Identify dependencies between pain points
6. Calculate potential ROI and impact

IMPORTANT: You do NOT have access to the internet or web search. If asked about current events, specific people (like CEOs), or real-time information you don't have, clearly state: "I don't have access to search the web for this information. I can only help with Guardian Roofing's 10 strategic pain points."

Always be:
- Concise and actionable
- Focused on business outcomes
- Specific with recommendations
- Aware of resource constraints
- HONEST about what you don't know

Here is your knowledge base of Guardian Roofing's 10 Pain Points:

${getPainPointsContextForAI()}

When referencing pain points, always cite them by number (e.g., "Pain Point #1: Lead Intake").
Format responses with clear headers and bullet points for readability.`

// Web search function definition
const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for current information, industry trends, best practices, pricing, tools, or case studies. Use this when you need real-time or up-to-date information beyond the knowledge base.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Be specific and include relevant keywords.',
        },
      },
      required: ['query'],
    },
  },
}

// Perform web search using Tavily API
async function webSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  
  if (!apiKey) {
    return 'Web search unavailable (no TAVILY_API_KEY configured). DO NOT make up information - say you cannot search the web.'
  }
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced', // Better results
        include_answer: true,
        max_results: 5,
      }),
    })
    
    if (!response.ok) {
      console.error('Tavily API error:', await response.text())
      return `Web search failed. DO NOT make up information - tell the user the search failed.`
    }
    
    const data = await response.json()
    
    // Log what we got
    console.log(`  📄 Tavily returned ${data.results?.length || 0} results`)
    if (data.answer) {
      console.log(`  📝 Quick answer: ${data.answer.slice(0, 100)}...`)
    }
    
    // Format results for LLM with strict instructions
    let searchResults = `IMPORTANT: Only use information explicitly stated below. If the answer isn't in these results, say "I couldn't find specific information about that."\n\n`
    
    if (data.answer) {
      searchResults += `## Quick Answer\n${data.answer}\n\n`
    }
    
    if (data.results && data.results.length > 0) {
      searchResults += `## Search Results\n\n`
      data.results.forEach((result: any, idx: number) => {
        searchResults += `**${idx + 1}. ${result.title}**\n`
        searchResults += `${result.content}\n`
        searchResults += `Source: ${result.url}\n\n`
      })
    } else {
      searchResults += `No results found for this query. Tell the user you couldn't find this information.\n`
    }
    
    return searchResults
  } catch (error) {
    console.error('Web search error:', error)
    return `Web search encountered an error. DO NOT make up information - tell the user the search failed.`
  }
}

// Call LLM via OpenAI-compatible API with function calling support
async function callLLM(
  messages: Array<{ role: string; content: string; tool_calls?: any; tool_call_id?: string; name?: string }>,
  config: typeof LLM_CONFIG.primary,
  useTools: boolean = false
): Promise<{ content: string; tool_calls?: any[] }> {
  const apiKey = process.env[config.apiKeyEnv]
  
  if (!apiKey) {
    throw new Error(`NO_API_KEY:${config.provider}`)
  }
  
  // Use appropriate system prompt based on tool capability
  const systemPrompt = useTools ? SYSTEM_PROMPT_WITH_TOOLS : SYSTEM_PROMPT_NO_TOOLS
  
  const requestBody: any = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 2048,
  }
  
  // Only add tools for DeepSeek (Together AI Llama doesn't support it well)
  if (useTools && config.provider === 'deepseek') {
    requestBody.tools = [WEB_SEARCH_TOOL]
  }
  
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error(`${config.provider} API Error:`, error)
    throw new Error(`${config.provider} API error: ${response.status}`)
  }
  
  const data = await response.json()
  const message = data.choices?.[0]?.message
  
  if (!message) {
    console.error('Unexpected API response:', JSON.stringify(data).slice(0, 500))
    throw new Error('No message in LLM response')
  }
  
  // Clean up any DSML markup from the response
  let cleanContent = message.content || ''
  if (cleanContent) {
    // Remove DSML/XML-style markup that DeepSeek sometimes outputs
    cleanContent = cleanContent.replace(/<\s*\|\s*DSML\s*\|[^>]*>/gi, '')
    cleanContent = cleanContent.replace(/<\/\s*\|\s*DSML\s*\|[^>]*>/gi, '')
    cleanContent = cleanContent.replace(/<\s*\|\s*[^>]+\s*\|>/gi, '')
    cleanContent = cleanContent.trim()
  }
  
  return {
    content: cleanContent,
    tool_calls: message.tool_calls,
  }
}

// Try primary (DeepSeek), fallback to secondary (Llama 3.3), then local
async function generateAIResponse(
  messages: Array<{ role: string; content: string; tool_calls?: any; tool_call_id?: string; name?: string }>
): Promise<{ response: string; provider: string }> {
  // Try DeepSeek V3.2-Speciale first (with tool support)
  try {
    const result = await callLLM(messages, LLM_CONFIG.primary, true)
    
    // Handle function calls
    if (result.tool_calls && result.tool_calls.length > 0) {
      console.log(`✓ DeepSeek requesting ${result.tool_calls.length} tool call(s)`)
      
      // Process each tool call
      const toolMessages = [...messages]
      
      // Add assistant's tool call request
      toolMessages.push({
        role: 'assistant',
        content: result.content,
        tool_calls: result.tool_calls,
      })
      
      // Execute each tool and add results
      for (const toolCall of result.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)
        
        console.log(`  → Calling ${functionName}(${JSON.stringify(functionArgs)})`)
        
        let toolResult = ''
        if (functionName === 'web_search') {
          toolResult = await webSearch(functionArgs.query)
        }
        
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: toolResult,
        })
      }
      
      // Call LLM again with tool results
      const finalResult = await callLLM(toolMessages, LLM_CONFIG.primary, false)
      console.log('✓ Response from DeepSeek V3.2-Speciale (with tools)')
      return { response: finalResult.content, provider: 'deepseek' }
    }
    
    console.log('✓ Response from DeepSeek V3.2-Speciale')
    return { response: result.content, provider: 'deepseek' }
  } catch (primaryError: any) {
    console.log(`DeepSeek unavailable: ${primaryError.message}`)
  }
  
  // Fallback to Llama 3.3 70B via Together AI (no tools)
  try {
    const result = await callLLM(messages, LLM_CONFIG.fallback, false)
    console.log('✓ Response from Llama 3.3 70B (fallback)')
    console.log(`  Content length: ${result.content.length} chars`)
    return { response: result.content, provider: 'together-llama' }
  } catch (fallbackError: any) {
    console.log(`Llama fallback unavailable: ${fallbackError.message}`)
  }
  
  // No LLM available - throw error (no silent local fallback)
  throw new Error('NO_LLM_CONFIGURED')
}

// Simple AI response without external API (fallback mode)
function generateLocalResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()
  
  // Find mentioned pain points
  const mentionedPoints = PAIN_POINTS_DATA.filter(p => 
    lowerMessage.includes(p.name.toLowerCase()) ||
    lowerMessage.includes(`#${p.id}`) ||
    lowerMessage.includes(`pain point ${p.id}`) ||
    lowerMessage.includes(p.category.toLowerCase())
  )

  // Quick wins query
  if (lowerMessage.includes('quick win') || lowerMessage.includes('easy win') || lowerMessage.includes('low hanging')) {
    const quickWins = PAIN_POINTS_DATA.filter(p => p.quickWin === 'High' && p.effort <= 6)
    return `## 🎯 Quick Wins for Guardian Roofing

Based on high ROI potential and lower implementation effort, here are your best quick wins:

${quickWins.map(p => `### Pain Point #${p.id}: ${p.name}
- **Impact:** ${p.impact}/10 | **Effort:** ${p.effort}/10
- **Owner:** ${p.owner}
- **Solution:** ${p.solution}
- **First Action:** ${p.actionItems[0]}`).join('\n\n')}

**Recommendation:** Start with Pain Point #4 (Production Handoffs) - it has the highest impact-to-effort ratio and can show results within 30 days.`
  }

  // Priority/critical query
  if (lowerMessage.includes('priority') || lowerMessage.includes('critical') || lowerMessage.includes('p0') || lowerMessage.includes('urgent')) {
    const critical = PAIN_POINTS_DATA.filter(p => p.priority === 'P0')
    return `## 🚨 Critical Priority Items (P0)

These require immediate attention due to their high business impact:

${critical.map(p => `### Pain Point #${p.id}: ${p.name}
- **Impact:** ${p.impact}/10
- **Business Cost:** ${p.whyCostly}
- **Owner:** ${p.owner}
- **Solution:** ${p.solution}`).join('\n\n')}

**Strategic Note:** While all P0 items are critical, Pain Point #9 (Leadership Bottleneck) is a force multiplier - solving it accelerates progress on all other initiatives.`
  }

  // ROI query
  if (lowerMessage.includes('roi') || lowerMessage.includes('return') || lowerMessage.includes('value') || lowerMessage.includes('cost')) {
    return `## 💰 ROI Analysis Summary

### Highest Revenue Impact
1. **#1 Lead Intake** - Direct revenue recovery through faster lead response
2. **#2 Sales Rep Performance** - Revenue multiplier through rep enablement
3. **#9 Leadership Bottleneck** - Strategic capacity unlock

### Highest Cost Reduction
1. **#4 Production Handoffs** - 25% rework reduction potential
2. **#5 Scheduling & Capacity** - 20% margin improvement through utilization
3. **#6 Vendor Quality** - Callback cost elimination

### Fastest Payback (< 90 days)
1. **#7 Homeowner Communication** - Immediate staff time savings
2. **#4 Production Handoffs** - Quick checklist implementation
3. **#1 Lead Intake** - Lead routing automation

Would you like me to create a detailed ROI projection for any specific pain point?`
  }

  // 90-day plan query
  if (lowerMessage.includes('90') || lowerMessage.includes('plan') || lowerMessage.includes('roadmap') || lowerMessage.includes('timeline')) {
    return `## 📅 Recommended 90-Day Roadmap

### Month 1: Foundation (Days 1-30)
- **Week 1-2:** Launch Pain Point #4 (Production Handoffs)
  - Create mandatory handoff checklist
  - Implement digital handoff form
- **Week 3-4:** Begin Pain Point #7 (Homeowner Communication)
  - Build automated status notifications
  - Set up FAQ automation

### Month 2: Acceleration (Days 31-60)
- **Week 5-6:** Launch Pain Point #1 (Lead Intake)
  - Implement unified lead capture
  - Set up automated qualification scoring
- **Week 7-8:** Begin Pain Point #9 (Leadership Bottleneck)
  - Document decision authority matrix
  - Create functional ownership chart

### Month 3: Scale (Days 61-90)
- **Week 9-10:** Expand automation coverage
  - AI-assisted lead scoring
  - Customer portal launch
- **Week 11-12:** Measure and optimize
  - Review metrics against targets
  - Plan Phase 2 initiatives

**Success Metrics to Track:**
- Lead response time: >24h → <15min
- Rework rate: 25% → <10%
- Customer satisfaction: 3.8 → 4.2

Would you like me to detail the action items for any specific phase?`
  }

  // Specific pain point query
  if (mentionedPoints.length > 0) {
    const point = mentionedPoints[0]
    return `## Pain Point #${point.id}: ${point.name}

### Overview
- **Priority:** ${point.priority} | **Category:** ${point.category}
- **Impact:** ${point.impact}/10 | **Effort:** ${point.effort}/10
- **Owner:** ${point.owner}
- **Quick Win Potential:** ${point.quickWin}

### The Problem
${point.pain}

### Business Impact
${point.whyCostly}

### Recommended Solution
${point.solution}

### Action Items
${point.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

### Success Metrics
${point.metrics.map(m => `- **${m.label}:** ${m.current} → ${m.target}`).join('\n')}

Would you like me to create a detailed implementation plan or identify dependencies with other pain points?`
  }

  // General overview
  if (lowerMessage.includes('overview') || lowerMessage.includes('summary') || lowerMessage.includes('all') || lowerMessage.includes('list')) {
    return `## 📊 Guardian Roofing 2026 Pain Points Overview

### By Priority
**P0 - Critical (4 items):** #1 Lead Intake, #5 Scheduling, #8 Data Fragmentation, #9 Leadership
**P1 - High (4 items):** #2 Sales Performance, #4 Handoffs, #6 Crew Quality, #10 Training
**P2 - Medium (2 items):** #3 Insurance Claims, #7 Homeowner Communication

### By Category
- **Sales (2):** Lead Intake, Sales Performance
- **Operations (4):** Handoffs, Scheduling, Crew Quality, Training
- **Claims (1):** Insurance Process
- **Customer Experience (1):** Homeowner Communication
- **Technology (1):** Data Fragmentation
- **Leadership (1):** Leadership Bottleneck

### Quick Stats
- 🎯 Quick Wins: 4 items with High ROI potential
- ⚡ Average Impact: 7.9/10
- 📊 Solution Types: Automation (40%), Standardization (35%), Centralization (25%)

What would you like to explore? I can help with:
- Detailed analysis of any pain point
- Quick wins and prioritization
- 90-day implementation roadmaps
- ROI projections
- Dependency mapping`
  }

  // Default helpful response
  return `## 🤖 How Can I Help?

I'm GuardianAI, your strategic advisor for the 2026 Pain Points initiative. I can help you with:

### Quick Actions
- **"Show me quick wins"** - Low-effort, high-impact opportunities
- **"What's critical?"** - P0 priority items needing immediate attention
- **"Create a 90-day plan"** - Phased implementation roadmap

### Deep Dives
- **"Tell me about [pain point name]"** - Detailed analysis
- **"What's the ROI?"** - Cost/benefit analysis
- **"Show dependencies"** - How pain points connect

### Specific Questions
- Ask about any of the 10 pain points by name or number
- Ask about categories (Sales, Operations, etc.)
- Ask about owners or solution types

What would you like to explore?`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, useWebSearch = false, stream = true } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { title: message.slice(0, 50) },
        include: { messages: true },
      })
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    })

    // Build conversation history for LLM
    const conversationHistory = conversation.messages.map(m => ({
      role: m.role,
      content: m.content,
    }))
    conversationHistory.push({ role: 'user', content: message })

    // STREAMING MODE
    if (stream) {
      const encoder = new TextEncoder()
      
      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Check for LLM availability
            const deepseekKey = process.env.DEEPSEEK_API_KEY
            const togetherKey = process.env.TOGETHER_API_KEY
            
            if (!deepseekKey && !togetherKey) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                error: 'No LLM configured. Please add DEEPSEEK_API_KEY or TOGETHER_API_KEY to your .env file.',
                setup: {
                  primary: 'DEEPSEEK_API_KEY - Get from https://platform.deepseek.com/api_keys',
                  fallback: 'TOGETHER_API_KEY - Get from https://api.together.xyz/settings/api-keys',
                }
              })}\n\n`))
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              return
            }
            
            // Try DeepSeek with streaming and optional web search
            try {
              let fullResponse = ''
              const config = LLM_CONFIG.primary
              const apiKey = process.env[config.apiKeyEnv]
              
              if (apiKey) {
                const systemPrompt = useWebSearch ? SYSTEM_PROMPT_WITH_TOOLS : SYSTEM_PROMPT_NO_TOOLS
                const requestBody: any = {
                  model: config.model,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory,
                  ],
                  temperature: 0.7,
                  max_tokens: 2048,
                  stream: true,
                }
                
                // Only add tools if web search is enabled
                if (useWebSearch) {
                  requestBody.tools = [WEB_SEARCH_TOOL]
                }
                
                const llmResponse = await fetch(config.endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify(requestBody),
                })
                
                if (llmResponse.ok && llmResponse.body) {
                  const reader = llmResponse.body.getReader()
                  const decoder = new TextDecoder()
                  
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    
                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))
                    
                    for (const line of lines) {
                      const data = line.replace(/^data: /, '').trim()
                      if (data === '[DONE]') continue
                      if (!data) continue
                      
                      try {
                        const parsed = JSON.parse(data)
                        const content = parsed.choices?.[0]?.delta?.content || ''
                        
                        if (content) {
                          // Clean DSML markup in real-time
                          const cleanContent = content
                            .replace(/<\s*\|\s*DSML\s*\|[^>]*>/gi, '')
                            .replace(/<\/\s*\|\s*DSML\s*\|[^>]*>/gi, '')
                            .replace(/<\s*\|\s*[^>]+\s*\|>/gi, '')
                          
                          fullResponse += cleanContent
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: cleanContent })}\n\n`))
                        }
                      } catch (e) {
                        // Skip invalid JSON
                      }
                    }
                  }
                  
                  // Save the complete response
                  await prisma.message.create({
                    data: {
                      conversationId: conversation.id,
                      role: 'assistant',
                      content: fullResponse,
                    },
                  })
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`))
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  controller.close()
                  return
                }
              }
            } catch (deepseekError) {
              console.warn('DeepSeek streaming failed:', deepseekError)
            }
            
            // Fallback to non-streaming
            try {
              const result = await generateAIResponse(conversationHistory)
              
              // Stream the fallback response word by word for better UX
              const words = result.response.split(' ')
              for (const word of words) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`))
                await new Promise(resolve => setTimeout(resolve, 30)) // Simulate streaming
              }
              
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  role: 'assistant',
                  content: result.response,
                },
              })
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`))
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            } catch (fallbackError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'All LLM providers unavailable' })}\n\n`))
              controller.close()
            }
          } catch (error) {
            console.error('Streaming error:', error)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`))
            controller.close()
          }
        },
      })
      
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // NON-STREAMING MODE (fallback)
    let response: string
    let provider: string
    
    try {
      const result = await generateAIResponse(conversationHistory)
      response = result.response
      provider = result.provider
    } catch (llmError: any) {
      if (llmError.message === 'NO_LLM_CONFIGURED') {
        return NextResponse.json({
          error: 'No LLM configured. Please add DEEPSEEK_API_KEY or TOGETHER_API_KEY to your .env file.',
          setup: {
            primary: 'DEEPSEEK_API_KEY - Get from https://platform.deepseek.com/api_keys',
            fallback: 'TOGETHER_API_KEY - Get from https://api.together.xyz/settings/api-keys',
          }
        }, { status: 503 })
      }
      throw llmError
    }

    // Find referenced pain points for metadata
    const referencedIds = PAIN_POINTS_DATA
      .filter(p => response.includes(`#${p.id}`) || response.includes(p.name))
      .map(p => p.id)

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
        referencedPainPoints: JSON.stringify(referencedIds),
      },
    })

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversation.id,
      provider,
    })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

// GET conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      return NextResponse.json(conversation)
    }

    // Return all conversations
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
