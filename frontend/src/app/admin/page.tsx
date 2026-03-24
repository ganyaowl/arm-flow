'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';

type Row = {
  id: string;
  email: string;
  name: string;
  role: Role;
  coachId: string | null;
  blocked: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [coaches, setCoaches] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [coachId, setCoachId] = useState('');
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const list = (await api.users()) as Row[];
    setRows(list);
    setCoaches(list.filter((u) => u.role === 'COACH' && !u.blocked));
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/calendar');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      void load().catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'));
    }
  }, [user, load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    try {
      await api.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        coachId: role === 'STUDENT' ? coachId || undefined : undefined,
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('STUDENT');
      setCoachId('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setPending(false);
    }
  }

  async function toggleBlock(row: Row) {
    try {
      await api.updateUser(row.id, { blocked: !row.blocked });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Удалить ${row.email}?`)) return;
    try {
      await api.deleteUser(row.id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col">
        <AppNav />
        <div className="p-8 text-center text-sm">Загрузка…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-4">
        <div>
          <h1 className="text-lg font-semibold">Админ-панель</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Пользователи, роли, блокировка</p>
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold">Новый пользователь</h2>
          <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="a-name">Имя</Label>
              <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-email">Email</Label>
              <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-pass">Пароль</Label>
              <Input
                id="a-pass"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-role">Роль</Label>
              <select
                id="a-role"
                className="h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="STUDENT">Ученик</option>
                <option value="COACH">Тренер</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>
            {role === 'STUDENT' ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="a-coach">Тренер</Label>
                <select
                  id="a-coach"
                  className="h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700"
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                >
                  <option value="">— позже / без тренера —</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? 'Создание…' : 'Создать'}
              </Button>
            </div>
          </form>
        </section>

        <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="p-3 font-medium">Имя</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Роль</th>
                <th className="p-3 font-medium">Статус</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.role}</td>
                  <td className="p-3">{r.blocked ? 'Заблокирован' : 'Активен'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => void toggleBlock(r)}>
                        {r.blocked ? 'Разблокировать' : 'Блокировать'}
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => void remove(r)}>
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
