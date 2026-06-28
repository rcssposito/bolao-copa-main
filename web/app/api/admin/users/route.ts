import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/users
export async function GET() {
  try {
    let allUsers: any[] = [];
    let from = 0;
    const limit = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('nome')
        .range(from, from + limit - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allUsers = allUsers.concat(data);
      if (data.length < limit) break;
      from += limit;
    }

    return NextResponse.json(allUsers, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
