import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/tags
// Returns the list of tags/groups stored in the 'config' table under key 'tags'
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('key', 'tags')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json([]);
    }

    const tags = JSON.parse(data.value);
    return NextResponse.json(tags);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/tags
// Updates the list of tags/groups (JSON array) in the 'config' table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags deve ser uma lista (array)' }, { status: 400 });
    }

    // Validate structure of each tag
    for (const tag of tags) {
      if (!tag.nome || !tag.codigo) {
        return NextResponse.json({ error: 'Cada tag deve conter um "nome" e um "codigo"' }, { status: 400 });
      }
    }

    // Check if configuration exists
    const { data: existing, error: selectError } = await supabase
      .from('config')
      .select('*')
      .eq('key', 'tags')
      .maybeSingle();

    if (selectError) throw selectError;

    let responseData;
    const valueString = JSON.stringify(tags);

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('config')
        .update({
          value: valueString,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'tags')
        .select()
        .single();
      
      if (error) throw error;
      responseData = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('config')
        .insert({
          key: 'tags',
          value: valueString,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      responseData = data;
    }

    return NextResponse.json(JSON.parse(responseData.value));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
