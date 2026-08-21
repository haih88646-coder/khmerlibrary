import { supabase } from './config';

export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getUser = async (uid) => {
  const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();
  if (error || !data) return null;
  return data;
};

export const updateUser = async (uid, data) => {
  const { error } = await supabase.from('users').update(data).eq('uid', uid);
  if (error) throw error;
};

export const toggleUserActive = async (uid, isActive) => {
  const { error } = await supabase.from('users').update({ isActive }).eq('uid', uid);
  if (error) throw error;
};

export const addFavorite = async (uid, bookId) => {
  const { data: user, error: fetchError } = await supabase.from('users').select('favorites').eq('uid', uid).single();
  if (fetchError || !user) return;
  const favorites = user.favorites || [];
  if (!favorites.includes(bookId)) {
    await supabase.from('users').update({ favorites: [...favorites, bookId] }).eq('uid', uid);
  }
};

export const removeFavorite = async (uid, bookId) => {
  const { data: user, error: fetchError } = await supabase.from('users').select('favorites').eq('uid', uid).single();
  if (fetchError || !user) return;
  const favorites = (user.favorites || []).filter(id => id !== bookId);
  await supabase.from('users').update({ favorites }).eq('uid', uid);
};

export const getUserFavorites = async (uid) => {
  const { data: user, error } = await supabase.from('users').select('favorites').eq('uid', uid).single();
  if (error || !user) return [];
  return user.favorites || [];
};
