import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  List,
  LayoutGrid,
  X
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import type { CalendarEvent, Client } from '../types';

interface CalendarPageProps {
  events: CalendarEvent[];
  clients: Client[];
  onCreateEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

/* ── Design tokens (matched to landing & auth pages) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#6B6158',
  muted: '#8C8278',
  accent: '#937A62',
  accentSoft: '#B39C82',
  dark: '#2A2320'
};

/* Quiet, monochrome event type palette — no loud colors */
const typeMeta: Record<string, { label: string; dot: string }> = {
  deadline: { label: 'Deadline', dot: T.dark },
  invoice_due: { label: 'Invoice due', dot: T.accent },
  meeting: { label: 'Meeting', dot: T.accentSoft },
  milestone: { label: 'Milestone', dot: T.muted }
};

const emptyForm = {
  title: '',
  clientName: '',
  date: '',
  type: 'deadline' as 'deadline' | 'meeting' | 'milestone' | 'invoice_due',
  description: ''
};

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  clients,
  onCreateEvent,
  onDeleteEvent
}) => {
  const { showToast } = useToast();

  // Real current month & day — no static dates
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const selectedDateRef = useRef<HTMLDivElement>(null);

  /** Scroll to the selected-date panel on mobile */
  const scrollToSelectedDate = useCallback(() => {
    if (window.innerWidth < 1024 && selectedDateRef.current) {
      selectedDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthLabel = `${monthNames[month]} ${year}`;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  // Month grid calculations
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInCurrentMonth = lastDayOfMonth.getDate();

    // Monday-indexed offset (0 = Mon, 6 = Sun)
    const rawDay = firstDayOfMonth.getDay();
    const startDayOffset = (rawDay + 6) % 7;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevDays: { day: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const prevD = prevMonthLastDay - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const mStr = prevM < 10 ? `0${prevM}` : `${prevM}`;
      const dStr = prevD < 10 ? `0${prevD}` : `${prevD}`;
      prevDays.push({ day: prevD, isCurrentMonth: false, fullDate: `${prevY}-${mStr}-${dStr}` });
    }

    const currentDays: { day: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const mStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
      const dStr = d < 10 ? `0${d}` : `${d}`;
      currentDays.push({ day: d, isCurrentMonth: true, fullDate: `${year}-${mStr}-${dStr}` });
    }

    const totalFilled = prevDays.length + currentDays.length;
    const remaining = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    const nextDays: { day: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    for (let d = 1; d <= remaining; d++) {
      const nextM = month + 2 > 12 ? 1 : month + 2;
      const nextY = month + 2 > 12 ? year + 1 : year;
      const mStr = nextM < 10 ? `0${nextM}` : `${nextM}`;
      const dStr = d < 10 ? `0${d}` : `${d}`;
      nextDays.push({ day: d, isCurrentMonth: false, fullDate: `${nextY}-${mStr}-${dStr}` });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [year, month]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (typeFilter === 'All') return true;
      if (typeFilter === 'deadlines') return e.type === 'deadline';
      if (typeFilter === 'invoices') return e.type === 'invoice_due';
      if (typeFilter === 'meetings') return e.type === 'meeting';
      if (typeFilter === 'milestones') return e.type === 'milestone';
      return true;
    });
  }, [events, typeFilter]);

  // Selected date events
  const selectedDateStr = useMemo(() => {
    if (!selectedDay) return null;
    const mStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dStr = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;
    return `${year}-${mStr}-${dStr}`;
  }, [year, month, selectedDay]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return filteredEvents.filter(e => e.date === selectedDateStr || e.date.endsWith(`-${selectedDateStr.slice(-2)}`));
  }, [filteredEvents, selectedDateStr]);

  const openCreateForDate = (dateStr: string) => {
    setFormData({
      ...emptyForm,
      clientName: clients[0]?.name || '',
      date: dateStr
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await onCreateEvent(formData);
    setIsModalOpen(false);
    showToast(`Event "${formData.title}" added to calendar!`, 'success');
    setFormData(emptyForm);
  };

  const inputClass =
    'w-full px-3 py-2 text-[13px] bg-white border rounded-lg transition-all focus:outline-none';

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: T.ink }}>Calendar</h1>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Deadlines, milestones, meetings, and invoice due dates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="segmented-control">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 py-1 text-[11px] rounded-md flex items-center gap-1 transition-all cursor-pointer ${viewMode === 'month' ? 'bg-white font-medium shadow-2xs' : ''}`}
              style={{ color: viewMode === 'month' ? T.ink : T.muted }}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-2 py-1 text-[11px] rounded-md flex items-center gap-1 transition-all cursor-pointer ${viewMode === 'agenda' ? 'bg-white font-medium shadow-2xs' : ''}`}
              style={{ color: viewMode === 'agenda' ? T.ink : T.muted }}
            >
              <List className="w-3 h-3" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-0.5 border p-0.5 rounded-lg" style={{ borderColor: T.border }}>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md transition-colors cursor-pointer hover:bg-[#F1EDE7]"
              style={{ color: T.muted }}
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer hover:bg-[#F1EDE7] whitespace-nowrap"
              style={{ color: T.ink }}
            >
              {currentMonthLabel}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md transition-colors cursor-pointer hover:bg-[#F1EDE7]"
              style={{ color: T.muted }}
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => openCreateForDate(selectedDateStr || new Date().toISOString().slice(0, 10))}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            className="hidden sm:flex"
          >
            Add Event
          </Button>
          <button
            onClick={() => openCreateForDate(selectedDateStr || new Date().toISOString().slice(0, 10))}
            className="sm:hidden p-2 rounded-lg cursor-pointer transition-colors"
            style={{ backgroundColor: T.dark, color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs — quiet text links */}
      <div className="flex items-center gap-5 overflow-x-auto pb-1 sm:pb-0 border-b" style={{ borderColor: T.border }}>
        {[
          { id: 'All', label: 'All Events', count: events.length },
          { id: 'deadlines', label: 'Deadlines', count: events.filter(e => e.type === 'deadline').length },
          { id: 'milestones', label: 'Milestones', count: events.filter(e => e.type === 'milestone').length },
          { id: 'invoices', label: 'Invoices Due', count: events.filter(e => e.type === 'invoice_due').length },
          { id: 'meetings', label: 'Meetings', count: events.filter(e => e.type === 'meeting').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className="relative pb-2.5 text-xs whitespace-nowrap cursor-pointer transition-colors"
            style={{
              color: typeFilter === tab.id ? T.ink : T.muted,
              fontWeight: typeFilter === tab.id ? 600 : 400
            }}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px]" style={{ color: T.muted }}>{tab.count}</span>
            {typeFilter === tab.id && (
              <span
                className="absolute left-0 right-0 bottom-[-1px] h-[2px] rounded-full"
                style={{ backgroundColor: T.accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* View Mode: Month Grid vs Agenda List */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Month Grid */}
          <div className="lg:col-span-8">
            <Card padding="none" className="overflow-hidden" style={{ borderColor: T.border }}>
              {/* Day Headers (Mon - Sun) */}
              <div
                className="grid grid-cols-7 border-b text-center text-[10px] font-semibold uppercase tracking-wider py-2.5"
                style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.muted }}
              >
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Month Cells Grid — hairlines only */}
              <div className="grid grid-cols-7 divide-x divide-y divide-[#F4F0EA]" style={{ backgroundColor: T.surface }}>
                {calendarData.map((cell, idx) => {
                  const dayEvents = filteredEvents.filter(
                    e => e.date === cell.fullDate || (cell.isCurrentMonth && e.date.endsWith(`-${cell.day < 10 ? `0${cell.day}` : cell.day}`))
                  );
                  const isSelected = cell.isCurrentMonth && selectedDay === cell.day;
                  const isTodayAnchor =
                    cell.fullDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                  return (
                    <div
                      key={`${cell.fullDate}-${idx}`}
                      onClick={() => {
                        if (cell.isCurrentMonth) {
                          setSelectedDay(cell.day);
                        } else {
                          const cellDate = new Date(cell.fullDate);
                          setCurrentDate(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
                          setSelectedDay(cell.day);
                        }
                        scrollToSelectedDate();
                      }}
                      className={`h-[68px] sm:h-[76px] p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col justify-between group select-none ${
                        !cell.isCurrentMonth
                          ? 'bg-[#FBFAF8]'
                          : isSelected
                          ? 'bg-[#F1EDE7]'
                          : 'hover:bg-[#FBFAF8]'
                      }`}
                    >
                      {/* Cell Header: Day Number & Event Dots */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                            isTodayAnchor
                              ? 'text-white font-bold'
                              : ''
                          }`}
                          style={{
                            backgroundColor: isTodayAnchor ? T.dark : 'transparent',
                            color: isTodayAnchor
                              ? '#FFFFFF'
                              : isSelected
                              ? T.ink
                              : cell.isCurrentMonth
                              ? T.ink
                              : '#C9C1B6'
                          }}
                        >
                          {cell.day}
                        </span>

                        {dayEvents.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            {dayEvents.slice(0, 3).map((ev, i) => (
                              <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: typeMeta[ev.type]?.dot || T.muted }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Event Snippet (Max 1 visible, +N more) */}
                      <div className="space-y-0.5 mt-0.5 overflow-hidden">
                        {dayEvents.slice(0, 1).map(ev => (
                          <div
                            key={ev.id}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedEventForDetail(ev);
                              scrollToSelectedDate();
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate leading-tight flex items-center gap-1"
                            style={{ backgroundColor: T.surfaceWarm, color: T.body }}
                            title={`${ev.title} (${ev.clientName})`}
                          >
                            <span
                              className="w-1 h-1 rounded-full shrink-0"
                              style={{ backgroundColor: typeMeta[ev.type]?.dot || T.muted }}
                            />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}

                        {dayEvents.length > 1 && (
                          <div className="text-[9px] font-medium pl-0.5 truncate leading-none" style={{ color: T.muted }}>
                            +{dayEvents.length - 1} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Legend */}
              <div
                className="px-4 py-2.5 border-t flex items-center justify-between flex-wrap gap-2 text-[11px]"
                style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.muted }}
              >
                <div className="flex items-center gap-3">
                  {Object.entries(typeMeta).map(([key, meta]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dot }} />
                      <span>{meta.label}</span>
                    </div>
                  ))}
                </div>

                <span>Click any date to view or schedule</span>
              </div>
            </Card>
          </div>

          {/* Side Panel: Selected Day & Upcoming Items */}
          <div ref={selectedDateRef} className="lg:col-span-4 space-y-4">
            {/* Selected Date Card */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: T.muted }}>
                    {selectedDateEvents.length > 0 ? `${selectedDateEvents.length} event${selectedDateEvents.length === 1 ? '' : 's'} on` : 'Selected date'}
                  </div>
                  <h3 className="font-bold text-sm mt-0.5" style={{ color: T.ink }}>
                    {selectedDateStr
                      ? new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Select a date'}
                  </h3>
                </div>

                {selectedDateStr && (
          <Button
            onClick={() => openCreateForDate(selectedDateStr || new Date().toISOString().slice(0, 10))}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add
          </Button>
                )}
              </div>

              <div className="pt-3">
                {selectedDateEvents.length === 0 ? (
                  <div
                    className="py-6 text-center text-xs rounded-xl border border-dashed p-4"
                    style={{ color: T.muted, borderColor: T.border }}
                  >
                    <p>No events scheduled for this day.</p>
                    <button
                      onClick={() => selectedDateStr && openCreateForDate(selectedDateStr)}
                      className="mt-2 text-xs font-semibold hover:underline cursor-pointer"
                      style={{ color: T.accent }}
                    >
                      + Schedule an event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[190px] overflow-y-auto pr-1">
                    {selectedDateEvents.map(ev => (
                      <div
                        key={ev.id}
                        className="group flex items-start justify-between gap-2 px-2 py-2 rounded-lg hover:bg-[#F1EDE7]/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: typeMeta[ev.type]?.dot || T.muted }}
                            />
                            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: T.muted }}>
                              {typeMeta[ev.type]?.label}
                            </span>
                          </div>
                          <div className="font-semibold text-xs mt-1 truncate" style={{ color: T.ink }}>
                            {ev.title}
                          </div>
                          <div className="text-[11px] truncate" style={{ color: T.muted }}>
                            {ev.clientName}
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            await onDeleteEvent(ev.id);
                            showToast('Event removed', 'info');
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity cursor-pointer shrink-0 hover:text-[#BD5C48]"
                          style={{ color: T.muted }}
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <h3 className="font-bold text-sm" style={{ color: T.ink }}>Upcoming schedule</h3>
                <span className="text-[11px]" style={{ color: T.muted }}>
                  {filteredEvents.length} items
                </span>
              </div>

              <div className="space-y-1 pt-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredEvents.length === 0 ? (
                  <div className="py-6 text-center text-xs" style={{ color: T.muted }}>
                    No upcoming events match the filter.
                  </div>
                ) : (
                  filteredEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="group flex items-start justify-between gap-2 px-2 py-2 rounded-lg hover:bg-[#F1EDE7]/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedEventForDetail(ev)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: typeMeta[ev.type]?.dot || T.muted }}
                          />
                          <span className="text-[10px] tabular-nums" style={{ color: T.muted }}>{ev.date}</span>
                        </div>
                        <div className="font-semibold text-xs mt-1 truncate" style={{ color: T.ink }}>
                          {ev.title}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: T.muted }}>
                          {ev.clientName}
                        </div>
                      </div>

                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          await onDeleteEvent(ev.id);
                          showToast('Event removed', 'info');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity cursor-pointer shrink-0 hover:text-[#BD5C48]"
                        style={{ color: T.muted }}
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Agenda / List View */
        <div className="space-y-2">
          {filteredEvents.length === 0 ? (
            <Card className="py-12 text-center" style={{ borderColor: T.border }}>
              <p className="text-sm" style={{ color: T.muted }}>No events scheduled.</p>
            </Card>
          ) : (
            filteredEvents.map(ev => (
              <div
                key={ev.id}
                className="flex items-start gap-3 px-3 sm:px-4 py-3 rounded-xl border transition-colors cursor-pointer hover:bg-[#F1EDE7]/40"
                style={{ borderColor: T.border, backgroundColor: T.surface }}
                onClick={() => setSelectedEventForDetail(ev)}
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: typeMeta[ev.type]?.dot || T.muted }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: T.ink }}>{ev.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: T.surfaceWarm, color: T.muted }}>{typeMeta[ev.type]?.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: T.muted }}>
                    <span className="font-mono tabular-nums">{ev.date}</span>
                    <span>·</span>
                    <span>{ev.clientName}</span>
                  </div>
                  {ev.description && (
                    <p className="text-[11px] mt-1 truncate" style={{ color: T.body }}>{ev.description}</p>
                  )}
                </div>
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    await onDeleteEvent(ev.id);
                    showToast('Event deleted', 'info');
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#FFF5F5] hover:text-[#BD5C48] transition-colors cursor-pointer shrink-0"
                  style={{ color: T.muted }}
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule event"
        subtitle="Set a deadline, milestone, meeting, or payment date"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: T.ink }}>
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Frontend Milestone Handoff"
              className={inputClass}
              style={{ borderColor: T.border, color: T.ink }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: T.ink }}>
                Client
              </label>
              <select
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                className={inputClass + ' cursor-pointer'}
                style={{ borderColor: T.border, color: T.ink, backgroundColor: T.surface }}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: T.ink }}>
                Category
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className={inputClass + ' cursor-pointer'}
                style={{ borderColor: T.border, color: T.ink, backgroundColor: T.surface }}
              >
                <option value="deadline">Project Deadline</option>
                <option value="milestone">Project Milestone</option>
                <option value="meeting">Client Meeting</option>
                <option value="invoice_due">Invoice Due Date</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: T.ink }}>
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className={inputClass}
              style={{ borderColor: T.border, color: T.ink }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: T.ink }}>
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Agenda items, deliverable checklist, or meeting link..."
              className={inputClass + ' resize-none'}
              style={{ borderColor: T.border, color: T.ink }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: T.bg }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Event Detail Modal */}
      {selectedEventForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEventForDetail(null)}
          title={selectedEventForDetail.title}
          subtitle={`Scheduled for ${selectedEventForDetail.date}`}
          maxWidth="md"
        >
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}
            >
              <span className="text-xs font-medium" style={{ color: T.muted }}>Category</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: T.ink }}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: typeMeta[selectedEventForDetail.type]?.dot || T.muted }}
                />
                {typeMeta[selectedEventForDetail.type]?.label}
              </span>
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}
            >
              <span className="text-xs font-medium" style={{ color: T.muted }}>Client</span>
              <span className="text-xs font-semibold" style={{ color: T.ink }}>{selectedEventForDetail.clientName}</span>
            </div>

            {selectedEventForDetail.description && (
              <div
                className="p-3 rounded-xl border"
                style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}
              >
                <span className="text-xs font-medium block mb-1" style={{ color: T.muted }}>Details</span>
                <p className="text-xs leading-relaxed" style={{ color: T.ink }}>{selectedEventForDetail.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: T.bg }}>
              <button
                onClick={async () => {
                  await onDeleteEvent(selectedEventForDetail.id);
                  setSelectedEventForDetail(null);
                  showToast('Event removed from schedule', 'info');
                }}
                className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:text-[#BD5C48] transition-colors"
                style={{ color: '#C86450' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>

              <Button variant="secondary" size="sm" onClick={() => setSelectedEventForDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};