import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/users
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nome');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
