'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudyPlan, StudyPlanItem } from '@/lib/gemini';
import { useSyllabus } from '@/lib/hooks/use-syllabus';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Calendar, TrendingUp, PartyPopper,
  BookOpen, Zap, Clock, ChevronRight, Star
} from 'lucide-react';

type StudyPlanWeek = {
  month: number;
  week: number;
  startDate: string;
  endDate: string;
  focus: string;
  topics: {
    subject: string;
    unit: string;
    topic: string;
    isHighYield: boolean;
  }[];
};

// Soft color palette per subject (cycles through)
const SUBJECT_PALETTES = [
  { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', accent: 'text-violet-600' },
  { bg: 'bg-sky-50',    border: 'border-sky-200',    badge: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500',    accent: 'text-sky-600' },
  { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',  accent: 'text-amber-600' },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',dot:'bg-emerald-500',accent: 'text-emerald-600' },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   badge: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',   accent: 'text-rose-600' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', accent: 'text-indigo-600' },
];

function getSubjectPalette(subject: string, subjectMap: Map<string, number>) {
  if (!subjectMap.has(subject)) {
    subjectMap.set(subject, subjectMap.size % SUBJECT_PALETTES.length);
  }
  return SUBJECT_PALETTES[subjectMap.get(subject)!];
}

export const StudyPlan = () => {
  const [genLoading, setGenLoading] = useState(false);
  const [pace, setPace] = useState('moderate');
  const [durationMonths, setDurationMonths] = useState<3 | 4>(3);
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);
  const [source, setSource] = useState<'gemini' | 'fallback' | 'cache' | null>(null);
  const [groupByWeek, setGroupByWeek] = useState(false);
  const [weekPlan, setWeekPlan] = useState<StudyPlanWeek[]>([]);
  const { semester: sem, loading, error } = useSyllabus(6);

  const subjectColorMap = new Map<string, number>();

  const generate = async () => {
    if (!sem) return;
    setGenLoading(true);
    try {
      const res = await fetch('/api/ai-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semester: sem.semesterNumber, durationMonths }),
      });

      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `Planner failed (${res.status})`);
      }

      const weeks: StudyPlanWeek[] = data.plan ?? [];
      setWeekPlan(weeks);
      setSource(data.source ?? null);

      // Flatten weeks → daily items
      const flattened: StudyPlanItem[] = [];
      let dayCounter = 1;
      for (const week of weeks) {
        for (const topic of week.topics) {
          flattened.push({
            day: dayCounter++,
            subject: topic.subject,
            topic: topic.topic,
            estimatedTime: topic.isHighYield ? '2–3 hrs · High Yield' : '1–2 hrs',
          });
        }
      }
      setPlan(flattened);
    } catch (err) {
      console.error('Study plan generation failed:', err);
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em]">Loading Planner...</p>
      </div>
    </div>
  );

  if (error || !sem) return (
    <div className="py-20 text-center">
      <p className="text-sm font-bold text-rose-500 uppercase tracking-[0.15em]">Failed to load semester data</p>
    </div>
  );

  const hasPlan = plan.length > 0;

  return (
    <div className="space-y-8 pb-20">

      {/* ── Hero Config Card ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Colour blob */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-8">
          {/* Header row */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">AI Planner</span>
              </div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight leading-tight">
                Build your study<br />roadmap
              </h2>
            </div>

            {/* Stats pill */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
                <p className="text-[18px] font-black text-neutral-900 leading-none">{sem.semesterNumber}</p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Semester</p>
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            {/* Intensity */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">
                Study Intensity
              </label>
              <Select value={pace} onValueChange={setPace}>
                <SelectTrigger className="h-10 bg-neutral-50 border-neutral-200 rounded-xl font-bold text-sm hover:border-indigo-300 transition-colors focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 shadow-lg">
                  <SelectItem value="light" className="font-semibold py-2.5 text-sm">🌿 Light Pace</SelectItem>
                  <SelectItem value="moderate" className="font-semibold py-2.5 text-sm">⚡ Moderate</SelectItem>
                  <SelectItem value="intensive" className="font-semibold py-2.5 text-sm text-orange-600">🔥 Intensive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">
                Duration
              </label>
              <Select
                value={String(durationMonths)}
                onValueChange={(v) => setDurationMonths(Number(v) as 3 | 4)}
              >
                <SelectTrigger className="h-10 bg-neutral-50 border-neutral-200 rounded-xl font-bold text-sm hover:border-indigo-300 transition-colors focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 shadow-lg">
                  <SelectItem value="3" className="font-semibold py-2.5 text-sm">3 Months</SelectItem>
                  <SelectItem value="4" className="font-semibold py-2.5 text-sm">4 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate */}
            <Button
              onClick={generate}
              disabled={genLoading}
              className="h-10 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-2 sm:self-end"
            >
              {genLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  BUILDING...
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  GENERATE
                </>
              )}
            </Button>
          </div>

          {/* Source badge — shows after plan loads */}
          {source && (
            <div className="mt-5 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                source === 'gemini'
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  : source === 'cache'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : 'bg-amber-50 border-amber-100 text-amber-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  source === 'gemini' ? 'bg-indigo-500' : source === 'cache' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {source === 'gemini' ? 'AI Generated' : source === 'cache' ? 'Cached Plan' : 'Smart Schedule'}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">
                {plan.length} topics · {durationMonths} months
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Plan Output ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {hasPlan ? (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Section header + view toggle */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Your Roadmap
                </span>
                <div className="h-px w-12 bg-neutral-200" />
              </div>

              {/* Week / Day toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
                <button
                  onClick={() => setGroupByWeek(false)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    !groupByWeek
                      ? 'bg-white text-indigo-600 shadow-sm border border-neutral-200'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  By Day
                </button>
                <button
                  onClick={() => setGroupByWeek(true)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    groupByWeek
                      ? 'bg-white text-indigo-600 shadow-sm border border-neutral-200'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  By Week
                </button>
              </div>
            </div>

            {/* ── By Day view ── */}
            {!groupByWeek && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plan.map((item, i) => {
                  const palette = getSubjectPalette(item.subject, subjectColorMap);
                  const isHighYield = item.estimatedTime.includes('High Yield');
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.6) }}
                      className={`relative p-5 rounded-2xl border ${palette.bg} ${palette.border} flex flex-col gap-3 group hover:shadow-md transition-all duration-200 overflow-hidden`}
                    >
                      {/* Big number watermark */}
                      <span className="absolute -right-1 -bottom-3 text-[72px] font-black opacity-[0.07] text-neutral-900 select-none pointer-events-none leading-none">
                        {item.day}
                      </span>

                      {/* Top row */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg border ${palette.badge} ${palette.border}`}>
                          Day {item.day}
                        </span>
                        {isHighYield && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-wider">
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            High Yield
                          </span>
                        )}
                      </div>

                      {/* Subject */}
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${palette.accent}`}>
                          {item.subject}
                        </p>
                        <p className="text-[13px] font-bold text-neutral-800 leading-snug line-clamp-2">
                          {item.topic}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-200/60">
                        <Clock size={10} className="text-neutral-400" />
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                          {item.estimatedTime.split('·')[0].trim()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── By Week view ── */}
            {groupByWeek && (
              <div className="space-y-4">
                {weekPlan.map((week, wi) => (
                  <motion.div
                    key={wi}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: wi * 0.06 }}
                    className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm"
                  >
                    {/* Week header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                          <span className="text-[11px] font-black text-white">W{week.week}</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-800">
                            Month {week.month} · Week {week.week}
                          </p>
                          <p className="text-[10px] font-medium text-neutral-400">
                            {week.startDate} → {week.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">
                          {week.topics.length} topics
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-wider max-w-[160px] truncate">
                          {week.focus}
                        </span>
                      </div>
                    </div>

                    {/* Topics list */}
                    <div className="divide-y divide-neutral-50">
                      {week.topics.map((topic, ti) => {
                        const palette = getSubjectPalette(topic.subject, subjectColorMap);
                        return (
                          <div
                            key={ti}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${palette.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${palette.accent}`}>
                                {topic.subject}
                              </p>
                              <p className="text-[12px] font-semibold text-neutral-700 truncate">
                                {topic.topic}
                              </p>
                            </div>
                            {topic.isHighYield && (
                              <Star size={12} className="flex-shrink-0 fill-amber-400 text-amber-400" />
                            )}
                          </div>
                        );
                      })}
                      {week.topics.length === 0 && (
                        <div className="px-5 py-4 text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                          Revision / buffer week
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── Footer ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 p-6 rounded-2xl bg-emerald-50 border border-emerald-100"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm flex-shrink-0">
                <PartyPopper size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900">Plan locked in.</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                  Mark topics done to auto-refresh your schedule
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : !genLoading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-5">
              <Calendar size={28} strokeWidth={1.5} className="text-neutral-300" />
            </div>
            <p className="text-sm font-black text-neutral-300 uppercase tracking-[0.2em] mb-2">No Plan Yet</p>
            <p className="text-[12px] text-neutral-400 font-medium max-w-[220px] leading-relaxed">
              Hit Generate to build your personalised study roadmap
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-neutral-100 border border-neutral-200 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};