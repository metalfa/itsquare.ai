'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Shield, CheckCircle2, Zap, MessageSquare, Laptop, ShieldCheck } from 'lucide-react'

const benefits = [
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Get started in seconds with your Slack account',
  },
  {
    icon: MessageSquare,
    title: 'AI IT Support in Slack',
    description: 'Ask IT questions and get instant answers via DM',
  },
  {
    icon: Laptop,
    title: 'Device Health Monitoring',
    description: 'Scan your device and get security recommendations',
  },
  {
    icon: ShieldCheck,
    title: 'Security Insights',
    description: 'Get benchmarked against your industry standards',
  },
]

function SlackLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.522 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.521 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zm0-1.27a2.527 2.527 0 0 1-2.521-2.522 2.527 2.527 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#ECB22E"/>
    </svg>
  )
}

function SignUpForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Benefits */}
        <div className="hidden md:block space-y-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tighter text-foreground">
                ITsquare.ai
              </span>
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-4">
              Your AI IT department, right in Slack
            </h1>
            <p className="text-muted-foreground">
              Sign up with Slack to get instant AI-powered IT support, device health monitoring, and security insights - all without leaving Slack.
            </p>
          </div>

          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="p-1.5 bg-secondary/10 border border-secondary/20 mt-0.5">
                  <benefit.icon className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="p-4 bg-surface-container ghost-border">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-mono">[</span>
              {' '}Trusted by 200+ companies for IT security{' '}
              <span className="text-primary font-mono">]</span>
            </p>
          </div>
        </div>

        {/* Right side - Slack Sign Up */}
        <div>
          {/* Mobile logo */}
          <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter text-foreground">
              ITsquare.ai
            </span>
          </Link>

          <Card className="bg-surface-container ghost-border">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Get started with Slack
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                One click to sign up and install the bot in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {message === 'no_account' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
                  No account found with that Slack email. Please sign up first.
                </div>
              )}

              <Button
                asChild
                className="w-full h-12 bg-[#4A154B] hover:bg-[#4A154B]/90 text-white font-semibold text-base"
              >
                <a href="/api/slack/install?mode=signup">
                  <SlackLogo className="h-5 w-5 mr-3" />
                  Continue with Slack
                </a>
              </Button>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>Creates your account automatically</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>Installs the ITSquare bot in your workspace</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                  <span>No password needed - use Slack to sign in</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface-container px-2 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full ghost-border hover:bg-surface-container-high"
              >
                <Link href="/auth/login">
                  Sign in
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="grid-bg min-h-screen flex items-center justify-center p-6">
        <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
