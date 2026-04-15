import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="max-w-3xl mx-auto px-8 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground-variant hover:text-primary mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-black tracking-tighter mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-foreground-variant mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground-variant leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of ITSquare.AI,
              a Slack-integrated AI IT support service operated by IT Square, Inc.
              (&quot;IT Square&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
              By installing ITSquare.AI in your Slack workspace or using any of our services,
              you agree to be bound by these Terms on behalf of yourself and your organization.
              If you do not agree, do not install or use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              ITSquare.AI is a cloud-hosted AI IT support agent that integrates with your Slack
              workspace. The service allows employees to ask IT-related questions, run device
              diagnostics, and receive AI-generated troubleshooting assistance — all within Slack.
            </p>
            <p className="text-foreground-variant leading-relaxed">
              The service is provided on a subscription basis. We offer a free tier with limited
              monthly usage and a paid Pro plan. Pricing and plan details are available at{" "}
              <Link href="https://itsquare.ai/#pricing" className="text-primary hover:underline">
                itsquare.ai
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Eligibility &amp; Account Registration</h2>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                You must be at least 18 years old and have the authority to bind your organization
                to these Terms in order to install ITSquare.AI.
              </li>
              <li>
                You must be a Slack workspace administrator or have permission from your
                workspace administrator to install third-party apps.
              </li>
              <li>
                You are responsible for ensuring that your use of ITSquare.AI complies with
                your organization&apos;s internal policies and any applicable laws.
              </li>
              <li>
                You agree to provide accurate account information and keep it up to date.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. Slack Platform Compliance</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              ITSquare.AI is built on the Slack platform. Your use of ITSquare.AI is also subject to:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                <a href="https://slack.com/intl/en-us/terms-of-service/user" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Slack&apos;s Terms of Service
                </a>
              </li>
              <li>
                <a href="https://api.slack.com/developer-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Slack&apos;s API Terms of Service
                </a>
              </li>
              <li>
                <a href="https://slack.com/intl/en-us/terms-of-service/app-developer-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Slack&apos;s App Developer Policy
                </a>
              </li>
            </ul>
            <p className="text-foreground-variant leading-relaxed mt-4">
              We will not use Slack APIs in any manner that violates Slack&apos;s platform policies.
              We access only the data necessary to provide IT support functionality — messages
              sent directly to the bot or @mentions in channels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Subscription &amp; Billing</h2>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                <strong className="text-foreground">Free Plan:</strong> Limited to 50 AI conversations
                per month per workspace. No payment required.
              </li>
              <li>
                <strong className="text-foreground">Pro Plan:</strong> Unlimited conversations at
                $8 per user per month, billed monthly. Pricing is subject to change with 30 days&apos;
                notice to current subscribers.
              </li>
              <li>
                Payments are processed by <strong className="text-foreground">Stripe</strong>.
                By subscribing, you authorize us to charge your payment method on a recurring
                monthly basis until you cancel.
              </li>
              <li>
                <strong className="text-foreground">Cancellation:</strong> You may cancel your
                subscription at any time from your billing dashboard. Your Pro access continues
                until the end of the current billing period. No refunds are issued for partial months.
              </li>
              <li>
                If a payment fails, we will notify you and attempt to retry. Continued failure
                may result in downgrade to the Free plan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">6. Acceptable Use</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              You agree not to use ITSquare.AI to:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit malware, spam, or harmful content through the service</li>
              <li>Attempt to reverse engineer, scrape, or extract data from our systems</li>
              <li>Circumvent usage limits or access controls</li>
              <li>Use the service to harass, threaten, or harm individuals</li>
              <li>Attempt to manipulate or jailbreak the AI to produce harmful output</li>
              <li>Resell, sublicense, or white-label the service without written permission</li>
            </ul>
            <p className="text-foreground-variant leading-relaxed mt-4">
              We reserve the right to suspend or terminate access for any violation of these rules
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">7. AI-Generated Content &amp; Disclaimer</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              ITSquare.AI uses large language models (OpenAI GPT-4o-mini) to generate responses.
              You acknowledge that:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                AI-generated responses may be inaccurate, incomplete, or outdated.
                They are provided for informational and troubleshooting assistance only
                and do not constitute professional IT advice.
              </li>
              <li>
                You are responsible for verifying AI-generated suggestions before applying
                them to critical systems or infrastructure.
              </li>
              <li>
                We are not liable for any damage, data loss, or system failure resulting
                from following AI-generated recommendations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">8. Data &amp; Privacy</h2>
            <p className="text-foreground-variant leading-relaxed">
              Your use of ITSquare.AI is also governed by our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. Key points:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed mt-4">
              <li>We store conversation data to provide the service. Data is encrypted and isolated per workspace.</li>
              <li>Messages are processed by OpenAI to generate responses. We do not use your data to train AI models.</li>
              <li>You may request deletion of all workspace data within 30 days of uninstalling the app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">9. Intellectual Property</h2>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                <strong className="text-foreground">Our IP:</strong> ITSquare.AI, its code, design,
                brand, and underlying technology are owned by IT Square, Inc. These Terms do not
                grant you any ownership rights in our service.
              </li>
              <li>
                <strong className="text-foreground">Your content:</strong> You retain ownership of
                all content you upload (knowledge base documents, messages). By using the service,
                you grant us a limited license to process that content solely to provide IT support
                responses within your workspace.
              </li>
              <li>
                <strong className="text-foreground">Feedback:</strong> If you submit suggestions or
                feedback, we may use them to improve the service without obligation to you.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">10. Service Availability &amp; SLA</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              We strive for high availability but do not guarantee uninterrupted service.
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                We may perform scheduled maintenance with advance notice where possible.
              </li>
              <li>
                Service availability depends on third-party providers including Slack, OpenAI,
                Supabase, and Vercel. Outages from these providers are outside our control.
              </li>
              <li>
                Free plan users are not entitled to uptime guarantees or priority support.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">11. Limitation of Liability</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                IT Square shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages arising from your use of or inability to use the service.
              </li>
              <li>
                Our total aggregate liability to you for any claims arising out of or related to
                these Terms shall not exceed the amount you paid us in the 3 months preceding
                the claim, or $100, whichever is greater.
              </li>
              <li>
                These limitations apply regardless of the legal theory under which damages are
                sought, even if IT Square has been advised of the possibility of such damages.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">12. Indemnification</h2>
            <p className="text-foreground-variant leading-relaxed">
              You agree to indemnify and hold harmless IT Square, Inc. and its officers, directors,
              employees, and agents from any claims, damages, losses, or expenses (including
              reasonable legal fees) arising from your use of the service, your violation of
              these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">13. Termination</h2>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                You may terminate your use of ITSquare.AI at any time by uninstalling the app
                from your Slack workspace and canceling any active subscription.
              </li>
              <li>
                We may suspend or terminate your access immediately if you violate these Terms,
                fail to pay for a Pro subscription, or if required by law or Slack&apos;s policies.
              </li>
              <li>
                Upon termination, your right to use the service ends immediately. Sections 7,
                9, 11, 12, and 14 survive termination.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">14. Governing Law &amp; Disputes</h2>
            <p className="text-foreground-variant leading-relaxed">
              These Terms are governed by the laws of the State of Illinois, United States,
              without regard to its conflict of law provisions. Any disputes arising from these
              Terms shall be resolved in the courts of Cook County, Illinois. If you are located
              outside the United States, you agree to submit to the jurisdiction of Illinois courts
              for any disputes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">15. Changes to Terms</h2>
            <p className="text-foreground-variant leading-relaxed">
              We may update these Terms from time to time. When we make material changes, we will
              update the &quot;Last updated&quot; date at the top of this page and, where feasible,
              notify workspace administrators via Slack. Continued use of the service after
              changes take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">16. Contact</h2>
            <p className="text-foreground-variant leading-relaxed">
              For questions about these Terms:
            </p>
            <div className="mt-3 text-foreground-variant leading-relaxed">
              <p>IT Square, Inc.</p>
              <p>Chicago, Illinois, USA</p>
              <p>
                <Link href="mailto:brucelee@itsquare.ai" className="text-primary hover:underline">
                  brucelee@itsquare.ai
                </Link>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
