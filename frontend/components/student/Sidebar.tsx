'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Calendar, MessageSquare, PanelLeftClose, PanelLeftOpen, GraduationCap, Sparkles,FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';  
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  semesterName: string;
  progress: number;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (v: boolean) => void;
}

const tabs = [
  { id: 'dashboard',  label: 'Dashboard',  icon: Home,       hue: 'hover:text-blue-500 hover:bg-blue-50/50', active: 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg' },
  { id: 'syllabus',   label: 'Syllabus',    icon: BookOpen,   hue: 'hover:text-amber-500 hover:bg-amber-50/50',  active: 'bg-amber-500 text-white shadow-amber-500/20 shadow-lg' },
  { id: 'study-plan', label: 'Study Plan',  icon: Calendar,   hue: 'hover:text-emerald-500 hover:bg-emerald-50/50', active: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg' },
  { id: 'resources',  label: 'Resources',   icon: FileText,   hue: 'hover:text-cyan-500 hover:bg-cyan-50/50', active: 'bg-cyan-600 text-white shadow-cyan-500/20 shadow-lg' },
  { id: 'ask-ai',     label: 'Ask AI',      icon: MessageSquare, hue: 'hover:text-indigo-500 hover:bg-indigo-50/50', active: 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg' },
];

export const Sidebar = ({
  activeTab, setActiveTab, semesterName, progress, collapsed, setCollapsed, isMobileOpen, setIsMobileOpen
}: SidebarProps) => (
  <>
    {/* Mobile Overlay */}
    <AnimatePresence>
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileOpen?.(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
    </AnimatePresence>

    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? 72 : 248,
        x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -248 : 0)
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className={cn(
        "fixed lg:relative flex flex-col h-screen bg-slate-50 border-r border-slate-200 overflow-visible z-50 transition-transform",
        !isMobileOpen && "max-lg:-translate-x-full"
      )}
      style={{ boxShadow: '12px 0 32px -16px rgba(0,0,0,0.08)' }}
    >
      {/* Sidebar Container */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className={cn(
          'flex items-center h-18 border-b border-slate-200 shrink-0 px-4 transition-all',
          collapsed ? 'justify-center' : 'gap-4'
        )}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
              title="Expand Cursus"
            >
              <span className="text-white text-sm font-black leading-none uppercase">C</span>
            </button>
          ) : (
            <>
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 transition-transform active:scale-95 cursor-pointer">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-white text-sm font-black leading-none uppercase">C</span>
              </Link>
              </div>
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-black text-sm text-slate-900 tracking-tighter flex-1 whitespace-nowrap overflow-hidden pr-2 uppercase"
              >
                Cursus <span className="text-[10px] font-bold text-slate-400 opacity-70 ml-1">v1.2</span>
              </motion.span>
              <button
                onClick={() => setCollapsed(true)}
                className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all active:scale-90"
                title="Minimize Workspace"
              >
                <PanelLeftClose size={17} />
              </button>
              <button
                onClick={() => setIsMobileOpen?.(false)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400"
              >
                <PanelLeftClose size={17} />
              </button>
            </>
          )}
        </div>

      {/* Nav Items */}
      <nav className={cn('flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden transition-all', collapsed ? 'px-3' : 'px-4')}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group w-full flex items-center rounded-xl transition-all duration-300 h-11 relative',
                collapsed ? 'justify-center px-0' : 'px-4 gap-4',
                isActive
                  ? tab.active
                  : cn('text-slate-400 bg-transparent hover:font-bold', tab.hue)
              )}
            >
              <tab.icon size={19} className={cn('shrink-0 transition-transform duration-300', isActive ? 'text-white' : 'group-hover:scale-110')} />
              {!collapsed && (
                <span className="text-[13px] font-black tracking-widest whitespace-nowrap overflow-hidden uppercase">
                  {tab.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div layoutId="active-indicator" className="w-1 h-4 bg-white/40 rounded-full absolute right-3" />
              )}
              {collapsed && isActive && (
                 <div className="absolute inset-0 rounded-xl bg-slate-900/5 ring-2 ring-slate-200/50" />
              )}
            </button>
          );
        })}

        {/* Collapsed expand icon at bottom of nav */}
        {collapsed && (
          <div className="pt-4 border-t border-slate-200/60 mt-4 px-1">
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex justify-center items-center h-11 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-90 border border-transparent hover:border-slate-200 shadow-sm"
              title="Expand workspace"
            >
              <PanelLeftOpen size={17} />
            </button>
          </div>
        )}
      </nav>

      {/* Semester/Mastery Footer */}
      {!collapsed && (
        <div className="px-4 py-8 border-t border-slate-200/60 space-y-6 shrink-0 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-premium shadow-slate-200/20 group hover:border-indigo-200 transition-colors cursor-default">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
              <GraduationCap size={18} className="shrink-0" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 opacity-80">Workspace</p>
              <p className="text-sm font-black text-slate-900 truncate tracking-tight">{semesterName}</p>
            </div>
          </div>
          
          <div className="space-y-3 px-1">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80">Full Mastery</span>
                  <span className="text-xs font-black text-slate-900 mt-0.5 tracking-tighter">{semesterName}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm">{progress}%</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300/30">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 transition={{ duration: 1, ease: 'easeOut' }}
                 className="h-full bg-emerald-500 rounded-full shadow-lg"
               />
            </div>
          </div>
        </div>
      )}
    </div>
  </motion.aside>
  </>
);
