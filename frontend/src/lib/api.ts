import type { Exercise, Role, StudentRow, UserMe, Workout } from './types';

const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('armflow_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('armflow_token', token);
  else localStorage.removeItem('armflow_token');
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const token = init.token ?? getToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: string | string[] };
      if (typeof j.message === 'string') msg = j.message;
      else if (Array.isArray(j.message)) msg = j.message.join(', ');
    } catch {
      /* ignore */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: UserMe }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      token: null,
    }),

  me: () => request<UserMe>('/auth/me'),

  users: () =>
    request<
      {
        id: string;
        email: string;
        name: string;
        role: Role;
        coachId: string | null;
        blocked: boolean;
        createdAt: string;
      }[]
    >('/users'),

  createUser: (body: {
    name: string;
    email: string;
    password: string;
    role: Role;
    coachId?: string;
  }) => request('/users', { method: 'POST', body: JSON.stringify(body) }),

  updateUser: (
    id: string,
    body: Partial<{
      name: string;
      role: Role;
      coachId: string | null;
      blocked: boolean;
      password: string;
    }>,
  ) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  coachStudents: () => request<StudentRow[]>('/coach/students'),

  workoutsRange: (params: { studentId?: string; from: string; to: string }) => {
    const q = new URLSearchParams({ from: params.from, to: params.to });
    if (params.studentId) q.set('studentId', params.studentId);
    return request<Workout[]>(`/workouts?${q}`);
  },

  workout: (id: string) => request<Workout>(`/workouts/${id}`),

  createWorkout: (body: { studentId?: string; title: string; startAt: string }) =>
    request<Workout>('/workouts', { method: 'POST', body: JSON.stringify(body) }),

  updateWorkout: (id: string, body: { title?: string; startAt?: string }) =>
    request<Workout>(`/workouts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteWorkout: (id: string) => request(`/workouts/${id}`, { method: 'DELETE' }),

  createExercise: (
    workoutId: string,
    body: {
      title: string;
      description?: string;
      sets: number;
      reps: number;
      weight: number;
      weightUnit: 'KG' | 'BLOCKS';
      videoUrl?: string;
    },
  ) =>
    request<Exercise>(`/workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateExercise: (
    id: string,
    body: Partial<{
      title: string;
      description: string;
      sets: number;
      reps: number;
      weight: number;
      weightUnit: 'KG' | 'BLOCKS';
      videoUrl: string | null;
      status: Exercise['status'];
      completedSets: boolean[];
      sortOrder: number;
    }>,
  ) => request<Exercise>(`/exercises/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteExercise: (id: string) => request(`/exercises/${id}`, { method: 'DELETE' }),

  uploadExerciseVideo: async (exerciseId: string, file: File) => {
    const token = getToken();
    const fd = new FormData();
    fd.append('file', file);
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${base}/upload/exercises/${exerciseId}/video`, {
      method: 'POST',
      headers,
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || res.statusText);
    }
    return res.json() as Promise<Exercise>;
  },
};

export function mediaUrl(pathOrName: string | null | undefined): string | null {
  if (!pathOrName) return null;
  const origin = base.replace(/\/api\/?$/, '');
  if (pathOrName.startsWith('http')) return pathOrName;
  return `${origin}/uploads/${pathOrName.replace(/^\//, '')}`;
}
