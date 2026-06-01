import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/pot/total
// Calculates pot details based on paid users and cota config
export async function GET() {
  try {
    // 1. Get pot_value from config table
    const { data: potConfig, error: configError } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'pot_value')
      .maybeSingle();

    if (configError) throw configError;
    const potValue = potConfig ? parseFloat(potConfig.value) : 50.0;

    // 2. Count users who paid
    const { data: paidUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('pagou', true);

    if (usersError) throw usersError;
    const paidCount = paidUsers ? paidUsers.length : 0;

    const totalPot = potValue * paidCount;

    return NextResponse.json({
      valor_por_usuario: potValue,
      usuarios_pagantes: paidCount,
      total_pote: totalPot
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
