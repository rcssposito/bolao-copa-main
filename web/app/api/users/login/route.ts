import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/users/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nome, code } = body;

    if (!email || !nome) {
      return NextResponse.json({ error: 'Email e Nome são obrigatórios para login' }, { status: 400 });
    }

    // Check if user exists by email
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingUser) {
      return NextResponse.json(existingUser, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // Check if it's the very first user (they become admin automatically and don't need a code)
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (countError) throw countError;
    const isFirstUser = count === 0;

    if (isFirstUser) {
      // Create first user as admin (no group required)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          nome,
          email,
          pagou: false,
          is_admin: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json(newUser, { status: 201, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    let userGroup = null;

    if (code && code.trim() !== '') {
      // Load tags config to validate code
      const { data: configData, error: configError } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'tags')
        .maybeSingle();

      if (configError) throw configError;

      if (!configData) {
        return NextResponse.json({ 
          error: 'NO_GROUPS_SETUP', 
          message: 'Nenhum grupo cadastrado no sistema. Contate o administrador.' 
        }, { status: 400 });
      }

      const tags = JSON.parse(configData.value);
      
      // Find matching tag by code (case-insensitive)
      const matchingTag = tags.find(
        (t: { nome: string; codigo: string }) => 
          t.codigo.trim().toLowerCase() === code.trim().toLowerCase()
      );

      if (!matchingTag) {
        return NextResponse.json({ 
          error: 'INVALID_GROUP_CODE', 
          message: 'Código de grupo inválido ou inexistente.' 
        }, { status: 400 });
      }

      userGroup = matchingTag.nome;
    }

    // Create new user record
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        nome,
        email,
        grupo: userGroup,
        pagou: false,
        is_admin: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(newUser, { status: 201, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
