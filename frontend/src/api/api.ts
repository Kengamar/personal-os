const API_BASE_URL = ''

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Todo {
  id: number
  title: string
  completed: 0 | 1
  created_at: string
}

export interface Note {
  id: number
  title: string
  content: string
  category: string
  created_at: string
}

export interface Contact {
  id: number
  name: string
  email: string
  phone: string
  notes: string
  created_at: string
}

export interface Transaction {
  id: number
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  created_at: string
}

export interface Media {
  id: number
  title: string
  type: 'movie' | 'series' | 'book'
  rating: number | null
  status: 'want-to-watch' | 'watching' | 'watched'
  notes: string
  created_at: string
}

interface AuthResponse { token: string; userId: number; username: string }
interface ApiError     { error: string }

// ─── Base request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res  = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error((data as ApiError).error || 'Request failed')
  return data as T
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  todos: {
    list:   ()                                                    => request<Todo[]>('/api/todos'),
    create: (title: string)                                       => request<Todo>('/api/todos', { method: 'POST', body: JSON.stringify({ title }) }),
    update: (id: number, p: Partial<Pick<Todo, 'title' | 'completed'>>) => request<Todo>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: number)                                          => request<{ success: boolean }>(`/api/todos/${id}`, { method: 'DELETE' }),
  },

  notes: {
    list:   ()                                                         => request<Note[]>('/api/notes'),
    create: (p: Pick<Note, 'title' | 'content' | 'category'>)         => request<Note>('/api/notes', { method: 'POST', body: JSON.stringify(p) }),
    update: (id: number, p: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => request<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: number)                                               => request<{ success: boolean }>(`/api/notes/${id}`, { method: 'DELETE' }),
  },

  contacts: {
    list:   ()                                                                    => request<Contact[]>('/api/contacts'),
    create: (p: Pick<Contact, 'name' | 'email' | 'phone' | 'notes'>)             => request<Contact>('/api/contacts', { method: 'POST', body: JSON.stringify(p) }),
    update: (id: number, p: Partial<Pick<Contact, 'name' | 'email' | 'phone' | 'notes'>>) => request<Contact>(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: number)                                                          => request<{ success: boolean }>(`/api/contacts/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list:   (params?: { month?: string; type?: string })                         => request<Transaction[]>(`/api/transactions${params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : ''}`),
    create: (p: Pick<Transaction, 'amount' | 'type' | 'category' | 'description' | 'date'>) => request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(p) }),
    update: (id: number, p: Partial<Pick<Transaction, 'amount' | 'type' | 'category' | 'description' | 'date'>>) => request<Transaction>(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: number)                                                          => request<{ success: boolean }>(`/api/transactions/${id}`, { method: 'DELETE' }),
  },

  media: {
    list:   (params?: { type?: string; status?: string })                                       => request<Media[]>(`/api/media${params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : ''}`),
    create: (p: Pick<Media, 'title' | 'type' | 'rating' | 'status' | 'notes'>)                 => request<Media>('/api/media', { method: 'POST', body: JSON.stringify(p) }),
    update: (id: number, p: Partial<Pick<Media, 'title' | 'type' | 'rating' | 'status' | 'notes'>>) => request<Media>(`/api/media/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: number)                                                                        => request<{ success: boolean }>(`/api/media/${id}`, { method: 'DELETE' }),
  },
}
