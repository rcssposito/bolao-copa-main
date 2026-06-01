import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/admin/users/[id]
// Allows updating group, pagou and is_admin
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nome, email, grupo, pagou, is_admin } = body;

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (grupo !== undefined) updateData.grupo = grupo;
    if (pagou !== undefined) updateData.pagou = pagou;
    if (is_admin !== undefined) updateData.is_admin = is_admin;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
