import { supabase } from './config';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export const registerUser = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { displayName } } });
  if (error) throw error;

  const user = data.user;

  await supabase.from('users').insert({
    uid: user.id,
    email,
    displayName,
    role: ADMIN_EMAILS.includes(email) ? 'admin' : 'user',
    favorites: [],
    isActive: true,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const getUserProfile = async (uid) => {
  const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();

  if (error || !data) {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user) return null;

    const email = authUser.user.email || '';
    const meta = authUser.user.user_metadata || {};
    const displayName = meta.displayName || email.split('@')[0];
    const isAdminEmail = email && ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());

    await supabase.from('users').insert({
      uid,
      email,
      displayName,
      role: isAdminEmail ? 'admin' : 'user',
      favorites: [],
      isActive: true,
    });

    return { uid, email, displayName, role: isAdminEmail ? 'admin' : 'user', favorites: [], isActive: true };
  }

  const email = data.email || '';
  const isAdminEmail = email && ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
  const role = isAdminEmail ? 'admin' : (data.role || 'user');

  if (isAdminEmail && data.role !== 'admin') {
    await supabase.from('users').update({ role }).eq('uid', uid);
  }

  return { ...data, role };
};

export const updateUserProfile = async (uid, profileData) => {
  const { error } = await supabase.from('users').update(profileData).eq('uid', uid);
  if (error) throw error;
};

export const onAuthChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe;
};
