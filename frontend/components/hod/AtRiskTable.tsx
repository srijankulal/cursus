'use client';

import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, AlertTriangle, TrendingDown, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const atRiskStudents = [
  { id: '1', name: 'Sheru K.', roll: 'BCA202301', progress: 42, risk: 'High', trend: 'down', missed: 3 },
  { id: '2', name: 'Amish K.', roll: 'BCA202312', progress: 45, risk: 'Medium', trend: 'stable', missed: 2 },
  { id: '3', name: 'Ziyan M.', roll: 'BCA202345', progress: 38, risk: 'High', trend: 'down', missed: 5 },
  { id: '4', name: 'Sagar S.', roll: 'BCA202364', progress: 51, risk: 'Medium', trend: 'up', missed: 1 },
];

export const AtRiskTable = () => (
  <div className="rounded-3xl border border-slate-200 bg-white shadow-premium overflow-hidden flex flex-col min-h-[400px]">
    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm border border-orange-200/50">
           <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight">Student Success Alerts</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Risk Analysis</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search USN..." 
            className="h-9 w-44 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest border border-blue-100 px-4 h-9 rounded-xl bg-blue-50/50 shadow-sm transition-all active:scale-95">Export PDF</button>
      </div>
    </div>

    <div className="flex-1 overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/10">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-8 h-12">Student Profile</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-8 h-12 text-center">Status</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-8 h-12">Content Coverage</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-8 h-12 text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {atRiskStudents.map((s, i) => (
            <motion.tr 
              key={s.id} 
              initial={{ opacity: 0, x: -8 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.05 }}
              className="group hover:bg-slate-50/80 transition-all border-b border-slate-50 cursor-default"
            >
              <TableCell className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner group-hover:scale-110 transition-transform">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 leading-tight">{s.name}</span>
                    <span className="text-[11px] font-bold text-slate-400 tracking-tighter uppercase">{s.roll}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-8 py-5 text-center">
                <Badge variant={s.risk === 'High' ? 'destructive' : 'default'} className={cn(
                  'rounded-lg text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 shadow-sm',
                  s.risk === 'Medium' ? 'bg-orange-500 hover:bg-orange-600' : ''
                )}>
                  {s.risk} RISK
                </Badge>
                <div className="flex items-center justify-center gap-1.5 mt-2 opacity-50">
                  <Clock size={11} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{s.missed} WEEKS DELAY</span>
                </div>
              </TableCell>
              <TableCell className="px-8 py-5 min-w-[200px]">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest leading-none">
                    <span className="text-slate-400">Mastery Level</span>
                    <span className="text-blue-600">{s.progress}%</span>
                  </div>
                  <Progress value={s.progress} className="h-1.5 bg-slate-100 rounded-full" />
                </div>
              </TableCell>
              <TableCell className="px-8 py-5 text-right">
                <div className="flex flex-col items-end gap-1">
                  {s.trend === 'down' && <TrendingDown size={18} className="text-rose-600 bg-rose-50 p-1 rounded-md" />}
                  {s.trend === 'up' && <TrendingDown size={18} className="text-emerald-600 bg-emerald-50 p-1 rounded-md rotate-180" />}
                  {s.trend === 'stable' && <TrendingDown size={18} className="text-blue-500 bg-blue-50 p-1 rounded-md rotate-90" />}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{s.trend} profile</span>
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
    <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
       <button className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">Load Detailed Registry (302 Students Remaining)</button>
    </div>
  </div>
);
