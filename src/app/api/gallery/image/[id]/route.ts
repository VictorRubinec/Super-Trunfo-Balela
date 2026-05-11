import { NextResponse } from 'next/server';
import { GoogleDriveService } from '@/infrastructure/services/GoogleDriveService';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driveService = new GoogleDriveService();
    const file = await driveService.getFileBuffer(id);

    if (!file) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    return new NextResponse(file.buffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar imagem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
