'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { syllabus, Topic } from '@/models/syllabus';
import { storage } from '@/lib/storage';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Target, Zap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Syllabus = ({ activeSemesterId }: { activeSemesterId: string }) => {
  const [completed, setCompleted] = useState<string[]>([]);
  const [openSubject, setOpenSubject] = useState<string | null>(syllabus[0].id);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const sem = syllabus.find(s => s.id === activeSemesterId) ?? syllabus[0];

  useEffect(() => { setCompleted(storage.getCompletedTopics()); }, []);

  const toggle = (id: string) => setCompleted(storage.toggleTopicCompletion(id));

  const pct = (topics: Topic[]) =>
    topics.length === 0 ? 0 : Math.round((topics.filter(t => completed.includes(t.id)).length / topics.length) * 100);

  return (
    <div className="space-y-6 pb-60">
      {sem.subjects.map((subject, idx) => {
        const subTopics = subject.units.flatMap(u => u.topics);
        const progress = pct(subTopics);
        const isOpen = openSubject === subject.id;
        const colorHues = [
          'from-blue-500 to-indigo-600',
          'from-amber-400 to-orange-500',
          'from-emerald-500 to-emerald-600',
          'from-blue-600 to-blue-700',
          'from-indigo-600 to-indigo-700'
        ];
        const hue = colorHues[idx % colorHues.length];

        return (
          <div 
            key={subject.id} 
            className="border border-slate-200 rounded-2xl sm:rounded-[2rem] bg-white shadow-premium overflow-visible transition-all duration-300"
          >
            {/* Subject Trigger */}
            <button 
              onClick={() => setOpenSubject(isOpen ? null : subject.id)}
              className="w-full flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-6 hover:bg-slate-50/50 transition-colors text-left rounded-2xl sm:rounded-[2rem] group"
            >
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/20 bg-gradient-to-br group-hover:scale-110 transition-transform duration-300', hue)}>
                  <BookOpen size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight leading-tight truncate">{subject.name}</h3>
                  <div className="flex items-center gap-3 mt-1 opacity-60">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      {subject.units.length} Units · {subTopics.length} topics
                    </span>
                  </div>
                </div>
                <ChevronDown size={18} className={cn('sm:hidden text-slate-300 transition-transform duration-300', isOpen ? 'rotate-180 text-slate-600' : '')} />
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl sm:rounded-2xl shrink-0">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Mastery</span>
                  <span className={cn("text-xs font-bold", progress === 100 ? 'text-emerald-600' : 'text-blue-600')}>{progress}%</span>
                </div>
                <Progress value={progress} className="w-24 sm:w-16 h-1.5 sm:h-2 bg-slate-200" />
                <ChevronDown size={18} className={cn('hidden sm:block text-slate-300 transition-transform duration-300', isOpen ? 'rotate-180 text-slate-600' : '')} />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-visible"
                >
                  <div className="px-6 pb-8 pt-2 space-y-4 bg-slate-50/30 rounded-b-[2rem] border-t border-slate-100">
                    {subject.units.map(unit => {
                      const unitPct = pct(unit.topics);
                      const isUnitOpen = openUnit === unit.id;

                      return (
                        <div key={unit.id} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-visible">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenUnit(isUnitOpen ? null : unit.id); }}
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-sm group rounded-2xl"
                          >
                            <Target size={17} className={cn('transition-colors duration-300', isUnitOpen ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500')} />
                            <span className="flex-1 text-left font-bold text-slate-800 tracking-tight">{unit.name}</span>
                            <div className="flex items-center gap-3 shrink-0 mr-1">
                              <span className={cn("text-[10px] font-bold w-10 text-right uppercase tracking-tighter", unitPct === 100 ? 'text-emerald-600' : 'text-slate-400')}>
                                {unitPct}%
                              </span>
                              <Progress value={unitPct} className="w-16 h-1.5 bg-slate-100" />
                              <ChevronDown size={14} className={cn('text-slate-400 transition-transform duration-300', isUnitOpen ? 'rotate-180 text-blue-500' : '')} />
                            </div>
                          </button>

                          <AnimatePresence>
                            {isUnitOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-visible"
                              >
                                <div className="divide-y divide-slate-100 border-t border-slate-100 mx-2 mb-2">
                                  {unit.topics.map(topic => (
                                    <div
                                      key={topic.id}
                                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group rounded-xl"
                                    >
                                      <div className="relative h-5 w-5 shrink-0 flex items-center justify-center">
                                        <Checkbox
                                          id={topic.id}
                                          checked={completed.includes(topic.id)}
                                          onCheckedChange={() => toggle(topic.id)}
                                          className="h-5 w-5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all active:scale-95 shadow-sm"
                                        />
                                      </div>
                                      <label
                                        htmlFor={topic.id}
                                        className={cn(
                                          'flex-1 text-[13px] cursor-pointer select-none transition-all duration-300',
                                          completed.includes(topic.id) ? 'line-through text-slate-400' : 'text-slate-700 font-semibold'
                                        )}
                                      >
                                        {topic.name}
                                      </label>
                                      
                                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        {topic.isHighYield && (
                                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-50 border border-orange-100/50">
                                            <Zap size={11} className="text-orange-500 fill-orange-500" />
                                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Yield</span>
                                          </div>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-3 text-[11px] font-bold text-blue-600 bg-white border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg gap-2 transition-all shadow-sm active:scale-95"
                                        >
                                          <Sparkles size={13} strokeWidth={2.5} />
                                          ASK
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
