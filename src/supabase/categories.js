import { supabase } from './config';

export const addCategory = async (data) => {
  const { data: result, error } = await supabase.from('categories').insert(data).select().single();
  if (error) throw error;
  return result.id;
};

export const updateCategory = async (id, data) => {
  const { error } = await supabase.from('categories').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteCategory = async (id) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

export const getCategory = async (id) => {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
};

export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name_en');
  if (error) throw error;
  return data || [];
};
