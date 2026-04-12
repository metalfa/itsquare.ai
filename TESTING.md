# ITSquare.AI — Testing Guide

## The Testing Pyramid

World-class software uses 4 layers of testing. Here's what each does and how to run it.

```
         ╱╲
        ╱  ╲        Layer 4: Smoke Tests (manual, in Slack)
       ╱    ╲       → Does the real product work end-to-end?
      ╱──────╲
     ╱        ╲     Layer 3: Integration Tests (API routes)
    ╱          ╲    → Do the API endpoints handle real requests?
   ╱────────────╲
  ╱              ╲  Layer 2: Service Tests (business logic)
 ╱                ╲ → Do the services work with mocked dependencies?
╱──────────────────╲
╲   Layer 1: Unit  ╱ → Do individual functions return correct values?
 ╲────────────────╱
```

## Quick Commands

```bash
# Run ALL tests
npm test

# Run tests in watch mode (re-runs on file change)
npm run test:watch

# Run a specific test file
npx vitest run __tests__/command-safety.test.ts

# Run tests matching a pattern
npx vitest run -t "fuzzy"

# Run with coverage report
npx vitest run --coverage

# Type check (catches errors tests don't)
npm run build

# Lint
npm run lint

# Full CI check (what to run before every merge)
npm run build && npm test && npm run lint
```

## Layer 1: Unit Tests (what we have)

These test pure functions with no external dependencies.

| Test File | What It Tests | Count |
|-----------|--------------|-------|
| `chunker.test.ts` | Text chunking for RAG | 6 |
| `command-safety.test.ts` | Command tier classification + blocked patterns | 52 |
| `command-parser.test.ts` | AI [COMMANDS] block parsing | 9 |
| `constants.test.ts` | Config values exist and are valid | ~5 |
| `context-builder.test.ts` | Investigation context → prompt text | ~5 |
| `prompts.test.ts` | System prompts contain required instructions | 3 |
| `rag.test.ts` | RAG context formatting | ~5 |
| `slack-verify.test.ts` | Slack signature verification | ~7 |

### What's Missing (add these)

```bash
# Test files that SHOULD exist:
__tests__/detect-intent.test.ts       # detectDeeperIntent + detectTroubleshootingIntent
__tests__/health-trends.test.ts       # buildTrendPrompt formatting
__tests__/diagnostic-flow.test.ts     # parseDiagnosticResponse
__tests__/thread-manager.test.ts      # mapThread, topic extraction parsing
```

## Layer 2: Service Tests (what to add next)

These test business logic with mocked Supabase/AI calls.

```typescript
// Example: __tests__/services/investigation.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }),
    rpc: () => ({ data: [], error: null }),
  }),
}))

// Mock embeddings
vi.mock('@/lib/services/embeddings', () => ({
  generateEmbedding: () => Promise.resolve(new Array(1536).fill(0)),
}))
```

## Layer 3: Integration Tests (API routes)

Test actual HTTP endpoints with mocked external services.

```typescript
// Example: __tests__/api/web-diagnostic.test.ts
import { describe, it, expect } from 'vitest'

describe('/api/agent/web-diagnostic', () => {
  it('GET with ping=1 returns 204', async () => {
    const { GET } = await import('@/app/api/agent/web-diagnostic/route')
    const req = new Request('http://localhost/api/agent/web-diagnostic?ping=1')
    // Note: NextRequest constructor may need adaptation
    // Test the ping response logic
  })

  it('POST without token returns 400', async () => {
    // ...
  })
})
```

## Layer 4: Smoke Tests (Manual in Slack)

Run these after every deploy. Copy-paste into your Slack DM with ITSquare.

### Smoke Test Script

```
TEST 1 — Basic troubleshooting (should use scan data if available)
Send: "my wifi is slow"
Expected: Specific diagnosis with numbers OR scan button. NO "I can't run commands."

TEST 2 — Simple question (should NOT show scan button)  
Send: "what's the wifi password?"
Expected: Direct answer from KB. No scan button.

TEST 3 — Hardware issue (no scan needed)
Send: "my mouse doesnt work"  
Expected: USB/Bluetooth troubleshooting steps. No "I'm scanning."

TEST 4 — Scan trigger
Send: "full scan please"
Expected: Scan button appears.

TEST 5 — Go deeper (with typo)
Send: "goo peeper"
Expected: Scan button appears (fuzzy match).

TEST 6 — Follow-up after fix
Send: "they dont work" (after getting troubleshooting steps)
Expected: Alternative steps, then escalation offer after 2-3 rounds.

TEST 7 — Health status
Send: "whats my machine health status?"
Expected: Summary with specific metrics from scan data.

TEST 8 — Scan page
Click the "Scan My Machine" button from any scan prompt.
Expected: Progress bar with steps → "All done!" → Results posted in Slack thread.
```

### Results Tracking

After each deploy, note:
- ✅ / ❌ per test
- Any unexpected responses
- AI gateway timeouts (fallback message count)
- Response time (fast = <3s, slow = >5s)

## How to Test Before Every Merge

### The "Golden Check" (run this every time)

```bash
cd ~/itsquare.ai
npm run build && npm test && echo "✅ Ready to merge"
```

If build fails → fix type errors.  
If tests fail → fix the test or the code.  
If both pass → safe to merge and deploy.

### Before a PR

```bash
# Full check
npm run build          # Type safety
npm test               # Unit + service tests
npm run lint           # Code style

# Then after deploy to Vercel preview:
# Run the smoke test script in Slack
```

## Database Migration Testing

Migrations can't be easily unit tested. Instead:

1. **Before running on prod:** Test in Supabase SQL Editor with `BEGIN; ... ROLLBACK;`
2. **Always use IF NOT EXISTS** — migrations must be idempotent
3. **After running:** Verify with a quick query:
   ```sql
   SELECT count(*) FROM device_health_snapshots;  -- should be 0 initially
   SELECT * FROM get_health_trend('some-uuid', 'some-user');  -- should return empty
   ```

## CI/CD (Future: GitHub Actions)

When ready, add `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run lint
```

This runs automatically on every push. Vercel already does the build check — this adds tests and lint.
