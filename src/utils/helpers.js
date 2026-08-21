export const formatDate = (timestamp, lang = 'en') => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (lang === 'km') {
    return date.toLocaleDateString('km-KH', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileType = (filename) => {
  if (!filename) return '';
  const ext = filename.split('.').pop().toLowerCase();
  return ext;
};

export const isValidFileType = (file, allowedTypes) => {
  const ext = getFileType(file.name);
  return allowedTypes.includes(ext);
};

export const isValidImageType = (file) => {
  const valid = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return valid.includes(getFileType(file.name));
};

export const validateBookFile = (file) => {
  const allowed = ['pdf', 'txt'];
  if (!isValidFileType(file, allowed)) {
    return { valid: false, error: 'Only PDF and TXT files are allowed' };
  }
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be under 50MB' };
  }
  return { valid: true };
};

export const validateCoverImage = (file) => {
  if (!isValidImageType(file)) {
    return { valid: false, error: 'Only JPG, PNG, WebP images are allowed' };
  }
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be under 5MB' };
  }
  return { valid: true };
};

export const slugify = (text) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

export const truncate = (text, maxLen = 100) => {
  if (!text || text.length <= maxLen) return text || '';
  return text.substring(0, maxLen) + '...';
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
