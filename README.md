# MathQuest

[![CI](https://github.com/qmainuddin/mathquest/actions/workflows/ci.yml/badge.svg)](https://github.com/qmainuddin/mathquest/actions/workflows/ci.yml)
[![Security Audit](https://github.com/qmainuddin/mathquest/actions/workflows/security.yml/badge.svg)](https://github.com/qmainuddin/mathquest/actions/workflows/security.yml)

MathQuest is a puzzle-based mathematics learning platform designed for primary-school children (ages 7–11) and their guardians.

- **Production URL**: [https://mathquest.mainuddintalukdar.cloud](https://mathquest.mainuddintalukdar.cloud)
- **Deployment Host**: Hostinger VPS behind an existing global Caddy reverse proxy (`stack-caddy-1`) on the `stack` Docker network.
- **Database & Auth**: Supabase Cloud PostgreSQL with Row Level Security (RLS) and Passwordless Guardian Auth.
- **Architecture**:
  - `apps/web`: Next.js 16 (App Router, TypeScript 7, React 19) standalone container acting as authenticated Backend-for-Frontend (BFF).
  - `services/scoring`: Python 3.12 FastAPI microservice providing deterministic mastery scoring and next-practice recommendations on internal port `8005`.
  - `packages/contracts`: Shared TypeScript data contracts and Pydantic validation schemas.
  - Zero host ports published in production; all external traffic arrives via Caddy on the `stack` network.

---

## 1. System Architecture & Traffic Flow

```text
[ Internet Client ]
        |
        | HTTPS (Port 443 / 80)
        v
[ stack-caddy-1 ]  (on Docker network: stack)
        |
        | Reverse Proxy HTTP -> mathquest-web:3000
        v
[ mathquest-web ]  (on networks: stack AND mathquest-internal)
        |
        +-----> [ Supabase Cloud ] (Auth & PostgreSQL via strict RLS)
        |
        | Private HTTP -> mathquest-scoring:8005
        | (Header: X-Internal-Secret, X-Correlation-ID)
        v
[ mathquest-scoring ] (on network: mathquest-internal ONLY)
```

### Invariant Privacy & Security Principles
1. **Strict Server-Side Grading**: Question answers and solutions are **never** delivered to client browsers. Answer validation is executed server-side against private database tables.
2. **Child Privacy First (COPPA / GDPR-K)**: Children do not have email accounts, passwords, or public profiles. Only guardians authenticate. Child records require only a nickname and an age/year band. Full birth dates, locations, and chat logs are never collected.
3. **Microservice Isolation**: `mathquest-scoring` listens on port **8005** (relocated from 8000 to prevent collisions with host services like `tradiepulse-ai-agent`). It has no public internet access and requires `X-Internal-Secret`.

---

## 2. Pinned Tooling & Dependency Baseline

All runtimes, container bases, and GitHub actions are strictly pinned:

| Component | Selected Version / Digest | Status |
| :--- | :--- | :--- |
| **Node.js** | `24.20.0` | Active LTS ("Krypton") |
| **Node Docker Base** | `node:24.20.0-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e` | Immutable Multi-Arch Digest |
| **Python** | `3.12.14` | Active Maintenance Release |
| **Python Docker Base** | `python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254` | Immutable Multi-Arch Digest |
| **pnpm** | `11.25.0` | Frozen lockfile |
| **Astral uv** | `0.12.7` | Frozen lockfile |
| **Next.js** | `16.3.4` | App Router, Standalone Build |
| **React** | `19.2.8` | Concurrent UI |
| **TypeScript** | `7.0.2` | Static Type Safety |
| **Tailwind CSS** | `4.3.3` | Styling Engine |
| **FastAPI** | `0.141.1` | Python Scoring Microservice |
| **Supabase JS** | `2.114.0` | Client SDK |
| **Supabase CLI** | `2.116.0` | Dev Tooling |

---

## 3. Deterministic Developer Commands (`Makefile`)

Both CI and local developers run the exact same deterministic targets:

```bash
make versions                   # Print verified tool and runtime versions
make setup                      # Install monorepo dependencies with frozen lockfiles
make dev                        # Launch development environment
make lint                       # Run linters across packages
make format-check               # Verify code formatting
make typecheck                  # Run TypeScript and Python type checks
make test                       # Run full test suite (unit and integration)
make test-unit                  # Run unit tests
make test-integration           # Run integration and answer masking tests
make test-e2e                   # Run Playwright E2E scenarios
make build                      # Build packages and Next.js standalone app
make docker-build               # Build production Docker images locally
make dependency-check           # Enforce zero floating version policy
make check-runtime-consistency  # Verify all configuration files agree on exact versions
make migration-check            # Validate Supabase migrations and RLS tests
make health                     # Verify internal and external health checks
make deploy                     # Deploy release tag to Hostinger VPS
make rollback                   # Roll back to last-known-good release on VPS
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js `24.20.0` (or managed via `.nvmrc` / `.tool-versions`)
- Python `3.12.14`
- `pnpm@11.25.0` (`corepack enable && corepack prepare pnpm@11.25.0 --activate`)
- Astral `uv@0.12.7`

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/qmainuddin/mathquest.git
cd mathquest

# 2. Verify runtimes and dependency policy
make check-runtime-consistency
make dependency-check

# 3. Install dependencies
make setup

# 4. Copy environment template
cp .env.example .env.local

# 5. Run tests
make test
```

---

## 5. Hostinger VPS Deployment & Caddy Integration

### Initial Caddy Setup
Inspect your existing `stack-caddy-1` container on the VPS:
```bash
docker inspect stack-caddy-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```
Add the MathQuest snippet (`infra/caddy/mathquest.caddy`):
```caddyfile
mathquest.mainuddintalukdar.cloud {
    encode zstd gzip
    reverse_proxy mathquest-web:3000
}
```
Reload Caddy safely without downtime:
```bash
docker exec -w /etc/caddy stack-caddy-1 caddy reload
```

### Production Deployment
Deployments are performed automatically on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`), or manually:
```bash
IMAGE_TAG=<full-git-commit-sha> make deploy
```

---

## 6. Architecture Documentation & Runbooks

- [System Architecture Specification](docs/specs/000-bootstrap.spec.md)
- [Dependency Baseline & Support Status](docs/dependency-baseline.md)
- [Architecture Decision Records (ADRs)](docs/adr/)
- [First-Time Hostinger VPS Setup Runbook](docs/runbooks/first-time-vps-setup.md)
- [Deployment Runbook](docs/runbooks/deployment.md)
- [Rollback Runbook](docs/runbooks/rollback.md)
- [Troubleshooting Runbook (14 Failure Modes)](docs/runbooks/troubleshooting.md)

---

## 7. Automated Test Suites & Test Cases

MathQuest includes a multi-layered automated test matrix covering microservice scoring, recommendation heuristics, browser security invariants, and database multi-tenancy. Run all suites with `make test`.

```text
======================================================================
Ran 18 microservice tests in 0.001s (OK)
Ran 6 web unit tests (1..6 ok)
Ran 4 integration & answer masking tests (1..4 ok)
Total: 28 automated test cases verified across all components (100% pass)
======================================================================
```

### 7.1 Python Scoring Engine Test Class (`TestScoringEngine`)
Location: [`services/scoring/tests/test_engine.py`](services/scoring/tests/test_engine.py)

| Test Case | Objective & Invariant Verified |
| :--- | :--- |
| `test_insufficient_data_less_than_three_attempts` | Flags `< 3` attempts with `is_sufficient_data=False`, returns `INSUFFICIENT_DATA` and `NEEDS_MORE_ATTEMPTS` reason codes. |
| `test_perfect_score_high_accuracy` | Verifies `100.0` composite score on consecutive clean attempts without hints; asserts `HIGH_ACCURACY`, `FIRST_TRY_MASTERY`, and `CONFIDENT_PACING`. |
| `test_zero_correct_lowest_score` | Validates score floors when all answers are wrong (`accuracy_rate=0.0`); asserts `ACCURACY_NEEDS_PRACTICE` and `FREQUENT_HINT_OR_RETRY`. |
| `test_duration_clamping` | Enforces lower duration bound (clamped to `3,000ms`) and upper bound (clamped to `60,000ms`) so frantic tapping or idle pauses never skew pace score. |
| `test_hint_and_retry_penalty` | Compares clean first-attempt success against multiple attempts with hints, asserting strictly higher score and attempt efficiency for clean answers. |
| `test_recency_weighting` | Proves that a learner improving over time scores higher than a deteriorating learner with the same overall count of correct answers. |
| `test_sample_count_confidence_scaling` | Tests progressive confidence intervals: `< 5` samples = `0.50`, `5–9` samples = `0.75`, `≥ 10` samples = `1.00`. |
| `test_moderate_accuracy_reason_code` | Asserts that ~75% accuracy triggers the explainable `MODERATE_ACCURACY` badge. |
| `test_deliberate_pacing_reason_code` | Asserts that responses averaging `> 45s` trigger `DELIBERATE_PACING` rather than an unfair accuracy penalty. |
| `test_score_stays_bounded_between_0_and_100` | Property-based boundary check across extreme input permutations ensuring composite score remains strictly within `[0.0, 100.0]`. |

### 7.2 Topic Recommender Test Class (`TestTopicRecommender`)
Location: [`services/scoring/tests/test_recommender.py`](services/scoring/tests/test_recommender.py)

| Test Case | Objective & Invariant Verified |
| :--- | :--- |
| `test_initial_recommendation_is_foundation` | New learners with zero attempts are always guided to the foundational `number_sense` topic. |
| `test_prerequisite_gating` | Prevents unlocking `addition_subtraction` if foundational mastery in `number_sense` is below threshold (`< 60.0`). |
| `test_unlocks_next_topic_when_prerequisite_met` | Unlocks `addition_subtraction` and issues `TOPIC_PREREQUISITES_SATISFIED` once prerequisite topic reaches mastery. |
| `test_recommends_lowest_mastery_among_unlocked` | When multiple topics are unlocked, prioritizes the topic with the lowest confidence-adjusted mastery score (`LOWEST_CONFIDENCE_ADJUSTED_MASTERY`). |
| `test_recommends_new_unlocked_topic_when_ready` | Prioritizes introducing a freshly unlocked topic over repeating already-mastered curriculum. |
| `test_fractions_prerequisite_gating` | Confirms advanced topics like `fractions` remain locked until multiplication and division prerequisites are satisfied. |
| `test_all_topics_mastered_returns_valid_recommendation` | Safe fallback handling when all topics exceed `85.0` mastery, recommending the topic most in need of refresher practice without crashing. |
| `test_lesson_id_matches_topic_first_lesson` | Ensures the recommender provides a valid `recommended_lesson_id` corresponding to the introductory lesson for that topic. |

### 7.3 Web Scoring Client Resiliency Suite
Location: [`apps/web/tests/unit/scoring-client.test.mjs`](apps/web/tests/unit/scoring-client.test.mjs)

| Test Case | Objective & Invariant Verified |
| :--- | :--- |
| `Scoring Fallback: 100% Accuracy` | Computes bounded score (`100`) locally when Python scoring service is unreachable or degraded. |
| `Scoring Fallback: Insufficient Data` | Correctly flags `< 3` attempts as insufficient data in fallback mode. |
| `Scoring Fallback: Partial Accuracy` | Validates fallback score and `NEEDS_PRACTICE` reason code on 66% accuracy. |
| `Scoring Fallback: Zero Attempts` | Handles zero-attempt edge case safely with `0.5` base confidence and empty samples. |
| `Scoring Fallback: Confidence Scaling` | Scales confidence to `0.75` when sample count reaches `≥ 5`. |
| `Scoring Fallback: Recommendation Structure` | Ensures fallback recommendation payload matches the contracts interface with valid fields and explanations. |

### 7.4 Security, RLS & Answer Masking Suite
Location: [`apps/web/tests/integration/answer-masking.test.mjs`](apps/web/tests/integration/answer-masking.test.mjs) & [`supabase/tests/`](supabase/tests/)

| Test Case | Objective & Invariant Verified |
| :--- | :--- |
| `Answer Masking: Client Source Payloads` | Asserts `INITIAL_QUESTIONS` source definition contains zero `correct_answer`, `solution`, or `isCorrect` fields. |
| `Answer Masking: RLS on Solutions Table` | Asserts PostgreSQL migration enables RLS on `question_solutions` and defines zero `SELECT` policies for `anon` or `authenticated`. |
| `Answer Masking: Server Solution Mapping` | Verifies every seeded question has a private server-side entry in `MOCK_SOLUTIONS` for grading. |
| `Security: SECURITY DEFINER Search Path` | Verifies stored procedures (`evaluate_question_answer`, `delete_child_data`) specify `SECURITY DEFINER` and `SET search_path = public` to prevent search path hijacking. |
| `Database RLS: Cross-Tenant Isolation` | SQL test files (`01_rls_profiles.sql` to `04_answer_masking.sql`) verify anonymous callers cannot read profiles, children, sessions, or solution rows. |

### 7.5 Playwright End-to-End Test Matrix
Location: [`apps/web/tests/e2e/guardian-child-flow.spec.ts`](apps/web/tests/e2e/guardian-child-flow.spec.ts)

- **Case 1 & 2**: Guardian landing page exploration and passwordless dashboard access.
- **Case 3, 4 & 5**: Child puzzle session startup, network-level inspection asserting answers are absent from responses, and server-side attempt grading.
- **Case 7 & 8**: Session completion, mastery score calculation, and "Practise Next" recommendation card rendering.
- **Case 11**: Full COPPA/GDPR-K cascade child profile deletion workflow.
- **Case 12**: Client bundle inspection ensuring `SUPABASE_SERVICE_ROLE_KEY` and `INTERNAL_SERVICE_TOKEN` never leak into browser JavaScript.

---

## 8. Phase 2 Expansion Roadmap & Architectural Requirements

Phase 1 established a secure, containerized foundation with deterministic scoring, server-side grading, and zero-PII child safety. Phase 2 extends MathQuest into an adaptive, multimodal learning platform for home and classroom environments.

### 8.1 Adaptive Learning & Bayesian Knowledge Tracing (BKT)
- **Item Response Theory (IRT / Rasch Model)**: Move beyond composite heuristics to calibrate item difficulty ($b_i$) and learner ability ($\theta_k$).
- **Bayesian Knowledge Tracing (BKT)**: Model latent mastery states per sub-skill with transition probabilities (slip $s$, guess $g$, transit $T$, initial $L_0$).
- **Computerized Adaptive Testing (CAT)**: Adjust within-lesson question difficulty in real time based on previous response vectors, ensuring children stay in their Zone of Proximal Development (ZPD).
- **FastAPI Migration**: Maintain the existing `BaseScoringEngine` interface contract in `services/scoring/app/engine.py` so the ML/BKT model can be swapped in without modifying frontend route handlers.

### 8.2 Interactive Canvas Manipulatives & Concrete-Pictorial-Abstract (CPA)
- **Virtual Manipulatives**: Add interactive visual tools to the lesson player:
  - Base-10 blocks (hundreds flats, tens rods, unit cubes) for place value regrouping.
  - Interactive number lines with jump arrows for addition/subtraction bridging.
  - Rectangular array generators with draggable grid dimensions for multiplication.
  - Interactive fraction bars with splitting/merging actions.
- **Concrete-Pictorial-Abstract (CPA) Progression**: Scaffold puzzles into 3 stages: concrete visual manipulation, pictorial representation, and abstract symbolic notation.

### 8.3 Audio Narration & Multi-Modal Accessibility
- **Text-to-Speech (TTS) Prompt Narration**: Integrate high-quality, friendly speech audio for question prompts, visual descriptions, and clues (critical for emerging readers aged 7–8 and ESL learners).
- **Dyslexia-Friendly Typography**: Add user-selectable OpenDyslexic typeface and adjustable letter spacing.
- **High-Contrast & Colorblind Safe Palettes**: Ensure visual puzzles utilize distinct shapes/patterns in addition to color coding.
- **Localization (i18n)**: Full localization support starting with Te Reo Māori, Spanish, and French curriculum strands.

### 8.4 Guardian Insights & Printable Offline Quest Packs
- **Progress Insights Dashboard**: Provide guardians with clear learning velocity charts, mastery timelines, and celebration milestones without comparative percentiles or anxiety-inducing metrics.
- **Weekly Learning Digest Email**: Opt-in email summarizing weekly highlights and conversation starters (e.g. *"Ask Alex how they grouped apples into arrays this week!"*).
- **Offline Printable Quest Packs**: Automatically generate printable PDF worksheets tailored to the child's lowest mastery areas for zero-screen-time offline practice.

### 8.5 School & Classroom Mode (FERPA / COPPA Compliant)
- **Teacher Dashboard**: Enable educators to manage student cohorts, assign specific curriculum modules, and review aggregate topic readiness.
- **Pseudonymous Student Onboarding**: School SSO with Google Classroom and Clever utilizing tokenized student IDs—guaranteeing no student email addresses, full names, or tracking identifiers are collected.
- **Exportable Standard Alignments**: Map lessons and mastery metrics to curriculum standards (NZ Curriculum Levels 2–4, UK National Curriculum Key Stage 2, and US Common Core State Standards).

### 8.6 Offline-First Progressive Web App (PWA)
- **Service Worker Caching**: Cache core interactive puzzle assets and visual counters for offline usage on tablets and road trips.
- **IndexedDB Sync Queue**: Store question attempts and timestamps locally in browser storage when offline, replaying and synchronizing with Next.js BFF endpoints upon network reconnection.

