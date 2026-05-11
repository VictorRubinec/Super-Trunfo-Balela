import { randomUUID } from 'crypto';
import { ExportJob } from '@/core/domain/Export';

const jobs = new Map<string, ExportJob>();

export class ExportJobStore {
  static create(): ExportJob {
    const now = new Date().toISOString();
    const job: ExportJob = {
      id: randomUUID(),
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };
    jobs.set(job.id, job);
    return job;
  }

  static get(id: string): ExportJob | null {
    return jobs.get(id) ?? null;
  }

  static update(id: string, partial: Partial<ExportJob>) {
    const current = jobs.get(id);
    if (!current) return;
    jobs.set(id, {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  }
}
