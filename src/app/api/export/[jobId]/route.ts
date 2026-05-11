import { NextResponse } from 'next/server';
import { ExportJobStore } from '@/infrastructure/services/ExportJobStore';
import { requireAdmin } from '@/infrastructure/services/authz';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const authz = await requireAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const { jobId } = await params;
  const job = ExportJobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    fileName: job.fileName,
  });
}
