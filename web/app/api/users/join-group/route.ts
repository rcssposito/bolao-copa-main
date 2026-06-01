import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/users/join-group
// Manages user group memberships (supports multiple comma-separated groups)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code, groupName, action = 'join' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Load current user profile to inspect their current groups
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('grupo')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const currentGroups = user.grupo
      ? user.grupo.split(',').map((g: string) => g.trim()).filter(Boolean)
      : [];

    if (action === 'leave') {
      if (!groupName) {
        return NextResponse.json({ error: 'Nome do grupo é obrigatório para sair' }, { status: 400 });
      }

      const updatedGroups = currentGroups.filter(
        (g: string) => g.toLowerCase() !== groupName.trim().toLowerCase()
      );
      
      const newGrupoValue = updatedGroups.length > 0 ? updatedGroups.join(', ') : null;

      const { data, error } = await supabase
        .from('users')
        .update({ grupo: newGrupoValue })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // Default action: join / change group
    if (!code || code.trim() === '') {
      return NextResponse.json({ error: 'Código de grupo é obrigatório' }, { status: 400 });
    }

    // Load tags config
    const { data: configData, error: configError } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'tags')
      .maybeSingle();

    if (configError) throw configError;

    if (!configData) {
      return NextResponse.json({ error: 'Nenhum grupo cadastrado no sistema.' }, { status: 400 });
    }

    const tags = JSON.parse(configData.value);
    
    // Find matching tag by code (case-insensitive)
    const matchingTag = tags.find(
      (t: { nome: string; codigo: string }) => 
        t.codigo.trim().toLowerCase() === code.trim().toLowerCase()
    );

    if (!matchingTag) {
      return NextResponse.json({ error: 'Código de grupo inválido ou inexistente.' }, { status: 400 });
    }

    // Check if user is already in this group
    const alreadyJoined = currentGroups.some(
      (g: string) => g.toLowerCase() === matchingTag.nome.toLowerCase()
    );

    if (alreadyJoined) {
      // User is already in group, just return user
      const { data: fullUser, error: fetchFullErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (fetchFullErr) throw fetchFullErr;
      return NextResponse.json(fullUser, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // Append to group list
    const updatedGroups = [...currentGroups, matchingTag.nome];
    const newGrupoValue = updatedGroups.join(', ');

    // Update user group field
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ grupo: newGrupoValue })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedUser, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
