import { ICard } from "@/core/domain/Card";
import { ICardRepository } from "@/core/domain/ICardRepository";
import { createClient } from "../db/supabase-server";

export class SupabaseCardRepository implements ICardRepository {
  async create(card: ICard): Promise<ICard> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('cards')
      .insert([card])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar carta: ${error.message}`);
    return data;
  }

  async update(id: string, card: Partial<ICard>): Promise<ICard> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cards')
      .update(card)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar carta: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar carta: ${error.message}`);
  }

  async findById(id: string): Promise<ICard | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async findByUser(userId: string): Promise<ICard[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar cartas do usuário: ${error.message}`);
    return data || [];
  }

  async listAll(): Promise<ICard[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao listar cartas: ${error.message}`);
    return data || [];
  }
}
