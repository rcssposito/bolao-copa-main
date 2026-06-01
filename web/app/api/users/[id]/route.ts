import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
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

// PUT /api/users/[id]
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

// DELETE /api/users/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
