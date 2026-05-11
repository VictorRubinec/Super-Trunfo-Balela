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

  if (job.status !== 'done' || !job.zipBase64) {
    return NextResponse.json({ error: 'Arquivo ainda não está pronto' }, { status: 409 });
  }

  const zip = Buffer.from(job.zipBase64, 'base64');

  return new NextResponse(zip, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${job.fileName || 'export.zip'}"`,
      'Content-Length': String(zip.length),
    },
  });
}
