import { ICard } from "../domain/Card";
import { ICardRepository } from "../domain/ICardRepository";

export class UpdateCardUseCase {
  constructor(private cardRepository: ICardRepository) {}

  async execute(id: string, cardData: Partial<ICard>): Promise<ICard> {
    const existingCard = await this.cardRepository.findById(id);
    if (!existingCard) throw new Error("Carta não encontrada.");
    
    return await this.cardRepository.update(id, cardData);
  }
}
