import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
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
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center bg-primary/10 border border-primary/20">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Check your email
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {"We've sent you a confirmation link"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground-variant text-center">
              Click the link in your email to verify your account and start your first security scan. The link will expire in 24 hours.
            </p>

            <div className="p-4 bg-surface-container-low ghost-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                {"Didn't receive the email?"}
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full p-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Back to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Support link */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Having trouble?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
