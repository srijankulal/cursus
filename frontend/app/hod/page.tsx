'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsRow } from '@/components/hod/StatsRow';
import { SubjectChart } from '@/components/hod/SubjectChart';
import { AtRiskTable } from '@/components/hod/AtRiskTable';
import { ProgressChart } from '@/components/hod/ProgressChart';
import { ClassManagement } from '@/components/hod/ClassManagement';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LayoutDashboard, Users, GraduationCap, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes', icon: GraduationCap },  
  { id: 'students', label: 'Student Directory', icon: Users },
  { id: 'subjects', label: 'Syllabus Coverage', icon: BarChart3 },
];

export default function HODPage() {
  const [tab, setTab] = useState('overview');
  const [batch, setBatch] = useState('BCA 2023');

  return (
    <div className="flex h-screen bg-app-bg text-app-text overflow-hidden font-sans">
      {/* Sidebar - Matching student style but distinct color */}
      <aside className="w-64 bg-slate-900 flex flex-col h-full shrink-0 shadow-2xl relative z-20">
        <div className="h-[72px] flex items-center px-6 border-b border-white/5 gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
             <span className="text-slate-900 text-sm font-bold">H</span>
          </div>
          <motion.span className="font-bold text-sm text-white tracking-tight uppercase">
            HOD PORTAL
          </motion.span>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center px-4 h-12 rounded-xl transition-all duration-300 gap-4 group relative',
                  isActive 
                    ? 'bg-white/10 text-white shadow-inner border border-white/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <t.icon size={18} className={cn('shrink-0 transition-transform duration-300', isActive ? 'text-blue-400' : 'group-hover:scale-110')} />
                <span className="text-xs font-bold tracking-widest uppercase">{t.label}</span>
                {isActive && (
                  <motion.div layoutId="hover" className="absolute right-3 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white gap-3 rounded-xl px-4 py-6">
              <ArrowLeft size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Modern floating workspace container */}
        <div className="flex-1 m-4 sm:m-6 bg-white rounded-3xl border border-app-border shadow-premium overflow-hidden flex flex-col">
          
          <header className="px-8 py-6 border-b border-app-border shrink-0 flex items-center justify-between bg-white relative z-10">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 capitalize">{tab} Dashboard</h1>
              <p className="text-[13px] text-app-muted mt-1">HOD Overview for {batch} academic batch.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2 mr-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {i}
                  </div>
                ))}
              </div>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="w-32 h-10 border-slate-200 bg-slate-50 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="BCA 2023" className="font-bold text-[11px] uppercase py-2.5">BCA 2023</SelectItem>
                  <SelectItem value="BCA 2024" className="font-bold text-[11px] uppercase py-2.5">BCA 2024</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 border border-slate-100 bg-slate-50/50">
                <Settings size={18} className="text-slate-400" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20">
            <div className="max-w-6xl mx-auto space-y-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab === 'overview' && (
                    <div className="space-y-10">
                      <StatsRow totalStudents={64} avgCompletion={58} atRisk={12} onTrack={34} />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-premium">
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Subject Progress</h3>
                           <SubjectChart />
                        </div>
                        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-premium">
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Batch Velocity</h3>
                           <ProgressChart />
                        </div>
                      </div>

                      <AtRiskTable />
                    </div>
                  )}

                  {tab === 'students' && (
                    <div className="p-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                       <Users size={64} className="mx-auto text-slate-300 stroke-[1.5]" />
                       <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-slate-800">Student Management</h3>
                        <p className="text-sm text-slate-400 mt-2 font-medium">This section will contain detailed reports, individual progress files, and risk alerts for {batch}.</p>
                       </div>
                    </div>
                  )}

                  {tab === 'subjects' && (
                    <div className="p-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                       <BarChart3 size={64} className="mx-auto text-slate-300 stroke-[1.5]" />
                       <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-slate-800">Syllabus Expansion</h3>
                        <p className="text-sm text-slate-400 mt-2 font-medium">Review subject-wise coverage bottlenecks and faculty feedback for current semester units.</p>
                       </div>
                    </div>
                  )}

                  {tab === 'classes' && (
                      <ClassManagement />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
