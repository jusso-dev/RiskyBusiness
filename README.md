# RiskyBusiness

RiskyBusiness is a portfolio-grade loan application risk simulator. It lets users create synthetic borrower profiles, submit simulated loan applications, configure policy weights, run deterministic scoring, compare policy outcomes, generate AI-assisted risk notes, and export Markdown reports.

> RiskyBusiness is a simulation and portfolio project only. It does not provide financial advice, credit advice, lending decisions, or real-world loan approvals.

## Features

- Next.js 15 App Router, TypeScript, Tailwind CSS, Recharts, Zod
- Synthetic borrower and application data with organisation-scoped model design
- Deterministic 0-100 risk scoring engine with per-signal explanations
- Configurable policy profiles: Conservative, Balanced, Growth, Custom Sandbox
- Signal Tuning Lab for live weight and requested amount what-if analysis
- Mock AI risk narrative provider, plus OpenAI-compatible provider fallback
- Dashboard, application detail, analytics, audit log, settings, and reports
- Prisma schema, Docker Compose, Redis/BullMQ worker stub, Vitest coverage

## Screenshots

Add screenshots after running the local app:

- Dashboard overview
- Application detail with signal breakdown
- Signal Tuning Lab before and after comparison
- Portfolio analytics

## Architecture

```mermaid
flowchart LR
  User[User] --> UI[Next.js Web App]
  UI --> API[API Routes]
  API --> DB[(PostgreSQL)]
  API --> Queue[(Redis / BullMQ)]
  Queue --> Worker[Simulation Worker]
  API --> Engine[Deterministic Scoring Engine]
  Engine --> DB
  API --> AI[AI Narrative Provider]
  AI --> Notes[Risk Notes]
```

The current demo uses in-memory seed data so it works immediately. The Prisma schema models the intended persistent PostgreSQL layer.

## Data Model

Core entities:

- `Organisation`, `User`, `OrganisationMember`
- `Borrower`, `LoanApplication`
- `RiskSignal`, `RiskPolicyProfile`, `RiskPolicySignalConfig`
- `ScoreResult`, `ScoreSignalResult`
- `AiRiskNote`, `AuditLog`, `SimulationRun`

Protected attributes such as race, religion, disability, gender, and political affiliation are intentionally excluded.

## Scoring Engine

The score is deterministic and reproducible:

1. Load borrower, application, and selected policy profile.
2. Calculate raw signal values such as debt-to-income, loan-to-income, cash buffer, credit score, recent defaults, and loan-to-value.
3. Normalize each signal to 0-100 simulated risk.
4. Apply configured signal weights.
5. Calculate category scores and total risk score.
6. Map thresholds to `Simulated Approve`, `Simulated Manual Review`, or `Simulated Decline`.
7. Store signal-level explanations and audit events.

Default Balanced thresholds:

- `0-39`: Simulated Approve
- `40-69`: Simulated Manual Review
- `70-100`: Simulated Decline

## AI Narrative System

AI is separate from scoring. It never overrides the deterministic result.

- `MockAiRiskNarrativeProvider` works without an API key.
- `OpenAiRiskNarrativeProvider` supports OpenAI-compatible chat completions when configured.
- Prompts instruct the model to avoid real credit-decision claims, financial/legal advice, protected-attribute inference, and invented facts.

## Signal Tuning Lab

The lab is the main demo flow:

1. Select a seeded application.
2. Select a policy profile.
3. Increase debt-to-income and recent-defaults weights.
4. Adjust requested amount.
5. Compare original and current simulated outcomes.
6. Inspect the waterfall chart and explanation text.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Services:

- `app`: Next.js application
- `postgres`: PostgreSQL 16
- `redis`: Redis 7
- `worker`: BullMQ simulation worker stub

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/riskybusiness
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=dev-secret
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

Use `AI_PROVIDER=mock` for local development without external services.

## Seed Data

The app ships with:

- 10 synthetic borrowers
- 15 loan applications across personal, car, business, equipment finance, and debt consolidation loans
- 15 configurable risk signals
- Conservative, Balanced, Growth, and Custom Sandbox policies

## Testing

```bash
npm run test
npm run build
```

Vitest covers DTI, LTI, cash buffer, credit score normalization, signal weighting, total scoring, policy comparison, mock AI output, and validation.

## Responsible AI

RiskyBusiness is educational. Real credit systems require legal, regulatory, statistical, privacy, security, fairness, model governance, monitoring, and human review processes. AI-generated notes should be reviewed by humans and treated as narrative explanations of supplied simulator data only.

## Roadmap

- Persist seed data through Prisma and PostgreSQL
- Add Playwright end-to-end flows
- Add CSV import/export
- Add Markdown-to-PDF reports
- Add human review queue
- Add hosted demo deployment guide
