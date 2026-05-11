import { NextResponse } from 'next/server';
import { ExportRequest } from '@/core/domain/Export';
import { ExportJobStore } from '@/infrastructure/services/ExportJobStore';
import { ExportOrchestrator } from '@/infrastructure/services/ExportOrchestrator';
import { requireAdmin } from '@/infrastructure/services/authz';

export async function POST(request: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  try {
    const body = (await request.json()) as ExportRequest;

    if (!Array.isArray(body.cards) || body.cards.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma carta para exportar.' }, { status: 400 });
    }

    const job = ExportJobStore.create();

    void ExportOrchestrator.run(job.id, body);

    await authz.supabase.from('audit_logs').insert({
      user_id: authz.userId,
      action: 'EXPORT_PDF_REQUESTED',
      description: {
        job_id: job.id,
        card_count: body.cards.length,
        format: body.settings?.format,
      },
    });

    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao iniciar exportação';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
