import { NextResponse } from 'next/server';
import { SupabaseCardRepository } from '@/infrastructure/repositories/SupabaseCardRepository';
import { CreateCardUseCase } from '@/core/use-cases/CreateCard';
import { createClient } from '@/infrastructure/db/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const repository = new SupabaseCardRepository();
    const cards = profile?.role === 'admin'
      ? await repository.listAll()
      : await repository.findByUser(user.id);
    return NextResponse.json(cards);
  } catch (error: unknown) {
    console.error('[API Cards] Erro ao listar cartas:', error);
    const message = error instanceof Error ? error.message : 'Erro ao listar cartas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const repository = new SupabaseCardRepository();
    const useCase = new CreateCardUseCase(repository);

    const newCard = await useCase.execute({
      ...body,
      user_id: user.id
    });

    return NextResponse.json(newCard, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar carta';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
