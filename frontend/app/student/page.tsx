'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/student/Sidebar';
import { Dashboard } from '@/components/student/Dashboard';
import { Syllabus } from '@/components/student/Syllabus';
import { StudyPlan } from '@/components/student/StudyPlan';
import { AskAI } from '@/components/student/AskAI';
import { syllabus, type Semester } from '@/models/syllabus';
import { storage } from '@/lib/storage';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  rollNumber: string;
  class: {
    _id: string;
    name: string;
    semester: number;
    department: string;
  } | null;
}

const TITLES: Record<string, { title: string; sub: string; hue: string }> = {
  dashboard:    { title: 'Overview',   sub: 'Your risk status and recent progress at a glance.', hue: 'bg-blue-600' },
  syllabus:     { title: 'Syllabus Explorer',    sub: 'Browse topics, mark them done, and identify high-yield areas.', hue: 'bg-amber-500' },
  'study-plan': { title: 'AI Study Plan',  sub: 'Let Gemini AI build a day-by-day plan based on what\'s left.', hue: 'bg-emerald-600' },
  'ask-ai':     { title: 'Ask Gemini',      sub: 'Have a conversation with AI about specific BCA topics.', hue: 'bg-indigo-600' },
};

export default function StudentPage() {
  const [tab, setTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const sem: Semester = profile?.semester
    ? syllabus.find((item) => item.id === `sem${profile.semester}`) ?? syllabus[0]
    : syllabus[0];

  const done = storage.getCompletedTopics().length;
  const total = sem.subjects.flatMap(s => s.units.flatMap(u => u.topics)).length;
  const progress = Math.round((done / total) * 100);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/student/profile', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          return;
        }

        if (data.profile) {
          setProfile(data.profile as StudentProfile);
        }
      } catch {
        // Keep dashboard usable with fallback content when profile request fails.
      }
    }

    void loadProfile();
  }, []);

  const page = TITLES[tab] ?? TITLES.dashboard;

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center animate-pulse text-app-muted uppercase tracking-[0.2em] font-bold">Loading Workspace...</div>;
    if (error || !sem) return <div className="p-10 text-center text-rose-500 font-bold uppercase tracking-[0.2em]">Error loading workspace</div>;

    switch (tab) {
      case 'dashboard':   return <Dashboard profile={profile} sem={sem} />;
      case 'syllabus':    return <Syllabus activeSemesterId={sem.id} />;
      case 'study-plan':  return <StudyPlan />;
      case 'ask-ai':      return <AskAI />;
      default:            return <Dashboard profile={profile} sem={sem} />;
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
        semesterName={profile ? `Semester ${profile.semester}` : sem.name}
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
            
            <div className="shrink-0 rounded-xl border border-app-border bg-white px-3 py-2 text-right shadow-sm">
              <p className="text-[11px] font-bold text-neutral-900">{profile?.name ?? 'Student'}</p>
              <p className="text-[10px] font-medium text-app-muted">
                {profile?.rollNumber ? `Roll: ${profile.rollNumber}` : 'Roll number not set'}
              </p>
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

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}
