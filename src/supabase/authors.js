import { supabase } from './config';

export const addAuthor = async (data) => {
  const { data: result, error } = await supabase.from('authors').insert(data).select().single();
  if (error) throw error;
  return result.id;
};

export const updateAuthor = async (id, data) => {
  const { error } = await supabase.from('authors').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteAuthor = async (id) => {
  const { error } = await supabase.from('authors').delete().eq('id', id);
  if (error) throw error;
};

export const getAuthor = async (id) => {
  const { data, error } = await supabase.from('authors').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
};

export const getAuthors = async () => {
  const { data, error } = await supabase.from('authors').select('*').order('name_en');
  if (error) throw error;
  return data || [];
};
