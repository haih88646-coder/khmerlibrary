import { supabase } from './config';

const BUCKET = 'khmer-library';

const uploadFile = async (file, folder, onProgress) => {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  onProgress?.(0);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  onProgress?.(100);
  return { url: urlData.publicUrl, path };
};

export const uploadBookFile = (file, onProgress) => {
  return uploadFile(file, 'books', onProgress);
};

export const uploadCoverImage = (file, onProgress) => {
  return uploadFile(file, 'covers', onProgress);
};

export const uploadLogo = (file, onProgress) => {
  return uploadFile(file, 'site', onProgress);
};

export const uploadBanner = (file, onProgress) => {
  return uploadFile(file, 'site', onProgress);
};
