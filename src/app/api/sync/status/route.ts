import { NextRequest, NextResponse } from 'next/server';
import { getSyncState } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sync/status
 * Returns the current sync state (last sync time, stats, etc.)
 */
export async function GET() {
  try {
    const state = getSyncState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
