'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudyPlan, StudyPlanItem } from '@/lib/gemini';
import { syllabus } from '@/models/syllabus';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Calendar, Target, TrendingUp, PartyPopper, Clock, CheckCircle2, FlaskConical } from 'lucide-react';

export const StudyPlan = () => {
  const [loading, setLoading] = useState(false);
  const [pace, setPace] = useState('moderate');
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);

  const generate = async () => {
    setLoading(true);
    const completed = storage.getCompletedTopics();
    const todo = syllabus[0].subjects.flatMap(s => 
      s.units.flatMap(u => 
        u.topics.filter(t => !completed.includes(t.id)).map(t => ({ ...t, subject: s.name }))
      )
    );
    const result = await generateStudyPlan(todo, pace);
    setPlan(result);
    setLoading(false);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Configuration Hub */}
      <div className="p-8 rounded-[1.5rem] bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border border-indigo-100 shadow-premium flex flex-col items-center text-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] -ml-24 -mb-24 pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
          <Sparkles size={28} />
        </div>
        
        <div className="max-w-md">
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 mb-2">Build your AI Roadmap</h2>
          <p className="text-[13px] font-medium text-app-muted leading-relaxed">
            Gemini will generate a topic-by-topic schedule optimized for your pace and high-yield content.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mt-2 group">
          <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em] ml-2">Study Intensity</span>
            <Select value={pace} onValueChange={setPace}>
              <SelectTrigger className="w-full sm:w-44 h-11 bg-white border-app-border rounded-xl font-bold text-sm shadow-sm hover:border-indigo-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-app-border shadow-md">
                <SelectItem value="light" className="font-bold py-2.5">Light Pace</SelectItem>
                <SelectItem value="moderate" className="font-bold py-2.5">Moderate</SelectItem>
                <SelectItem value="intensive" className="font-bold py-2.5 text-orange-600">Intensive Burn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={generate}
            disabled={loading}
            className="w-full sm:w-auto h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all active:scale-95 flex items-center gap-3 mt-5 sm:mt-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>BUILDING...</span>
              </>
            ) : (
              <>
                <TrendingUp size={18} />
                <span>GENERATE MASTERPLAN</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* The Roadmap */}
      <AnimatePresence mode="wait">
        {plan.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 px-2">
              <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-[0.2em]">Personal Roadmap</h3>
              <div className="flex-1 h-px bg-app-border/60" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plan.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-6 rounded-2xl bg-white border border-app-border shadow-sm hover:shadow-md transition-all flex flex-col relative group h-full cursor-pointer overflow-hidden"
                >
                   {/* Background Number Accent */}
                   <span className="absolute -right-2 top-0 text-[120px] font-bold opacity-5 text-neutral-400 select-none group-hover:scale-110 group-hover:opacity-10 transition-all pointer-events-none">
                     {i+1}
                   </span>
                   
                   <div className="flex items-start justify-between mb-4 relative z-10">
                     <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">
                       Day {item.day}
                     </span>
                     <FlaskConical size={18} className="text-neutral-300 group-hover:text-indigo-400 transition-colors" />
                   </div>

                   <div className="flex-1 relative z-10">
                     <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em] mb-1">{item.subject}</p>
                     <p className="text-base font-bold text-neutral-800 leading-snug group-hover:text-indigo-600 transition-colors">{item.topic}</p>
                   </div>

                   <div className="mt-6 flex items-center gap-2 relative z-10 pt-4 border-t border-dotted border-app-border">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                     <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">{item.estimatedTime}</p>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* Achievement Footer */}
            <div className="p-8 rounded-[1.5rem] bg-emerald-50 border border-emerald-100/50 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm text-emerald-600 mb-1">
                <PartyPopper size={20} />
              </div>
              <p className="text-sm font-black text-emerald-900">Finish topics to update your plan.</p>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest opacity-80">STAY CONSISTENT, STAY AHEAD</p>
            </div>
          </motion.div>
        ) : !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 select-none pointer-events-none">
            <Calendar size={64} strokeWidth={1} className="mb-4" />
            <p className="text-sm font-bold max-w-xs">Enter your exam date in Settings to see exact day counts.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
