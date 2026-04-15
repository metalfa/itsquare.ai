import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-foreground-variant mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-bold mb-4">Overview</h2>
            <p className="text-foreground-variant leading-relaxed">
              ITSquare.AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an AI-powered IT support agent that lives in Slack.
              This policy explains what data we collect, how we use it, who we share it with,
              and your rights regarding that data. By installing ITSquare.AI, you agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">What Data We Collect</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              When you install and use ITSquare.AI, we collect and store the following:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                <strong className="text-foreground">Slack workspace information</strong> — workspace ID,
                workspace name, and the OAuth access token required for the bot to operate.
                Tokens are encrypted at rest using AES-256-GCM.
              </li>
              <li>
                <strong className="text-foreground">Slack user identifiers</strong> — the Slack user ID
                of employees who interact with the bot. We do not collect names or email addresses
                unless explicitly provided.
              </li>
              <li>
                <strong className="text-foreground">Conversation messages</strong> — messages sent to
                the ITSquare.AI bot in direct messages and @mentions are stored to power
                multi-turn conversations, build resolution history, and improve future responses
                within your workspace.
              </li>
              <li>
                <strong className="text-foreground">Device diagnostic data</strong> — when a user
                consents to a browser-based device scan, we collect hardware metrics (CPU, RAM, disk,
                network speed) to assist with IT troubleshooting. This data is linked to the
                user&apos;s Slack ID and stored per workspace.
              </li>
              <li>
                <strong className="text-foreground">Knowledge base content</strong> — documents
                uploaded by administrators to train the bot are stored and chunked for
                vector search (RAG). This content stays within your workspace and is
                never shared with other workspaces.
              </li>
              <li>
                <strong className="text-foreground">Usage data</strong> — aggregate counts of
                conversations per workspace for billing and service operation purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">How We Use AI (OpenAI)</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              ITSquare.AI uses <strong className="text-foreground">OpenAI&apos;s API</strong> (specifically
              GPT-4o-mini and text-embedding-3-small) to generate IT support responses and
              create vector embeddings for knowledge search.
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                User messages are sent to OpenAI&apos;s API to generate helpful responses.
                OpenAI processes this data under their{" "}
                <a
                  href="https://openai.com/policies/api-data-usage-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  API data usage policy
                </a>
                .
              </li>
              <li>
                <strong className="text-foreground">We do not use your data to train AI models.</strong>{" "}
                OpenAI does not use API data for model training by default.
              </li>
              <li>
                Messages sent to OpenAI are limited to what is necessary to answer the
                user&apos;s current IT question — we do not send your entire message history
                to OpenAI unless needed for context in the same conversation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Data Storage &amp; Security</h2>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                All data is stored in <strong className="text-foreground">Supabase</strong> (hosted
                on AWS in the United States) using PostgreSQL with row-level security enabled
                on all tables.
              </li>
              <li>
                Slack OAuth tokens are encrypted at rest using AES-256-GCM before being
                stored in the database.
              </li>
              <li>
                All data is transmitted over HTTPS/TLS. We do not transmit data over
                unencrypted channels.
              </li>
              <li>
                Data is isolated per Slack workspace — one workspace cannot access another
                workspace&apos;s conversations, knowledge base, or device data.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Data Sharing</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              We share data with the following third-party services strictly to operate ITSquare.AI:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                <strong className="text-foreground">OpenAI</strong> — to generate AI responses
                and embeddings. Governed by OpenAI&apos;s{" "}
                <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> — database hosting.
                Governed by Supabase&apos;s{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — application hosting and
                serverless infrastructure. Governed by Vercel&apos;s{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Stripe</strong> — payment processing for
                Pro subscriptions. We share only what is necessary for billing. Governed by
                Stripe&apos;s{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Privacy Policy
                </a>.
              </li>
            </ul>
            <p className="text-foreground-variant leading-relaxed mt-4">
              We do not sell your data. We do not share your data with advertisers or
              any third parties beyond the service providers listed above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Data Retention</h2>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>
                Conversation data is retained for as long as your workspace has ITSquare.AI installed.
              </li>
              <li>
                When you uninstall ITSquare.AI from Slack, your workspace&apos;s OAuth token is
                immediately invalidated. Upon written request, all workspace data (conversations,
                device scans, knowledge base) will be permanently deleted within 30 days.
              </li>
              <li>
                Billing records are retained for 7 years as required by financial regulations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Slack Data Usage</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              ITSquare.AI accesses Slack data solely to provide IT support functionality. Specifically:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li>We read messages only in direct messages with the bot and channels where the bot is @mentioned.</li>
              <li>We do not read or store messages in channels where the bot has not been explicitly mentioned.</li>
              <li>We do not access private channels unless explicitly invited.</li>
              <li>We do not access files, emails, or calendar data.</li>
              <li>We use Slack&apos;s Events API to receive messages in real time. We do not store raw Slack event payloads beyond what is needed to generate a response.</li>
            </ul>
            <p className="text-foreground-variant leading-relaxed mt-4">
              Our use of Slack APIs complies with{" "}
              <a href="https://api.slack.com/developer-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Slack&apos;s API Terms of Service
              </a>{" "}
              and{" "}
              <a href="https://slack.com/intl/en-us/terms-of-service/user" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Slack&apos;s Platform Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Your Rights (GDPR / CCPA)</h2>
            <p className="text-foreground-variant leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), United Kingdom, or California,
              you have the following rights:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-foreground-variant leading-relaxed">
              <li><strong className="text-foreground">Access</strong> — request a copy of data we hold about you</li>
              <li><strong className="text-foreground">Correction</strong> — request correction of inaccurate data</li>
              <li><strong className="text-foreground">Deletion</strong> — request permanent deletion of your data</li>
              <li><strong className="text-foreground">Portability</strong> — request your data in a machine-readable format</li>
              <li><strong className="text-foreground">Objection</strong> — object to processing of your data</li>
            </ul>
            <p className="text-foreground-variant leading-relaxed mt-4">
              To exercise any of these rights, contact us at{" "}
              <Link href="mailto:brucelee@itsquare.ai" className="text-primary hover:underline">
                brucelee@itsquare.ai
              </Link>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Children&apos;s Privacy</h2>
            <p className="text-foreground-variant leading-relaxed">
              ITSquare.AI is a business-to-business service intended for use by companies and their
              employees. We do not knowingly collect data from anyone under the age of 16.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-foreground-variant leading-relaxed">
              We may update this policy as the product evolves. When we make material changes,
              we will update the &quot;Last updated&quot; date at the top of this page and notify
              workspace administrators via Slack where possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <p className="text-foreground-variant leading-relaxed">
              For privacy inquiries, data deletion requests, or questions about this policy:
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
