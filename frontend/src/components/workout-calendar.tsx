'use client';

import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { EventClickArg, EventDropArg, DatesSetArg, DateSelectArg } from '@fullcalendar/core';
import type { Workout } from '@/lib/types';

const TZ = 'Asia/Yekaterinburg';

type Props = {
  workouts: Workout[];
  canEdit: boolean;
  onRangeChange: (from: string, to: string) => void;
  onSelectSlot?: (start: Date) => void;
  onEventMoved?: (workoutId: string, start: Date) => void;
};

export function WorkoutCalendar({ workouts, canEdit, onRangeChange, onSelectSlot, onEventMoved }: Props) {
  const router = useRouter();

  const events = useMemo(
    () =>
      workouts.map((w) => {
        const start = new Date(w.startAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          id: w.id,
          title: w.title,
          start: start.toISOString(),
          end: end.toISOString(),
        };
      }),
    [workouts],
  );

  const onDatesSet = useCallback(
    (arg: DatesSetArg) => {
      onRangeChange(arg.start.toISOString(), arg.end.toISOString());
    },
    [onRangeChange],
  );

  const onEventClick = useCallback(
    (info: EventClickArg) => {
      router.push(`/workouts/${info.event.id}`);
    },
    [router],
  );

  const onSelect = useCallback(
    (sel: DateSelectArg) => {
      if (!canEdit || !onSelectSlot) return;
      onSelectSlot(sel.start);
      sel.view.calendar.unselect();
    },
    [canEdit, onSelectSlot],
  );

  const onEventDrop = useCallback(
    (info: EventDropArg) => {
      if (!canEdit || !onEventMoved) return;
      onEventMoved(info.event.id, info.event.start!);
    },
    [canEdit, onEventMoved],
  );

  return (
    <div className="workout-calendar min-h-[560px] rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={ruLocale}
        timeZone={TZ}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        allDaySlot={false}
        height="auto"
        editable={canEdit}
        selectable={canEdit}
        selectMirror
        dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        events={events}
        datesSet={onDatesSet}
        eventClick={onEventClick}
        select={onSelect}
        eventDrop={onEventDrop}
        longPressDelay={200}
      />
    </div>
  );
}
