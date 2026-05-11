'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/infrastructure/services/authz';
import { GalleryModerationService } from '@/infrastructure/services/GalleryModerationService';

export async function approveGalleryPhoto(photoId: string) {
  const authz = await requireAdmin();
  if (!authz.ok) {
    throw new Error(authz.error);
  }

  if (!photoId || photoId.trim().length < 2) {
    throw new Error('ID da foto inválido');
  }

  const moderationService = new GalleryModerationService();
  await moderationService.setApproved(photoId.trim(), true);

  await authz.supabase.from('audit_logs').insert({
    user_id: authz.userId,
    action: 'APPROVE_GALLERY_PHOTO',
    description: { photo_id: photoId.trim() },
  });

  revalidatePath('/galeria');
}
