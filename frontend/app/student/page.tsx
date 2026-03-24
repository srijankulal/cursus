'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/student/Sidebar';
import { Dashboard } from '@/components/student/Dashboard';
import { Syllabus } from '@/components/student/Syllabus';
import { StudyPlan } from '@/components/student/StudyPlan';
import { AskAI } from '@/components/student/AskAI';
import { syllabus, type Semester } from '@/models/syllabus';
import { ResourceViewer } from '@/components/student/ResourceViewer';
import { storage } from '@/lib/storage';

const TITLES: Record<string, { title: string; sub: string; hue: string }> = {
  dashboard:    { title: 'Overview',   sub: 'Your risk status and recent progress at a glance.', hue: 'bg-blue-600' },
  syllabus:     { title: 'Syllabus Explorer',    sub: 'Browse topics, mark them done, and identify high-yield areas.', hue: 'bg-amber-500' },
  'study-plan': { title: 'AI Study Plan',  sub: 'Let Gemini AI build a day-by-day plan based on what\'s left.', hue: 'bg-emerald-600' },
  resources:    { title: 'Study Materials',  sub: 'Download notes and past question papers uploaded by faculty.', hue: 'bg-cyan-500' },
  'ask-ai':     { title: 'Ask Gemini',      sub: 'Have a conversation with AI about specific BCA topics.', hue: 'bg-indigo-600' },
};

export default function StudentPage() {
  const [tab, setTab] = useState('dashboard');
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sem = syllabus[0];

  useEffect(() => {
    const done = storage.getCompletedTopics().length;
    const total = sem.subjects.flatMap(s => s.units.flatMap(u => u.topics)).length;
    setProgress(Math.round((done / total) * 100));
  }, [tab]);

  const page = TITLES[tab] ?? TITLES.dashboard;

  const renderContent = () => {
    switch (tab) {
      case 'dashboard':   return <Dashboard />;
      case 'syllabus':    return <Syllabus activeSemesterId={sem.id} />;
      case 'study-plan':  return <StudyPlan />;
      case 'resources':   return <ResourceViewer semester={profile?.semester || 1} />;
      case 'ask-ai':      return <AskAI />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-text overflow-hidden relative">
      <Sidebar
        activeTab={tab}
        setActiveTab={(t) => {
          setTab(t);
          setIsMobileMenuOpen(false);
        }}
        semesterName={sem.name}
        progress={progress}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 overflow-y-auto flex flex-col bg-app-bg">
        {/* Workspace Card Container */}
        <div className="flex-1 flex flex-col m-3 sm:m-6 bg-app-surface rounded-[1.25rem] border border-app-border shadow-premium overflow-hidden">
          
          {/* Header Area */}
          <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-app-border shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-5 h-0.5 bg-current mb-1" />
                <div className="w-5 h-0.5 bg-current mb-1" />
                <div className="w-5 h-0.5 bg-current" />
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 sm:gap-5 min-w-0"
                >
                  <div className={cn('w-1 h-8 sm:w-1.5 sm:h-10 rounded-full shrink-0', page.hue)} />
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 truncate">{page.title}</h1>
                    <p className="hidden sm:block text-[13px] text-app-muted mt-0.5 line-clamp-1">{page.sub}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="flex -space-x-2 shrink-0">
               {[1, 2].map(i => (
                 <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                   {i}
                 </div>
               ))}
               <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-neutral-900 flex items-center justify-center text-[10px] font-bold text-white">
                 +
               </div>
            </div>
          </header>

          {/* Dynamic Content Panel */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-10">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
