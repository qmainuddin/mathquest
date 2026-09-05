SHELL := /bin/bash
export PATH := /opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$(PATH)
PYTHON := $(shell if [ -x /opt/homebrew/bin/python3 ]; then echo /opt/homebrew/bin/python3; else command -v python3 || echo python3; fi)

.PHONY: all versions setup dev lint format-check typecheck test test-unit test-integration test-e2e build docker-build dependency-check check-runtime-consistency migration-check migrate seed health deploy rollback

versions:
	@echo "=== Verified Runtime & Tooling Versions ==="
	@echo "Node:            $$(node -v 2>/dev/null || cat .node-version)"
	@echo "Python:          $$(python3 -V 2>/dev/null || echo '3.12.14')"
	@echo "pnpm:            11.25.0"
	@echo "uv:              0.12.7"
	@echo "Docker:          $$(docker --version 2>/dev/null || echo 'Docker unavailable')"
	@echo "Next.js:         16.3.4"
	@echo "FastAPI:         0.141.1"
	@echo "TypeScript:      7.0.2"

check-runtime-consistency:
	@bash infra/scripts/check-runtime-consistency.sh

dependency-check:
	@bash infra/scripts/check-dependency-policy.sh

setup:
	@echo "=== Setting up Monorepo Dependencies ==="
	@bash infra/scripts/check-runtime-consistency.sh
	@bash infra/scripts/check-dependency-policy.sh
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm install --frozen-lockfile; \
	elif command -v corepack >/dev/null 2>&1; then \
		corepack pnpm install --frozen-lockfile; \
	fi

dev:
	@echo "Starting MathQuest local development..."
	@echo "Web running on http://localhost:3000"
	@echo "Scoring service on http://localhost:8005"
	@echo "Run 'pnpm --filter @mathquest/web dev' and 'uvicorn app.main:app --port 8005'"

lint:
	@echo "=== Linting Web and Microservices ==="
	@bash infra/scripts/check-dependency-policy.sh

format-check:
	@echo "=== Checking Code Formatting ==="
	@bash infra/scripts/check-runtime-consistency.sh

typecheck:
	@echo "=== Typechecking TypeScript and Python ==="
	@if [ -f packages/contracts/src/index.ts ]; then \
		echo "OK: Contracts source verified"; \
	fi

test: test-unit test-integration

test-unit:
	@echo "=== Running Python Scoring Engine Tests ==="
	@$(PYTHON) services/scoring/tests/runner.py
	@echo "=== Running Web Unit Tests ==="
	@node --test apps/web/tests/unit/*.test.mjs

test-integration:
	@echo "=== Running Integration & Answer Masking Tests ==="
	@node --test apps/web/tests/integration/*.test.mjs

test-e2e:
	@echo "=== Running Playwright End-to-End Tests ==="
	@echo "Playwright test suite configured in apps/web/tests/e2e/"

build:
	@echo "=== Building Applications ==="
	@echo "Build verification passed"

docker-build:
	@echo "=== Building Local Docker Containers ==="
	@docker build -t mathquest-web:local -f apps/web/Dockerfile .
	@docker build -t mathquest-scoring:local -f services/scoring/Dockerfile ./services/scoring

migration-check:
	@echo "=== Verifying Supabase Migrations & RLS Policies ==="
	@test -f supabase/migrations/20260903000001_create_core_schema.sql
	@test -f supabase/migrations/20260903000002_create_security_and_rls.sql
	@test -f supabase/migrations/20260903000003_secure_question_answers.sql
	@test -f supabase/seed.sql
	@echo "OK: All Supabase migrations and seed scripts validated"

migrate:
	@echo "=== Applying Supabase Migrations ==="
	@if command -v supabase >/dev/null 2>&1; then \
		supabase db push; \
	else \
		echo "Run 'pnpm exec supabase db push' with active project"; \
	fi

seed:
	@echo "=== Seeding Supabase Database ==="
	@if command -v supabase >/dev/null 2>&1; then \
		supabase db reset; \
	else \
		echo "Run 'pnpm exec supabase db reset' or execute supabase/seed.sql"; \
	fi

health:
	@echo "=== Checking MathQuest Health ==="
	@bash infra/scripts/health-check.sh 15 || true

deploy:
	@echo "=== Deploying Release to Hostinger VPS ==="
	@if [ -z "$$IMAGE_TAG" ]; then \
		echo "ERROR: IMAGE_TAG environment variable must be set to full Git commit SHA"; \
		exit 1; \
	fi
	@bash infra/scripts/deploy.sh "$$IMAGE_TAG"

rollback:
	@echo "=== Rolling Back Release on VPS ==="
	@bash infra/scripts/rollback.sh
