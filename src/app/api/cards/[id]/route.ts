import { NextResponse } from 'next/server';
import { SupabaseCardRepository } from '@/infrastructure/repositories/SupabaseCardRepository';
import { UpdateCardUseCase } from '@/core/use-cases/UpdateCard';
import { createClient } from '@/infrastructure/db/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const repository = new SupabaseCardRepository();
    const card = await repository.findById(params.id);
    
    if (!card) {
      return NextResponse.json({ error: 'Carta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const repository = new SupabaseCardRepository();
    
    // Verificar se a carta pertence ao usuário
    const existing = await repository.findById(params.id);
    if (existing?.user_id !== user.id) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const useCase = new UpdateCardUseCase(repository);
    const updated = await useCase.execute(params.id, body);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const repository = new SupabaseCardRepository();
    const existing = await repository.findById(params.id);
    
    if (!existing) {
      return NextResponse.json({ error: 'Carta não encontrada' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    await repository.delete(params.id);
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
