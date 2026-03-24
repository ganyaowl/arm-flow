'use client';

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import type { Exercise, ExerciseStatus, Workout } from '@/lib/types';

const COLS: { id: ExerciseStatus; title: string }[] = [
  { id: 'TODO', title: 'К выполнению' },
  { id: 'IN_PROGRESS', title: 'В процессе' },
  { id: 'DONE', title: 'Готово' },
];

function Column({
  id,
  title,
  children,
}: {
  id: ExerciseStatus;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[420px] flex-1 flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40',
        isOver && 'ring-2 ring-zinc-400 dark:ring-zinc-600',
      )}
    >
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ExerciseCard({ exercise, children }: { exercise: Exercise; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: exercise.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab touch-none rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-950',
        isDragging && 'opacity-60',
      )}
    >
      {children}
    </div>
  );
}

export default function WorkoutKanbanPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [blocks, setBlocks] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'COACH';
  const canMove = user?.role === 'STUDENT' || canManage;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const byId = useMemo(() => new Map((workout?.exercises ?? []).map((e) => [e.id, e])), [workout?.exercises]);

  const load = useCallback(async () => {
    try {
      const w = await api.workout(id);
      setWorkout(w);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  function resolveTargetStatus(overId: string | undefined): ExerciseStatus | null {
    if (!overId) return null;
    if (overId === 'TODO' || overId === 'IN_PROGRESS' || overId === 'DONE') return overId;
    const ex = byId.get(overId);
    return ex?.status ?? null;
  }

  async function onDragEnd(ev: DragEndEvent) {
    if (!canMove) return;
    const activeId = String(ev.active.id);
    const target = resolveTargetStatus(ev.over?.id as string | undefined);
    const ex = byId.get(activeId);
    if (!target || !ex || ex.status === target) return;
    try {
      await api.updateExercise(activeId, { status: target });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось переместить');
    }
  }

  async function toggleSet(exercise: Exercise, index: number) {
    const next = [...exercise.completedSets];
    if (next.length !== exercise.sets) {
      next.length = exercise.sets;
      for (let i = 0; i < exercise.sets; i++) next[i] = next[i] ?? false;
    }
    next[index] = !next[index];
    try {
      await api.updateExercise(exercise.id, { completedSets: next });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function submitExercise() {
    if (!workout) return;
    setPending(true);
    try {
      const created = await api.createExercise(workout.id, {
        title: title.trim() || 'Упражнение',
        description: description.trim() || undefined,
        sets,
        reps,
        weight,
        weightUnit: blocks ? 'BLOCKS' : 'KG',
        videoUrl: videoUrl.trim() || undefined,
      });
      if (videoFile) {
        await api.uploadExerciseVideo(created.id, videoFile);
      }
      setAddOpen(false);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setVideoFile(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setPending(false);
    }
  }

  async function removeWorkout() {
    if (!workout || !canManage) return;
    if (!confirm('Удалить тренировку?')) return;
    try {
      await api.deleteWorkout(workout.id);
      router.push('/calendar');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  const grouped = useMemo(() => {
    const g: Record<ExerciseStatus, Exercise[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const e of workout?.exercises ?? []) {
      g[e.status].push(e);
    }
    for (const k of Object.keys(g) as ExerciseStatus[]) {
      g[k].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    }
    return g;
  }, [workout?.exercises]);

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/calendar" className="text-sm text-zinc-600 underline dark:text-zinc-400">
              ← Календарь
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {workout?.title ?? 'Тренировка'}
            </h1>
            {workout ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(workout.startAt).toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <>
                <Button type="button" onClick={() => setAddOpen(true)}>
                  Добавить упражнение
                </Button>
                <Button type="button" variant="destructive" onClick={() => void removeWorkout()}>
                  Удалить тренировку
                </Button>
              </>
            ) : null}
          </div>
        </div>
        {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}

        {!workout ? (
          <p className="text-sm text-zinc-600">Нет данных</p>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="flex flex-col gap-4 lg:flex-row">
              {COLS.map((c) => (
                <Column key={c.id} id={c.id} title={c.title}>
                  {grouped[c.id].map((ex) => (
                    <ExerciseCard key={ex.id} exercise={ex}>
                      <div className="font-medium">{ex.title}</div>
                      {ex.description ? (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
                          {ex.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                        Подходы: {ex.sets} × {ex.reps} · {ex.weight}{' '}
                        {ex.weightUnit === 'BLOCKS' ? 'блоков' : 'кг'}
                      </p>
                      {ex.videoUrl ? (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-blue-600 underline dark:text-blue-400"
                        >
                          Видео (ссылка)
                        </a>
                      ) : null}
                      {ex.mediaPath ? (
                        <a
                          href={mediaUrl(ex.mediaPath) ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-blue-600 underline dark:text-blue-400"
                        >
                          Видео (файл)
                        </a>
                      ) : null}
                      <div className="mt-3 space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                        <p className="text-xs font-medium text-zinc-500">Подходы</p>
                        {Array.from({ length: ex.sets }, (_, i) => (
                          <label key={i} className="flex items-center gap-2 text-xs">
                            <Checkbox
                              checked={!!ex.completedSets[i]}
                              onCheckedChange={() => void toggleSet(ex, i)}
                              disabled={!canMove}
                            />
                            <span>Подход {i + 1}</span>
                          </label>
                        ))}
                      </div>
                    </ExerciseCard>
                  ))}
                </Column>
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новое упражнение</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="ex-title">Название</Label>
              <Input id="ex-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-desc">Описание / заметки</Label>
              <textarea
                id="ex-desc"
                className="min-h-[80px] w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Подходы</Label>
                <Input
                  type="number"
                  min={1}
                  value={sets}
                  onChange={(e) => setSets(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Повторы</Label>
                <Input
                  type="number"
                  min={1}
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Вес</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <span className="text-sm">КГ / Блоки</span>
              <div className="flex items-center gap-2 text-xs">
                <span>КГ</span>
                <Switch checked={blocks} onCheckedChange={setBlocks} />
                <span>Блоки</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-vid">URL видео (YouTube / Vimeo)</Label>
              <Input
                id="ex-vid"
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-file">Или файл .mp4 / .webm</Label>
              <Input
                id="ex-file"
                type="file"
                accept=".mp4,.webm,video/mp4,video/webm"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="button" onClick={() => void submitExercise()} disabled={pending}>
              {pending ? 'Сохранение…' : 'Добавить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
