import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Every page (dashboard, schedule, quotes list, quote detail) mounts its own
// useQuotes() and re-fetches the full quote list from scratch, so tapping
// between screens during a demo meant a fresh network round-trip + spinner
// every single time -- it never felt instant. Cache the last response at
// module scope and render it immediately on the next mount (stale-while-
// revalidate): the screen paints right away with whatever we last had,
// while a fresh fetch quietly runs behind it and updates state when it lands.
let quotesCache = null;

export function useQuotes() {
  const { getToken } = useAuth();
  const [quotes, setQuotes] = useState(quotesCache || []);
  const [loading, setLoading] = useState(quotesCache === null);

  const fetchQuotes = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/quotes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        quotesCache = data;
        setQuotes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const createQuote = async (data) => {
    const token = await getToken();
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw result;
    await fetchQuotes();
    return result;
  };

  const updateQuote = async (id, data) => {
    const token = await getToken();
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw result;
    setQuotes(q => {
      const next = q.map(x => x.id === id ? result : x);
      quotesCache = next;
      return next;
    });
    return result;
  };

  const deleteQuote = async (id) => {
    const token = await getToken();
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw result;
    }
    setQuotes(q => {
      const next = q.filter(x => x.id !== id);
      quotesCache = next;
      return next;
    });
  };

  return { quotes, loading, createQuote, updateQuote, deleteQuote, refresh: fetchQuotes };
}
