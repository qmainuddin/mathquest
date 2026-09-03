import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scoringUrl = process.env.SCORING_SERVICE_URL || 'http://127.0.0.1:8005';
  let scoringStatus = 'disconnected';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${scoringUrl}/healthz`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      scoringStatus = 'connected';
    }
  } catch {
    scoringStatus = 'degraded';
  }

  return NextResponse.json({
    status: 'healthy',
    service: 'mathquest-web',
    version: process.env.IMAGE_TAG || 'local-dev',
    scoring_service: scoringStatus,
    timestamp: new Date().toISOString(),
  });
}
