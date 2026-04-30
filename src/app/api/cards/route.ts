import { NextResponse } from 'next/server';
import { SupabaseCardRepository } from '@/infrastructure/repositories/SupabaseCardRepository';
import { CreateCardUseCase } from '@/core/use-cases/CreateCard';
import { createClient } from '@/infrastructure/db/supabase-server';

export async function GET() {
  try {
    const repository = new SupabaseCardRepository();
    const cards = await repository.listAll();
    return NextResponse.json(cards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
