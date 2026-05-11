import { ICard } from "@/core/domain/Card";
import { ICardRepository } from "@/core/domain/ICardRepository";
import { createClient } from "../db/supabase-server";

export class SupabaseCardRepository implements ICardRepository {
  private mapFromDb(row: any): ICard {
    if (!row) return row;
    return {
      ...row,
      created_at: row.criado_em,
      atributos: {
        entretenimento: row.attr_ent ?? 5,
        vergonha_alheia: row.attr_vgh ?? 5,
        competencia: row.attr_cmp ?? 5,
        balela: row.attr_bal ?? 5,
        climao: row.attr_clm ?? 5
      }
    };
  }

  private mapToDb(card: Partial<ICard>): any {
    const row = { ...card } as any;
    if (card.atributos) {
      row.attr_ent = card.atributos.entretenimento;
      row.attr_vgh = card.atributos.vergonha_alheia;
      row.attr_cmp = card.atributos.competencia;
      row.attr_bal = card.atributos.balela;
      row.attr_clm = card.atributos.climao;
      delete row.atributos;
    }
    if (card.created_at) {
      row.criado_em = card.created_at;
      delete row.created_at;
    }
    return row;
  }

  async create(card: ICard): Promise<ICard> {
    const supabase = await createClient();
    const row = this.mapToDb(card);
    
    const { data, error } = await supabase
      .from('cards')
      .insert([row])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar carta: ${error.message}`);
    return this.mapFromDb(data);
  }

  async update(id: string, card: Partial<ICard>): Promise<ICard> {
    const supabase = await createClient();
    const row = this.mapToDb(card);

    const { data, error } = await supabase
      .from('cards')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar carta: ${error.message}`);
    return this.mapFromDb(data);
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
    return this.mapFromDb(data);
  }

  async findByUser(userId: string): Promise<ICard[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false });

    if (error) throw new Error(`Erro ao buscar cartas do usuário: ${error.message}`);
    return (data || []).map(row => this.mapFromDb(row));
  }

  async listAll(): Promise<ICard[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw new Error(`Erro ao listar cartas: ${error.message}`);
    return (data || []).map(row => this.mapFromDb(row));
  }
}
