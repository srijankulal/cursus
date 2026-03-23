'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LayoutDashboard, BookOpen, Users, ClipboardCheck, Settings, Bell, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const tabs = [
  { id: 'dashboard', label: 'My Subjects', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'students', label: 'Student Progress', icon: Users },
];

export default function StaffPage() {
  const [tab, setTab] = useState('dashboard');
  const [subject, setSubject] = useState('Data Structures');

  return (
    <div className="flex h-screen bg-app-bg text-app-text overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 flex flex-col h-full shrink-0 shadow-2xl relative z-20">
        <div className="h-[72px] flex items-center px-6 border-b border-white/5 gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
             <span className="text-indigo-900 text-sm font-bold">S</span>
          </div>
          <motion.span className="font-bold text-sm text-white tracking-tight uppercase">
            STAFF PORTAL
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
                    : 'text-indigo-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <t.icon size={18} className={cn('shrink-0 transition-transform duration-300', isActive ? 'text-indigo-400' : 'group-hover:scale-110')} />
                <span className="text-xs font-bold tracking-widest uppercase">{t.label}</span>
                {isActive && (
                  <motion.div layoutId="staff-hover" className="absolute right-3 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-indigo-300 hover:text-white gap-3 rounded-xl px-4 py-6">
              <ArrowLeft size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Exit</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 m-4 sm:m-6 bg-white rounded-[2.5rem] border border-app-border shadow-premium overflow-hidden flex flex-col">
          
          <header className="px-8 py-6 border-b border-app-border shrink-0 flex items-center justify-between bg-white relative z-10">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 capitalize">{tab} Management</h1>
              <p className="text-[13px] text-app-muted mt-1">Teaching Plan & Coverage for Sem 3 Subjects.</p>
            </div>

            <div className="flex items-center gap-4">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-48 h-10 border-slate-200 bg-slate-50 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="Data Structures" className="font-bold text-[11px] uppercase py-2.5">Data Structures</SelectItem>
                  <SelectItem value="Computer Networks" className="font-bold text-[11px] uppercase py-2.5">Computer Networks</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 border border-slate-100 bg-slate-50/50 relative">
                <Bell size={18} className="text-slate-400" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
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
                  {tab === 'dashboard' && (
                    <div className="space-y-8">
                       {/* Stats Bar */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {[
                           { label: 'Syllabus Coverage', v: '68%', icon: BookOpen, col: 'text-indigo-600', bg: 'bg-indigo-50' },
                           { label: 'Active Students', v: '64', icon: Users, col: 'text-blue-600', bg: 'bg-blue-50' },
                           { label: 'Classes Taken', v: '24', icon: Calendar, col: 'text-emerald-600', bg: 'bg-emerald-50' },
                         ].map((s, i) => (
                           <div key={i} className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm flex items-center gap-6">
                             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", s.bg)}>
                               <s.icon size={20} className={s.col} />
                             </div>
                             <div>
                               <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{s.v}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Coverage List */}
                       <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-premium">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Detailed Coverage Index</h3>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">Update Log</button>
                         </div>
                         <div className="space-y-4">
                           {[
                             { unit: 'Unit 1: Stacks & Queues', topics: 8, done: 8, status: 'Completed' },
                             { unit: 'Unit 2: Linked Lists', topics: 10, done: 10, status: 'Completed' },
                             { unit: 'Unit 3: Trees & Graphs', topics: 12, done: 5, status: 'In Progress' },
                             { unit: 'Unit 4: Searching & Sorting', topics: 6, done: 0, status: 'Pending' },
                           ].map((u, i) => (
                             <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 hover:border-slate-200 transition-all bg-slate-50/30 group">
                               <div className="flex items-center gap-4">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", u.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : u.status === 'In Progress' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400')}>
                                    {u.done}/{u.topics}
                                  </div>
                                  <span className="font-bold text-slate-800">{u.unit}</span>
                               </div>
                               <div className="flex items-center gap-6">
                                 <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                                   <div className={cn("h-full", u.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500')} style={{ width: `${(u.done/u.topics)*100}%` }} />
                                 </div>
                                 <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md", u.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : u.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400')}>
                                   {u.status}
                                 </span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  )}

                  {tab === 'attendance' && (
                    <div className="p-20 text-center space-y-6 rounded-[2rem] border-2 border-dashed border-indigo-100 bg-indigo-50/20">
                       <ClipboardCheck size={64} className="mx-auto text-indigo-200" />
                       <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-slate-800">Class Attendance</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Daily attendance logs for {subject}. Integrated with the Student Tracker USN database.</p>
                       </div>
                    </div>
                  )}

                  {tab === 'students' && (
                    <div className="p-20 text-center space-y-6 rounded-[2rem] border-2 border-dashed border-indigo-100 bg-indigo-50/20">
                       <Users size={64} className="mx-auto text-indigo-200" />
                       <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-slate-800">Student Progress View</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">See how many students have marked specific units as done and identify high-yield confusion points.</p>
                       </div>
                    </div>
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
