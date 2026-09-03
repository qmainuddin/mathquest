# Multi-stage Dockerfile for Python Scoring Microservice
# Syntax and base image strictly pinned to exact version and multi-arch digest

FROM python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254 AS builder

WORKDIR /build

# Install pinned uv package manager
COPY --from=ghcr.io/astral-sh/uv:0.12.7 /uv /bin/uv

# Copy dependency definition
COPY pyproject.toml ./
COPY uv.lock* ./

# Install dependencies into virtual environment
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
RUN if [ -f uv.lock ]; then \
      uv sync --frozen --no-dev --no-install-project; \
    else \
      uv pip install --system -r <(python -c "import tomllib; [print(d) for d in tomllib.load(open('pyproject.toml', 'rb'))['project']['dependencies']]"); \
    fi

# -----------------------------------------------------------------------------
# Runtime Stage
# -----------------------------------------------------------------------------
FROM python:3.12.14-slim-bookworm@sha256:782412e85d0f0984994c290652577d4018aff08145c85b262bb63dc0c7522254 AS runner

WORKDIR /app

# Create non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy virtualenv / installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY app/ ./app/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

ENV PORT=8005
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8005

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; res = urllib.request.urlopen('http://127.0.0.1:8005/healthz'); exit(0 if res.getcode() == 200 else 1)"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
