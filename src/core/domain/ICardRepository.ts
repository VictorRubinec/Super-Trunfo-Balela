import { ICard } from "./Card";

export interface ICardRepository {
  create(card: ICard): Promise<ICard>;
  update(id: string, card: Partial<ICard>): Promise<ICard>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ICard | null>;
  findByUser(userId: string): Promise<ICard[]>;
  listAll(): Promise<ICard[]>;
}
