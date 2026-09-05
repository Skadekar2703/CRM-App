import { supabase } from '../lib/supabase';

export const getSignedPhotoUrl = async (photoPath: string | null | undefined): Promise<string | null> => {
  if (!photoPath) return null;
  const cleanPath = photoPath.trim();
  if (!cleanPath || cleanPath.toLowerCase() === 'null') return null;

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  if (cleanPath.startsWith('data:image')) {
    return cleanPath;
  }

  try {
    const relativePath = cleanPath.replace(/^customer_photos\//, '').replace(/^\//, '');
    const { data, error } = await supabase.storage
      .from('customer_photos')
      .createSignedUrl(relativePath, 3600);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (e) {
    console.error('[photoUtils] Failed to create signed URL:', e);
  }
  return null;
};
