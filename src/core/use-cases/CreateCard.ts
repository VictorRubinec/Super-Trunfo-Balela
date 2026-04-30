import { ICard } from "../domain/Card";
import { ICardRepository } from "../domain/ICardRepository";

export class CreateCardUseCase {
  constructor(private cardRepository: ICardRepository) {}

  async execute(cardData: ICard): Promise<ICard> {
    // Aqui poderíamos adicionar validações de negócio extras
    if (!cardData.titulo) throw new Error("Título da carta é obrigatório.");
    if (!cardData.foto) throw new Error("A foto da carta é obrigatória.");
    
    return await this.cardRepository.create(cardData);
  }
}
