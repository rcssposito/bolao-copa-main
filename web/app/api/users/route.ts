import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/users
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nome');

    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, grupo, pagou, is_admin } = body;

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e Email são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        nome,
        email,
        grupo: grupo || null,
        pagou: pagou || false,
        is_admin: is_admin || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 210, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }); // Return created user
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
