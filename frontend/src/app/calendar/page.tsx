'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { StudentRow, Workout } from '@/lib/types';

const WorkoutCalendar = dynamic(
  () => import('@/components/workout-calendar').then((m) => m.WorkoutCalendar),
  { ssr: false, loading: () => <div className="p-8 text-center text-sm text-zinc-500">Календарь загружается…</div> },
);

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [newTitle, setNewTitle] = useState('Тренировка');
  const [pending, setPending] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'COACH';

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN')) return;
    void (async () => {
      try {
        if (user.role === 'COACH') {
          const list = await api.coachStudents();
          setStudents(list.filter((s) => !s.blocked));
          setStudentId((prev) => prev ?? list.find((s) => !s.blocked)?.id ?? null);
        } else {
          const list = await api.users();
          const studs = list
            .filter((u) => u.role === 'STUDENT' && !u.blocked)
            .map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name,
              blocked: u.blocked,
              createdAt: u.createdAt,
            }));
          setStudents(studs);
          setStudentId((prev) => prev ?? studs[0]?.id ?? null);
        }
      } catch {
        setLoadErr('Не удалось загрузить учеников');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'COACH' && !studentId) return;
    if (!range) return;
    const sid = user.role === 'STUDENT' ? undefined : studentId ?? undefined;
    if (user.role !== 'STUDENT' && !sid) return;
    void (async () => {
      try {
        const data = await api.workoutsRange({
          studentId: sid,
          from: range.from,
          to: range.to,
        });
        setWorkouts(data);
        setLoadErr(null);
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : 'Ошибка загрузки');
      }
    })();
  }, [user, studentId, range]);

  const onRangeChange = useCallback((from: string, to: string) => {
    setRange({ from, to });
  }, []);

  const onSelectSlot = useCallback((start: Date) => {
    setSlotStart(start);
    setNewTitle('Тренировка');
    setCreateOpen(true);
  }, []);

  const onEventMoved = useCallback(
    async (workoutId: string, start: Date) => {
      try {
        await api.updateWorkout(workoutId, { startAt: start.toISOString() });
        if (range && user) {
          const sid = user.role === 'STUDENT' ? undefined : studentId ?? undefined;
          if (user.role === 'STUDENT' || sid) {
            const data = await api.workoutsRange({ studentId: sid, from: range.from, to: range.to });
            setWorkouts(data);
          }
        }
      } catch {
        setLoadErr('Не удалось перенести тренировку');
      }
    },
    [range, studentId, user],
  );

  async function submitCreate() {
    if (!slotStart || !user) return;
    setPending(true);
    try {
      const sid = user.role === 'STUDENT' ? undefined : studentId ?? undefined;
      await api.createWorkout({
        studentId: sid,
        title: newTitle.trim() || 'Тренировка',
        startAt: slotStart.toISOString(),
      });
      setCreateOpen(false);
      if (range) {
        const data = await api.workoutsRange({
          studentId: sid,
          from: range.from,
          to: range.to,
        });
        setWorkouts(data);
      }
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Ошибка создания');
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
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
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Календарь</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Часовой пояс отображения: Asia/Yekaterinburg (UTC+5). Клик по событию — канбан тренировки.
            </p>
          </div>
          {user.role === 'COACH' || user.role === 'ADMIN' ? (
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="student" className="text-xs uppercase text-zinc-500">
                Ученик
              </Label>
              <select
                id="student"
                className="h-10 rounded-md border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700"
                value={studentId ?? ''}
                onChange={(e) => setStudentId(e.target.value || null)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        {loadErr ? <p className="text-sm text-red-600 dark:text-red-400">{loadErr}</p> : null}
        {(user.role === 'COACH' || user.role === 'ADMIN') && !students.length ? (
          <p className="text-sm text-zinc-600">
            {user.role === 'COACH'
              ? 'Нет привязанных учеников. Администратор должен назначить тренера ученику.'
              : 'Нет учеников в системе. Создайте пользователя с ролью STUDENT в админке.'}
          </p>
        ) : (
          <WorkoutCalendar
            workouts={workouts}
            canEdit={canEdit}
            onRangeChange={onRangeChange}
            onSelectSlot={canEdit ? onSelectSlot : undefined}
            onEventMoved={canEdit ? onEventMoved : undefined}
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая тренировка</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            {slotStart ? (
              <p className="text-xs text-zinc-500">
                Начало: {slotStart.toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' })}
              </p>
            ) : null}
            <Button type="button" onClick={() => void submitCreate()} disabled={pending}>
              {pending ? 'Сохранение…' : 'Создать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
