import { supabaseAdmin } from '@/infrastructure/db/supabase-admin';

const memoryApprovals = new Map<string, boolean>();

export class GalleryModerationService {
  async isApproved(photoId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('gallery_photos')
        .select('approved')
        .eq('photo_id', photoId)
        .single();

      if (error) {
        return memoryApprovals.get(photoId) ?? true;
      }

      return Boolean(data?.approved);
    } catch {
      return memoryApprovals.get(photoId) ?? true;
    }
  }

  async setApproved(photoId: string, approved: boolean) {
    memoryApprovals.set(photoId, approved);

    try {
      await supabaseAdmin.from('gallery_photos').upsert(
        { photo_id: photoId, approved },
        { onConflict: 'photo_id' }
      );
    } catch {
      // Fallback em memória já aplicado.
    }
  }
}
