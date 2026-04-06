import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams
  
  const errorMessages: Record<string, string> = {
    'access_denied': 'Access was denied. Please try again or contact support.',
    'invalid_request': 'The authentication request was invalid. Please try signing in again.',
    'server_error': 'A server error occurred. Please try again later.',
    'temporarily_unavailable': 'The service is temporarily unavailable. Please try again later.',
    'invalid_credentials': 'Invalid email or password. Please check your credentials.',
    'email_not_confirmed': 'Please confirm your email before signing in.',
  }

  const errorMessage = params?.error 
    ? errorMessages[params.error] || params.error_description || `Error: ${params.error}`
    : 'An unexpected error occurred during authentication.'

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tighter text-foreground">
            ITsquare.ai
          </span>
        </Link>

        <Card className="bg-surface-container ghost-border">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground-variant text-center">
              {errorMessage}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="w-full bg-primary-container hover:bg-primary-container/90 text-white font-semibold"
              >
                <Link href="/auth/login">
                  <span className="flex items-center gap-2">
                    Try again
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full border-outline-variant/30 text-foreground hover:bg-surface-container-high"
              >
                <Link href="/">
                  Go to homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support link */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need help?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
