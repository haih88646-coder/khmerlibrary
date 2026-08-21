import { supabase } from './config';
import { uploadLogo as supabaseLogoUpload, uploadBanner as supabaseBannerUpload } from './storage';

const SETTINGS_ID = 'site';

const defaultSettings = {
  name_km: 'បណ្ណាល័យឌីជីថលខ្មែរ',
  name_en: 'Khmer Digital Library',
  tagline_km: 'ស្វែងរក អាន និងរក្សាទុកសៀវភៅខ្មែរ',
  tagline_en: 'Discover, Read, and Save Khmer Books',
  logoUrl: '',
  favicon: '',
  footer_about_km: 'បណ្ណាល័យឌីជីថលខ្មែរជាវេទិកាសម្រាប់រក្សាទុក និងចែករំលែកសៀវភៅខ្មែរ។',
  footer_about_en: 'Khmer Digital Library is a platform for preserving and sharing Khmer books.',
  contact_email: 'info@khmerlibrary.com',
  contact_website: 'khmerlibrary.com',
  heroImageUrl: '',
};

export const getSiteSettings = async () => {
  const { data, error } = await supabase.from('settings').select('*').eq('id', SETTINGS_ID).single();
  if (error || !data) return defaultSettings;
  const { id: _id, ...rest } = data;
  return { ...defaultSettings, ...rest };
};

export const updateSiteSettings = async (data) => {
  const { error } = await supabase.from('settings').upsert({ id: SETTINGS_ID, ...data });
  if (error) throw error;
};

export { supabaseLogoUpload as uploadLogo, supabaseBannerUpload as uploadBanner };
