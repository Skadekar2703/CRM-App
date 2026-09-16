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

/**
 * Client-side compress / resize image to ensure it never exceeds storage limits
 * and uploads instantly while retaining crisp profile quality.
 */
export const compressImageForUpload = (file: File, maxDim = 800, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    // If SVG or non-image, return directly
    if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

