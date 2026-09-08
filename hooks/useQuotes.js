import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useQuotes() {
  const { getToken } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/quotes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setQuotes(await res.json());
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
    setQuotes(q => q.map(x => x.id === id ? result : x));
    return result;
  };

  const deleteQuote = async (id) => {
    const token = await getToken();
    await fetch(`/api/quotes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setQuotes(q => q.filter(x => x.id !== id));
  };

  return { quotes, loading, createQuote, updateQuote, deleteQuote, refresh: fetchQuotes };
}
