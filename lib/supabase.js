// Pure REST client - no Supabase auth SDK
// This avoids the "string did not match" key format issues

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3FuanJ1YXZxa2N3YnVicGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODI3OTYsImV4cCI6MjA4ODc1ODc5Nn0.rbQy1vMYRXqWigB31PBkTcOe6HkhOuxM3eaNv1ch5QQ';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side database queries using user's token
export function createBrowserClient(token) {
  const key = token || SUPABASE_ANON_KEY;
  return {
    from: (table) => new RestQuery(SUPABASE_URL, table, key),
  };
}

// Server-side queries using service role key
export function createServerClient() {
  return {
    from: (table) => new RestQuery(SUPABASE_URL, table, SERVICE_ROLE_KEY),
    auth: {
      getUser: async (token) => {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) return { data: { user: null }, error: data };
        return { data: { user: data }, error: null };
      }
    }
  };
}

class RestQuery {
  constructor(url, table, key) {
    this.url = `${url}/rest/v1/${table}`;
    this.key = key;
    this.filters = [];
    this.selectCols = '*';
    this.orderCol = null;
    this.limitNum = null;
    this.isSingle = false;
    this.insertData = null;
    this.updateData = null;
    this.deleteMode = false;
    this.upsertData = null;
  }

  select(cols = '*') { this.selectCols = cols; return this; }
  eq(col, val) { this.filters.push(`${col}=eq.${val}`); return this; }
  in(col, vals) { this.filters.push(`${col}=in.(${vals.join(',')})`); return this; }
  not(col, op, val) { this.filters.push(`${col}=not.${op}.${val}`); return this; }
  order(col, { ascending = true } = {}) { this.orderCol = `${col}=${ascending ? 'asc' : 'desc'}`; return this; }
  limit(n) { this.limitNum = n; return this; }
  single() { this.isSingle = true; return this; }

  insert(data) { this.insertData = data; return this; }
  update(data) { this.updateData = data; return this; }
  delete() { this.deleteMode = true; return this; }
  upsert(data) { this.upsertData = data; return this; }

  async _run(method, body) {
    let url = this.url;
    const params = [...this.filters];
    if (this.selectCols && method === 'GET') params.push(`select=${this.selectCols}`);
    if (this.orderCol) params.push(`order=${this.orderCol}`);
    if (this.limitNum) params.push(`limit=${this.limitNum}`);
    if (params.length) url += '?' + params.join('&');

    const headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': this.isSingle ? 'return=representation' : 'return=representation',
    };

    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) return { data: null, error: { message: data?.message || data?.error || 'Query failed' } };
    if (this.isSingle) return { data: Array.isArray(data) ? data[0] : data, error: null };
    return { data, error: null };
  }

  then(resolve, reject) {
    let method = 'GET';
    let body = null;
    if (this.insertData) { method = 'POST'; body = this.insertData; }
    else if (this.updateData) { method = 'PATCH'; body = this.updateData; }
    else if (this.deleteMode) { method = 'DELETE'; }
    else if (this.upsertData) { method = 'POST'; body = this.upsertData; this.key += '&on_conflict=id'; }
    return this._run(method, body).then(resolve, reject);
  }
}

// Legacy compatibility - used in some components
export const supabase = {
  auth: {
    getSession: async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('jobsnap_session') : null;
        if (!stored) return { data: { session: null } };
        return { data: { session: JSON.parse(stored) } };
      } catch { return { data: { session: null } }; }
    },
    signOut: async () => {
      if (typeof window !== 'undefined') localStorage.removeItem('jobsnap_session');
      return { error: null };
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table) => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('jobsnap_session') : null;
      const token = stored ? JSON.parse(stored).access_token : null;
      return new RestQuery(process.env.NEXT_PUBLIC_SUPABASE_URL, table, token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3FuanJ1YXZxa2N3YnVicGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODI3OTYsImV4cCI6MjA4ODc1ODc5Nn0.rbQy1vMYRXqWigB31PBkTcOe6HkhOuxM3eaNv1ch5QQ');
    } catch {
      return new RestQuery(process.env.NEXT_PUBLIC_SUPABASE_URL, table, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3FuanJ1YXZxa2N3YnVicGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODI3OTYsImV4cCI6MjA4ODc1ODc5Nn0.rbQy1vMYRXqWigB31PBkTcOe6HkhOuxM3eaNv1ch5QQ');
    }
  },
};
