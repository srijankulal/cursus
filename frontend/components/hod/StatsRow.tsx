'use client';

import { motion } from 'framer-motion';
import { Users, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsRowProps {
  totalStudents: number;
  avgCompletion: number;
  atRisk: number;
  onTrack: number;
}

const stats = (p: StatsRowProps) => [
  { label: 'Total Students',    value: p.totalStudents,     icon: Users,         cls: 'bg-slate-100 text-slate-500',  accent: 'bg-slate-500' },
  { label: 'Avg Completion',    value: `${p.avgCompletion}%`, icon: TrendingUp,  cls: 'bg-blue-50 text-blue-600',    accent: 'bg-blue-600' },
  { label: 'At Risk',           value: p.atRisk,             icon: AlertCircle,  cls: 'bg-rose-50 text-rose-600',    accent: 'bg-rose-600' },
  { label: 'On Track',          value: p.onTrack,            icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600', accent: 'bg-emerald-600' },
];

export const StatsRow = (props: StatsRowProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {stats(props).map((s, i) => (
      <motion.div 
        key={i} 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: i * 0.1, duration: 0.4 }}
        className="p-6 rounded-3xl border border-slate-200 bg-white shadow-premium hover:shadow-card-hover transition-all hover:-translate-y-1 relative overflow-hidden group"
      >
        <div className={cn("absolute -right-4 -top-4 w-20 h-20 opacity-5 group-hover:scale-125 transition-transform rounded-full", s.accent)} />
        
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-black/5 shrink-0', s.cls)}>
          <s.icon size={18} />
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight text-slate-900 leading-none">{s.value}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
        </div>
      </motion.div>
    ))}
  </div>
);
