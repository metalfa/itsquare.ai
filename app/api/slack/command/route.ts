import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

// Test endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'ITSquare slash command endpoint is running',
    timestamp: new Date().toISOString()
  })
}

// Slack slash command handler
export async function POST(request: Request) {
  console.log('[ITSquare] POST received')
  
  try {
    const formData = await request.formData()
    const text = formData.get('text')?.toString() || ''
    const userId = formData.get('user_id')?.toString() || ''
    const userName = formData.get('user_name')?.toString() || ''
    const responseUrl = formData.get('response_url')?.toString() || ''
    const teamId = formData.get('team_id')?.toString() || ''
    
    console.log('[ITSquare] Command:', text, 'User:', userName)
    
    // Use after() to process in background while returning 200 immediately
    after(async () => {
      await processCommand(text, userId, userName, responseUrl, teamId)
    })
    
    // Return 200 immediately (Slack requires < 3 second response)
    return new NextResponse(null, { status: 200 })
    
  } catch (error) {
    console.error('[ITSquare] Error:', error)
    return NextResponse.json({ 
      response_type: 'ephemeral',
      text: 'Something went wrong. Please try again.' 
    })
  }
}

// Process in background
async function processCommand(
  text: string, 
  userId: string, 
  userName: string,
  responseUrl: string,
  teamId: string
) {
  console.log('[ITSquare] Processing:', text)
  
  try {
    const userMessage = text.trim()
    let response: string
    
    if (!userMessage || userMessage.toLowerCase() === 'help') {
      response = getHelpMessage()
    } else {
      response = await getAIResponse(userMessage, userName)
    }
    
    console.log('[ITSquare] Sending response to Slack')
    
    const slackRes = await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'ephemeral',
        text: response,
      }),
    })
    
    console.log('[ITSquare] Slack responded:', slackRes.status)
    
  } catch (error) {
    console.error('[ITSquare] Process error:', error)
    
    try {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: "Sorry, I had trouble processing that. Try again or type `/itsquare help`",
        }),
      })
    } catch (e) {
      console.error('[ITSquare] Failed to send error:', e)
    }
  }
}

// Get AI response
async function getAIResponse(userMessage: string, userName: string): Promise<string> {
  console.log('[ITSquare] AI request for:', userMessage)
  
  const systemPrompt = `You are ITSquare, a friendly IT support assistant in Slack.

Help employees fix tech problems with clear, simple steps.

Rules:
- Be concise and warm
- Give numbered steps
- Use simple language (no jargon)
- Format for Slack: *bold*, \`code\`
- If unsolvable, offer to connect with IT team

You help with: WiFi, VPN, slow computers, printers, passwords, email, video calls.`

  try {
    const { text } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: systemPrompt,
      prompt: `${userName} says: "${userMessage}"\n\nProvide a helpful solution.`,
      maxOutputTokens: 400,
    })
    
    console.log('[ITSquare] AI success, length:', text?.length)
    return text
    
  } catch (error) {
    console.error('[ITSquare] AI failed:', error)
    return getFallbackResponse(userMessage)
  }
}

// Fallback when AI fails
function getFallbackResponse(msg: string): string {
  const m = msg.toLowerCase()
  
  if (m.includes('wifi') || m.includes('internet') || m.includes('network')) {
    return `*WiFi Troubleshooting*

1. Turn WiFi off, wait 10 seconds, turn back on
2. Forget the network and reconnect
3. Restart your computer
4. Move closer to the router

Still stuck? Let me know more details.`
  }
  
  if (m.includes('slow') || m.includes('frozen') || m.includes('stuck')) {
    return `*Slow Computer Fix*

1. *Restart your computer* (fixes 80% of issues)
2. Close apps you're not using
3. Close extra browser tabs
4. Check for updates

Still slow? Tell me what's happening.`
  }
  
  if (m.includes('printer') || m.includes('print')) {
    return `*Printer Help*

1. Check printer is on and has paper
2. Check for paper jams
3. Turn printer off and on
4. Remove stuck print jobs and retry

Which printer is it?`
  }
  
  if (m.includes('vpn')) {
    return `*VPN Fix*

1. Check internet works first (try google.com)
2. Quit VPN app completely and reopen
3. Try a different server
4. Restart computer

Which VPN are you using?`
  }
  
  if (m.includes('password') || m.includes('login') || m.includes('locked')) {
    return `*Password Help*

*Forgot password:*
Click "Forgot Password" and check email

*Account locked:*
Wait 15-30 min, or contact IT admin

Which account?`
  }
  
  if (m.includes('email') || m.includes('outlook') || m.includes('gmail')) {
    return `*Email Fix*

1. Check internet connection
2. Try web version (gmail.com or outlook.com)
3. Close and reopen email app
4. Sign out and back in

What's happening specifically?`
  }
  
  if (m.includes('zoom') || m.includes('teams') || m.includes('camera') || m.includes('mic')) {
    return `*Video Call Fix*

*Camera not working:*
1. Check if camera is covered
2. Check app permissions (Settings > Privacy > Camera)

*Mic not working:*
1. Check if muted (app AND computer)
2. Check app permissions

Which app?`
  }
  
  return `I can help! Tell me:

1. What device? (Mac/Windows)
2. What happens exactly?
3. Any error messages?

Or just describe the problem in more detail.`
}

function getHelpMessage(): string {
  return `*ITSquare - Your AI IT Assistant*

Just describe your problem:

• \`/itsquare wifi keeps disconnecting\`
• \`/itsquare computer running slow\`
• \`/itsquare can't print\`
• \`/itsquare VPN not connecting\`
• \`/itsquare forgot password\`

I'll give you step-by-step solutions. If I can't fix it, I'll connect you with IT.`
}
