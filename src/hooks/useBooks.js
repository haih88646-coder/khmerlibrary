import { useState, useEffect, useCallback } from 'react';
import { getBooks, getBooksByIds } from '../supabase/books';
import { getCategories } from '../supabase/categories';
import { getAuthors } from '../supabase/authors';
import { getArchiveBooksByIds, isArchiveId, stripArchivePrefix } from '../utils/archiveApi';
import { getElibraryBooksByIds, isElibraryId, stripElibraryPrefix, searchElibraryBooks } from '../utils/elibraryApi';

export const useBooks = (options = {}) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  const fetchBooks = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const result = await getBooks({
        ...options,
        lastDoc: reset ? null : lastDoc
      });
      if (reset) {
        setBooks(result.books);
      } else {
        setBooks(prev => [...prev, ...result.books]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.category, options.author, options.year, options.fileType, options.sortBy, options.sortDir, lastDoc]);

  useEffect(() => {
    fetchBooks(true);
  }, [options.category, options.author, options.year, options.fileType, options.sortBy, options.sortDir]);

  return { books, loading, error, hasMore, loadMore: () => fetchBooks(false), refresh: () => fetchBooks(true) };
};

export const useFavoriteBooks = (favoriteIds) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!favoriteIds || favoriteIds.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const localIds = favoriteIds.filter(id => !isArchiveId(id) && !isElibraryId(id));
        const archiveIds = favoriteIds.filter(isArchiveId).map(stripArchivePrefix);
        const elcIds = favoriteIds.filter(isElibraryId).map(stripElibraryPrefix);

        const [localBooks, archiveBooks, elcBooks] = await Promise.all([
          localIds.length > 0 ? getBooksByIds(localIds) : Promise.resolve([]),
          archiveIds.length > 0 ? getArchiveBooksByIds(archiveIds) : Promise.resolve([]),
          elcIds.length > 0 ? getElibraryBooksByIds(elcIds) : Promise.resolve([]),
        ]);

        const byId = new Map();
        localBooks.forEach(b => byId.set(b.id, b));
        archiveBooks.forEach(b => byId.set(b.id, b));
        elcBooks.forEach(b => byId.set(b.id, b));
        setBooks(favoriteIds.map(id => byId.get(String(id))).filter(Boolean));
      } catch {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [favoriteIds]);

  return { books, loading };
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
};

export const useAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthors()
      .then(setAuthors)
      .catch(() => setAuthors([]))
      .finally(() => setLoading(false));
  }, []);

  return { authors, loading };
};

export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchElibraryBooks(term, 1, 8);
      setResults(res.books);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
};
