import { supabase } from './config';
import { uploadBookFile as supabaseBookUpload, uploadCoverImage as supabaseCoverUpload } from './storage';

export const addBook = async (bookData) => {
  const { data, error } = await supabase
    .from('books')
    .insert({
      ...bookData,
      views: 0,
      downloads: 0,
      isPublished: bookData.isPublished ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data.id;
};

export const updateBook = async (id, data) => {
  const { error } = await supabase.from('books').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteBook = async (id) => {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
};

export const getBook = async (id) => {
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
};

export const getBooks = async (options = {}) => {
  const {
    category, author, year, fileType, searchTerm,
    sortBy = 'created_at', sortDir = 'desc',
    pageSize = 12, page = 0, publishedOnly = true,
  } = options;

  let query = supabase.from('books').select('*', { count: 'exact' });

  if (publishedOnly) {
    query = query.eq('isPublished', true);
  }
  if (category) query = query.eq('categoryId', category);
  if (author) query = query.eq('authorId', author);
  if (year) query = query.eq('publicationYear', Number(year));
  if (fileType) query = query.eq('fileType', fileType);
  if (searchTerm) {
    const term = `%${searchTerm}%`;
    query = query.or(`title_en.ilike.${term},title_km.ilike.${term},authorName.ilike.${term}`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  query = query.order(sortBy, { ascending: sortDir === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    books: data || [],
    lastDoc: page,
    hasMore: (data || []).length === pageSize,
    total: count,
  };
};

export const getBooksByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.from('books').select('*').in('id', ids);
  if (error) throw error;
  return data || [];
};

export const incrementViews = async (id) => {
  const { error: rpcError } = await supabase.rpc('increment_views', { book_id: id });
  if (rpcError) {
    const { data } = await supabase.from('books').select('views').eq('id', id).single();
    if (data) {
      await supabase.from('books').update({ views: (data.views || 0) + 1 }).eq('id', id);
    }
  }
};

export const incrementDownloads = async (id) => {
  const { error: rpcError } = await supabase.rpc('increment_downloads', { book_id: id });
  if (rpcError) {
    const { data } = await supabase.from('books').select('downloads').eq('id', id).single();
    if (data) {
      await supabase.from('books').update({ downloads: (data.downloads || 0) + 1 }).eq('id', id);
    }
  }
};

export const searchBooks = async (searchTerm, pageSize = 20) => {
  const term = `%${searchTerm}%`;
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('isPublished', true)
    .or(`title_en.ilike.${term},title_km.ilike.${term},authorName.ilike.${term},tags.cs.{${searchTerm}}`)
    .order('title_en')
    .limit(pageSize);
  if (error) throw error;
  return data || [];
};

export { supabaseBookUpload as uploadBookFile, supabaseCoverUpload as uploadCoverImage };
