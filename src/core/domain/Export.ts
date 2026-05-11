import { ICard } from './Card';

export type PageFormat = 'a4' | 'super-a4' | 'a3' | 'super-a3';

export interface PrintSettings {
  format: PageFormat;
  bleed: number;
  useBleed: boolean;
  margin: number;
  cutmarks: boolean;
  projectName: string;
}

export type ExportJobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface ExportRequest {
  cards: ICard[];
  settings: PrintSettings;
}

export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
  fileName?: string;
  zipBase64?: string;
}
