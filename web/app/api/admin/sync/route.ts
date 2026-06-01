import { NextResponse } from 'next/server';
import { fullSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';

// POST /api/admin/sync
// Run full synchronization of football matches and compute points
export async function POST() {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave da API de futebol (FOOTBALL_API_KEY) não configurada.' }, { status: 500 });
    }

    const result = await fullSync(apiKey);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
