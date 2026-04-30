export interface ICardAttributes {
  entretenimento: number;
  vergonha_alheia: number;
  competencia: number;
  balela: number;
  climao: number;
}

export interface ICard {
  id?: string;
  titulo: string;
  tipo: string;
  frase: string;
  cor: string;
  foto: string;
  foto_arquivo?: string;
  video_origem: string;
  modelo: string;
  atributos: ICardAttributes;
  user_id?: string;
  created_at?: string;
  
  // Metadados de transformação da imagem
  zoom?: number;
  pos_x?: number;
  pos_y?: number;
}

export interface IPackage {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at?: string;
}
