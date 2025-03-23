import { supabase } from './supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const { data, error, count } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact' })
    .eq('approved', true)
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false });

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify({ data, count }), { status: 200 });
}

export async function POST(request: Request) {
  const { content, userId } = await request.json();
  
  const { data, error } = await supabase
    .from('testimonials')
    .insert([{
      user_id: userId,
      content,
      role: 'worker'
    }]);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201 });
}