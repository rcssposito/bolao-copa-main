import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/stats
export async function GET() {
  try {
    // 1. Fetch users count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, pagou');

    if (usersError) throw usersError;
    const totalUsers = users ? users.length : 0;
    const paidUsers = users ? users.filter(u => u.pagou).length : 0;
    const unpaidUsers = totalUsers - paidUsers;

    // 2. Fetch matches count
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, status');

    if (matchesError) throw matchesError;
    const totalMatches = matches ? matches.length : 0;
    const finishedMatches = matches ? matches.filter(m => m.status === 'FINISHED').length : 0;
    const scheduledMatches = totalMatches - finishedMatches;

    // 3. Fetch bets count
    // Using a select with count to make it efficient
    const { count: totalBets, error: betsError } = await supabase
      .from('bets')
      .select('id', { count: 'exact', head: true });

    if (betsError) throw betsError;

    return NextResponse.json({
      total_users: totalUsers,
      paid_users: paidUsers,
      unpaid_users: unpaidUsers,
      total_matches: totalMatches,
      finished_matches: finishedMatches,
      scheduled_matches: scheduledMatches,
      total_bets: totalBets || 0
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
