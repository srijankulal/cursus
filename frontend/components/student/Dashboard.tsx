'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { storage } from '@/lib/storage';
import { syllabus, EXAM_DATE_DEFAULT } from '@/models/syllabus';
import { calculateRisk, RiskStatus } from '@/lib/riskCalculator';
import { cn } from '@/lib/utils';
import { CheckCircle2, Target, Clock, TrendingUp, Flame, BookMarked, Zap, CalendarDays } from 'lucide-react';

const riskMap = {
  green: {
    bg: 'from-emerald-600 to-teal-700', border: 'border-emerald-500/30',
    text: 'text-white', accent: 'bg-emerald-400', ring: 'ring-emerald-500/20',
    label: 'Optimal Pace', sub: 'You are on track for your exams.'
  },
  blue: {
    bg: 'from-blue-600 to-indigo-700', border: 'border-blue-500/30',
    text: 'text-white', accent: 'bg-blue-400', ring: 'ring-blue-500/20',
    label: 'Steady Progress', sub: 'Maintain your current pace to stay on schedule.'
  },
  yellow: {
    bg: 'from-amber-500 to-orange-600', border: 'border-amber-400/30',
    text: 'text-white', accent: 'bg-amber-300', ring: 'ring-amber-500/20',
    label: 'Behind Schedule', sub: 'A slight increase in pace is recommended.'
  },
  red: {
    bg: 'from-rose-600 to-red-700', border: 'border-rose-500/30',
    text: 'text-white', accent: 'bg-rose-400', ring: 'ring-rose-500/20',
    label: 'Critical Risk', sub: 'Significant study time required immediately.'
  },
} as const;

function StatCard({ icon: Icon, label, value, color, delay }: { icon: any, label: string, value: string | number, color: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 rounded-2xl bg-white border border-app-border shadow-premium hover:shadow-card-hover transition-all hover:-translate-y-1 relative overflow-hidden group"
    >
      <div className={cn("absolute -right-4 -top-4 w-16 h-16 opacity-10 group-hover:scale-125 transition-transform rounded-full", color)} />
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-neutral-900 leading-none mb-1">{value}</p>
        <p className="text-[11px] font-bold text-app-muted uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
}

export const Dashboard = () => {
  const [status, setStatus] = useState<RiskStatus | null>(null);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);

  const sem = syllabus[0];
  const allTopics = sem.subjects.flatMap(s => s.units.flatMap(u => u.topics));
  const allHY = allTopics.filter(t => t.isHighYield);

  useEffect(() => {
    const ids = storage.getCompletedTopics();
    const examDate = storage.getExamDate() || EXAM_DATE_DEFAULT;
    setStatus(calculateRisk(allTopics.length, ids.length, examDate));
    setRecentTopics(
      [...ids].reverse().slice(0, 5).map(id => allTopics.find(t => t.id === id)?.name ?? id)
    );
  }, []);

  if (!status) return null;

  const risk = riskMap[status.riskLevel];
  const completedIds = storage.getCompletedTopics();
  const hyLeft = allHY.length - completedIds.filter(id => allHY.some(t => t.id === id)).length;

  return (
    <div className="space-y-10 pb-10">
      {/* Risk Banner - Vibrant Full Color Gradient */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'p-5 sm:p-8 rounded-2xl sm:rounded-3xl border bg-gradient-to-br shadow-premium relative overflow-hidden group',
          risk.bg, risk.border, risk.text
        )}
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
          <div className="space-y-4 max-w-xl">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md shadow-sm")}>
                {risk.label}
              </span>
              <div className="flex items-center gap-1.5 text-white/70 font-bold text-[10px] sm:text-[11px]">
                <CalendarDays size={13} />
                <span className="uppercase tracking-widest">EXAM IN {status.daysLeft} DAYS</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-none">
                {status.percentageComplete}% <span className="text-lg sm:text-xl font-bold opacity-60 tracking-normal ml-1">Complete</span>
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base font-medium opacity-80 max-w-md">
                {risk.sub}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-6 pt-6 lg:pt-0 lg:pl-10 border-t lg:border-t-0 lg:border-l border-white/20">
            {[
              { label: 'Target / Day', v: status.requiredPace, icon: Target },
              { label: 'Current Pace', v: status.currentPace, icon: TrendingUp },
              { label: 'Topics Left', v: status.totalTopics - status.completedTopics, icon: BookMarked },
              { label: 'Days Left', v: status.daysLeft, icon: Clock },
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5 opacity-70">
                  <s.icon size={13} className="shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{s.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold leading-none">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-10 h-3 rounded-full bg-black/20 overflow-hidden ring-1 ring-inset ring-white/10 mb-2 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${status.percentageComplete}%` }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className="h-full rounded-full bg-white shadow-lg"
          />
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column - Stats Cards */}
        <div className="lg:col-span-7 space-y-10">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-[0.2em] ml-1">Core Metrics</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard icon={Zap} label="High Yield Left" value={hyLeft} color="bg-orange-500" delay={0.1} />
              <StatCard icon={CheckCircle2} label="Topics Done" value={status.completedTopics} color="bg-emerald-500" delay={0.2} />
              <StatCard icon={BookMarked} label="Total Content" value={status.totalTopics} color="bg-blue-600" delay={0.3} />
              <StatCard icon={TrendingUp} label="Daily Progress" value={status.currentPace} color="bg-indigo-600" delay={0.4} />
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-[0.2em] mb-6 ml-1">Subject Mastery</h3>
            <div className="grid grid-cols-1 gap-4">
              {sem.subjects.map((sub, i) => {
                const topics = sub.units.flatMap(u => u.topics);
                const done = topics.filter(t => completedIds.includes(t.id)).length;
                const pct = Math.round((done / topics.length) * 100);
                const colors = ['bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500'];
                const accent = colors[i % colors.length];
                
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="p-5 rounded-2xl bg-white border border-app-border shadow-premium hover:shadow-card-hover transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 mr-8">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[15px] font-bold text-neutral-900 tracking-tight">{sub.name}</span>
                         <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg bg-neutral-100", accent.replace('bg-', 'text-'))}>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden shadow-inner ring-1 ring-black/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className={cn("h-full rounded-full transition-all duration-500", accent)}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-app-muted tracking-tight">{done} / {topics.length}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-5 flex flex-col pt-0">
          <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-[0.2em] mb-6 ml-1">Recent Progress</h3>
          <div className="flex-1 rounded-3xl border border-app-border bg-white shadow-premium overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-5 bg-neutral-50 border-b border-app-border flex items-center justify-between">
               <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Marked Topic</span>
               <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Status</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-app-border/60">
              {recentTopics.length > 0 ? recentTopics.map((topic, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="px-6 py-5 flex items-center gap-4 hover:bg-neutral-50/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200/50">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-800 truncate leading-snug">{topic}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-tight mt-0.5">Verified</p>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 border border-neutral-200 px-2 py-1 rounded-md uppercase">Today</span>
                </motion.div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                   <Clock size={40} className="mb-4 text-neutral-400" />
                   <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest leading-loose">No activity logged.<br/>Mark topics in Syllabus.</p>
                </div>
              )}
            </div>
            <div className="p-5 bg-neutral-50 border-t border-app-border text-center">
              <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Export Report</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
