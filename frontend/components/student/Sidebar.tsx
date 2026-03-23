'use client';

import { motion } from 'framer-motion';
import { Home, BookOpen, Calendar, MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  semesterName: string;
  progress: number;
}

export const Sidebar = ({ activeTab, setActiveTab, semesterName, progress }: SidebarProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'study-plan', label: 'Study Plan', icon: Calendar },
    { id: 'ask-ai', label: 'Ask AI', icon: MessageSquare },
  ];

  return (
    <aside className="w-80 border-r border-base-border h-screen bg-white flex flex-col p-10 sticky top-0 overflow-y-auto shadow-[20px_0_40px_rgba(0,0,0,0.02)] z-50">
      <div className="flex items-center space-x-4 mb-16">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl shadow-lg transform -rotate-6">C</div>
        <span className="text-2xl font-black tracking-tighter">Cursus</span>
      </div>

      <nav className="flex-1 space-y-3">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full justify-start items-center space-x-4 h-14 rounded-2xl transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-base-surface text-base-text font-black shadow-inner translate-x-1'
                : 'text-base-muted hover:bg-base-surface/50 hover:text-base-text hover:translate-x-1'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white' : 'bg-transparent'}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-accent-blue-mid' : ''} />
            </div>
            <span className="text-sm">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="active-nav-indicator" className="ml-auto w-1.5 h-6 bg-accent-blue-mid rounded-full" />
            )}
          </Button>
        ))}
      </nav>

      <div className="mt-auto pt-10 border-t border-base-border space-y-8">
        <div className="bg-base-surface/40 p-5 rounded-2xl border border-base-border/50">
          <p className="text-[10px] font-black text-base-muted uppercase tracking-[0.2em] mb-2">Curriculum</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-base-text">{semesterName}</p>
            <div className="w-2 h-2 rounded-full bg-accent-green-mid animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-base-muted uppercase tracking-widest">Mastery</span>
            <span className="text-xs font-black text-accent-green-dark">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5 bg-base-surface rounded-full overflow-hidden" />
        </div>
      </div>
    </aside>
  );
};
