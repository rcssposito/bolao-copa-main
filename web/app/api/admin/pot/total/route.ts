import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/pot/total
// Calculates pot details based on paid users and cota config
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    // 1. Get default pot_value from config table
    const { data: potConfig, error: configError } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'pot_value')
      .maybeSingle();

    if (configError) throw configError;
    const defaultPotValue = potConfig ? parseFloat(potConfig.value) : 50.0;

    let potValue = defaultPotValue;
    let paidCount = 0;

    // 2. Fetch all users who paid
    const { data: paidUsers, error: usersError } = await supabase
      .from('users')
      .select('id, grupo')
      .eq('pagou', true);

    if (usersError) throw usersError;

    if (group && group.trim() !== '' && group.toUpperCase() !== 'GERAL') {
      const decodedGroup = decodeURIComponent(group).trim().toLowerCase();

      // Find group price from tags configuration
      const { data: tagsConfig, error: tagsError } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'tags')
        .maybeSingle();

      if (tagsConfig) {
        try {
          const tags = JSON.parse(tagsConfig.value);
          const matchingTag = tags.find((t: any) => t.nome.trim().toLowerCase() === decodedGroup);
          if (matchingTag && matchingTag.preco !== undefined) {
            potValue = parseFloat(matchingTag.preco);
          }
        } catch (e) {
          console.error('Erro ao ler preços dos grupos:', e);
        }
      }

      // Count paid users belonging to this group
      const filteredPaid = (paidUsers || []).filter(user => {
        if (!user.grupo) return false;
        const userGroups = user.grupo.split(',').map((g: string) => g.trim().toLowerCase());
        return userGroups.includes(decodedGroup);
      });
      paidCount = filteredPaid.length;
    } else {
      paidCount = paidUsers ? paidUsers.length : 0;
    }

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
