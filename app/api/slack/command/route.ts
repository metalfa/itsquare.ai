import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

// Simple, direct Slack slash command handler - NO external libraries
export async function POST(request: Request) {
  try {
    // Parse form data from Slack
    const formData = await request.formData()
    const text = formData.get('text')?.toString() || ''
    const userId = formData.get('user_id')?.toString() || ''
    const userName = formData.get('user_name')?.toString() || ''
    const responseUrl = formData.get('response_url')?.toString() || ''
    const teamId = formData.get('team_id')?.toString() || ''
    
    // Immediately acknowledge to Slack (they require response within 3 seconds)
    // Then process in background
    processCommand(text, userId, userName, responseUrl, teamId)
    
    // Return immediate acknowledgment
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Slack command error:', error)
    return NextResponse.json({ 
      response_type: 'ephemeral',
      text: 'Something went wrong. Please try again.' 
    })
  }
}

// Process command in background and respond via response_url
async function processCommand(
  text: string, 
  userId: string, 
  userName: string,
  responseUrl: string,
  teamId: string
) {
  try {
    const userMessage = text.trim().toLowerCase()
    
    // Generate helpful response
    let response: string
    
    if (!userMessage || userMessage === 'help') {
      response = getHelpMessage()
    } else {
      response = await getAIResponse(userMessage, userName)
    }
    
    // Send response back to Slack
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'ephemeral', // Only visible to user
        text: response,
      }),
    })
    
    // Log the interaction
    await logInteraction(teamId, userId, userMessage, response)
    
  } catch (error) {
    console.error('Process command error:', error)
    
    // Send error response
    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: "I had trouble processing that. Here's what I can help with:\n\n" + getHelpMessage(),
        }),
      })
    }
  }
}

// Get AI response with fallback
async function getAIResponse(userMessage: string, userName: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: `You are ITSquare, a friendly IT support assistant in Slack. 
      
Your job is to help employees with tech problems quickly and simply.

Rules:
- Be concise and friendly
- Give step-by-step instructions (numbered)
- Use simple language (no jargon)
- If you can't solve it, offer to connect them with IT team
- Format for Slack (use *bold* and \`code\`)

Common issues you help with:
- WiFi/network problems
- VPN connection issues  
- Slow computer
- Printer problems
- Password resets
- Software installation
- Email issues
- Video call problems`,
      prompt: `User ${userName} says: "${userMessage}"

Provide a helpful, step-by-step solution.`,
      maxOutputTokens: 400,
    })
    
    return text
  } catch (error) {
    console.error('AI error:', error)
    // Return smart fallback based on keywords
    return getFallbackResponse(userMessage)
  }
}

// Smart fallback responses when AI fails
function getFallbackResponse(message: string): string {
  const msg = message.toLowerCase()
  
  if (msg.includes('wifi') || msg.includes('internet') || msg.includes('network') || msg.includes('connect')) {
    return `*WiFi Troubleshooting*

1. Turn WiFi off, wait 10 seconds, turn back on
2. Forget the network and reconnect
3. Restart your computer
4. Try moving closer to the router

Still not working? Reply with more details and I'll help further.`
  }
  
  if (msg.includes('slow') || msg.includes('frozen') || msg.includes('stuck') || msg.includes('hang')) {
    return `*Slow/Frozen Computer*

1. *First, try restarting* - this fixes 80% of issues
2. Close apps you're not using
3. Close extra browser tabs (they use lots of memory)
4. Check if updates are installing in the background

If it's still slow after restart, let me know what app is causing problems.`
  }
  
  if (msg.includes('printer') || msg.includes('print')) {
    return `*Printer Troubleshooting*

1. Check the printer is on and has paper
2. Check for paper jams
3. Try turning printer off and on
4. On your computer: remove the print job queue and try again

Which printer are you trying to use? I can give more specific help.`
  }
  
  if (msg.includes('vpn')) {
    return `*VPN Troubleshooting*

1. Make sure your internet works first (try google.com)
2. Quit the VPN app completely and reopen
3. Try a different server location
4. Restart your computer

Which VPN app are you using? That helps me give better advice.`
  }
  
  if (msg.includes('password') || msg.includes('login') || msg.includes('locked') || msg.includes('forgot')) {
    return `*Password/Login Help*

*Forgot password:*
1. Click "Forgot Password" on the login page
2. Check your email (and spam folder) for reset link

*Account locked:*
- Wait 15-30 minutes and try again
- Or contact IT admin for immediate unlock

Which account/app are you having trouble with?`
  }
  
  if (msg.includes('email') || msg.includes('outlook') || msg.includes('gmail')) {
    return `*Email Troubleshooting*

1. Check your internet connection
2. Try the web version (mail.google.com or outlook.office.com)
3. Close and reopen your email app
4. Check if the issue is with one email or all

What specifically is happening with your email?`
  }
  
  if (msg.includes('zoom') || msg.includes('teams') || msg.includes('meet') || msg.includes('video') || msg.includes('camera') || msg.includes('mic')) {
    return `*Video Call Troubleshooting*

*Camera/Video not working:*
1. Check if camera is covered or disabled
2. Check app permissions (Settings > Privacy > Camera)
3. Close other apps that might use camera

*Audio/Mic not working:*
1. Check if muted in the app AND on your computer
2. Check app permissions (Settings > Privacy > Microphone)
3. Try unplugging and replugging headphones

Which app are you using for video calls?`
  }
  
  // Default helpful response
  return `I can help with that! To give you the best solution, could you tell me:

1. What device are you using? (Mac/Windows/Phone)
2. What exactly happens when the problem occurs?
3. Any error messages?

Or describe the issue in more detail and I'll do my best to help!`
}

function getHelpMessage(): string {
  return `*ITSquare - Your IT Assistant*

Just describe your problem and I'll help solve it!

*Examples:*
• \`/itsquare my wifi keeps disconnecting\`
• \`/itsquare computer is running slow\`
• \`/itsquare can't connect to VPN\`
• \`/itsquare printer not working\`
• \`/itsquare forgot my password\`
• \`/itsquare zoom camera not working\`

I'll give you step-by-step solutions. If I can't solve it, I'll connect you with someone who can.`
}

// Log interaction to database
async function logInteraction(
  teamId: string,
  slackUserId: string, 
  question: string, 
  answer: string
) {
  try {
    const supabase = createAdminClient()
    await supabase.from('it_conversations').insert({
      slack_channel_id: 'slash_command',
      slack_thread_ts: `${Date.now()}`,
      messages: [
        { role: 'user', content: question },
        { role: 'assistant', content: answer }
      ],
      status: 'resolved',
    })
  } catch (e) {
    // Don't fail if logging fails
    console.error('Failed to log interaction:', e)
  }
}
