# ADR 0004: Private Python Scoring Microservice on Port 8005

## Status
Accepted

## Context
MathQuest requires mastery scoring and recommendation logic that can evolve from deterministic rules into machine learning / adaptive learning algorithms. Python is the industry standard for scientific and ML computing. However, on the production Hostinger VPS (`srv1702496`), port 8000 is already bound to `tradiepulse-ai-agent`.

## Trade-off Analysis:
- **Benefits**:
  - Clean separation of ML/data science logic from web presentation.
  - Future model training and inference pipelines can be introduced without modifying the public Next.js contract.
  - Isolation of heavy Python runtime from node process.
- **Costs**:
  - Adds private networking, multi-container orchestration, inter-service contracts, and failure handling complexity.
- **Decision**:
  - Acceptable because isolating the scoring service is a foundational project objective.
  - `mathquest-scoring` runs on container port **8005** inside private Docker network `mathquest-internal`.
  - Zero host ports published. The scoring service is completely unreachable from the public internet.

## Consequences
- No port conflict with `tradiepulse-ai-agent:8000` or other VPS services.
- Next.js includes circuit breaker / fallback handling if the scoring service is temporarily unreachable.
