import { NextResponse } from 'next/server';
import { GoogleDriveService } from '@/infrastructure/services/GoogleDriveService';
import { GalleryModerationService } from '@/infrastructure/services/GalleryModerationService';
import { requireAdmin } from '@/infrastructure/services/authz';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'all';
    const pageToken = searchParams.get('pageToken') ?? undefined;
    const pageSize = Number(searchParams.get('pageSize') ?? '24');
    const folderId = searchParams.get('folderId') ?? undefined;
    const includePending = searchParams.get('includePending') === 'true';

    if (includePending) {
      const authz = await requireAdmin();
      if (!authz.ok) {
        return NextResponse.json({ error: authz.error }, { status: authz.status });
      }
    }

    const driveService = new GoogleDriveService();
    const moderationService = new GalleryModerationService();

    if (view === 'albums') {
      const result = await driveService.listFolders();
      return NextResponse.json(result);
    }

    const result = await driveService.listImages({
      pageToken,
      pageSize,
      folderId,
      excludeCover: true,
    });
    const merged = await Promise.all(result.photos.map(async (photo) => ({ ...photo, approved: await moderationService.isApproved(photo.id) })));
    const photos = includePending ? merged : merged.filter((photo) => photo.approved);

    return NextResponse.json({ photos, nextPageToken: result.nextPageToken, source: result.source });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar galeria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
