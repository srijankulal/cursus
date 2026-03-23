'use client';

import { motion } from 'framer-motion';
import { Users, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsRowProps {
  totalStudents: number;
  avgCompletion: number;
  atRisk: number;
  onTrack: number;
}

export const StatsRow = ({ totalStudents, avgCompletion, atRisk, onTrack }: StatsRowProps) => {
  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-base-surface text-base-text border-base-border/50' },
    { label: 'Avg. Completion', value: `${avgCompletion}%`, icon: TrendingUp, color: 'bg-accent-blue/40 text-accent-blue-dark border-accent-blue-mid/20' },
    { label: 'Students At Risk', value: atRisk, icon: AlertCircle, color: 'bg-accent-red/40 text-accent-red-dark border-accent-red-mid/20' },
    { label: 'Students On Track', value: onTrack, icon: CheckCircle2, color: 'bg-accent-green/40 text-accent-green-dark border-accent-green-mid/20' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, i) => (
        <motion.div
           key={i}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: i * 0.1, type: 'spring' }}
        >
          <Card className={`p-8 rounded-[2.5rem] border shadow-sm border-base-border flex flex-col space-y-6 hover:shadow-xl transition-all hover:-translate-y-1 bg-white overflow-hidden group`}>
            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-all transform group-hover:rotate-6 ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <CardContent className="p-0">
              <p className="text-4xl font-black tracking-tighter text-base-text">{stat.value}</p>
              <p className="text-[10px] font-extrabold text-base-muted uppercase tracking-[0.15em] mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
