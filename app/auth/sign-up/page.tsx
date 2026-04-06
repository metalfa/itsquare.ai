'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react'

const benefits = [
  'Free IT security scan in under 2 minutes',
  'Connect Okta or Google Workspace securely',
  'Get benchmarked against your industry',
  'AI-powered recommendations',
]

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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
              Know your IT security posture in minutes
            </h1>
            <p className="text-muted-foreground">
              Connect your identity provider and get an instant security assessment with actionable recommendations.
            </p>
          </div>

          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <span className="text-foreground-variant">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="p-4 bg-surface-container ghost-border">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-mono">[</span>
              {' '}Trusted by 200+ companies for IT security assessments{' '}
              <span className="text-primary font-mono">]</span>
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div>
          {/* Mobile logo */}
          <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tighter text-foreground">
              ITsquare.ai
            </span>
          </Link>

          <Card className="bg-surface-container ghost-border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Create your account
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Get started with your free security scan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jane Smith"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-surface-container-lowest border-outline-variant/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">
                      Company name
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Acme Inc"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-surface-container-lowest border-outline-variant/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Work email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-surface-container-lowest border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-surface-container-lowest border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-surface-container-lowest border-outline-variant/30 focus:border-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary-container hover:bg-primary-container/90 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

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
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
