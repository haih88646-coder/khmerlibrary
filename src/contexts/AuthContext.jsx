import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthChange, getUserProfile, logoutUser } from '../supabase/auth';
import { addFavorite, removeFavorite, getUserFavorites } from '../supabase/users';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  const loadProfile = useCallback(async (supabaseUser) => {
    if (supabaseUser) {
      const uid = supabaseUser.id;
      const p = await getUserProfile(uid);
      setProfile(p);
      const favs = await getUserFavorites(uid);
      setFavorites(favs);
    } else {
      setProfile(null);
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (supabaseUser) => {
      setUser(supabaseUser);
      await loadProfile(supabaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const isAdmin = profile?.role === 'admin';

  const toggleFavorite = useCallback(async (bookId) => {
    if (!user) return false;
    const uid = user.id;
    const isFav = favorites.includes(bookId);
    if (isFav) {
      await removeFavorite(uid, bookId);
      setFavorites(prev => prev.filter(id => id !== bookId));
    } else {
      await addFavorite(uid, bookId);
      setFavorites(prev => [...prev, bookId]);
    }
    return !isFav;
  }, [user, favorites]);

  const isFavorite = useCallback((bookId) => {
    return favorites.includes(bookId);
  }, [favorites]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setFavorites([]);
  }, []);

  const value = {
    user,
    profile,
    loading,
    favorites,
    isAdmin,
    toggleFavorite,
    isFavorite,
    logout,
    refreshProfile: () => loadProfile(user)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
