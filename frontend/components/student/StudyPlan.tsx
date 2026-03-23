'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '@/lib/storage';
import { syllabus, EXAM_DATE_DEFAULT } from '@/data/syllabus';
import { generateStudyPlan } from '@/lib/claude';
import { Calendar, Brain, Clock, Zap, RefreshCw, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const StudyPlan = () => {
  const [examDate, setExamDate] = useState<string>('');
  const [plan, setPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pace, setPace] = useState('Steady');

  useEffect(() => {
    const savedDate = storage.getExamDate() || EXAM_DATE_DEFAULT;
    setExamDate(savedDate.toISOString().split('T')[0]);
    
    const savedPlan = storage.getStudyPlan();
    if (savedPlan) setPlan(savedPlan);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    const completedIds = storage.getCompletedTopics();
    const allTopics = syllabus[0].subjects.flatMap(s => s.units.flatMap(u => u.topics));
    const remaining = allTopics.filter(t => !completedIds.includes(t.id)).map(t => t.name);
    
    const generatedPlan = await generateStudyPlan(remaining, new Date(examDate), pace);
    setPlan(generatedPlan);
    storage.setStudyPlan(generatedPlan);
    setLoading(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setExamDate(e.target.value);
    storage.setExamDate(newDate);
  };

  return (
    <div className="space-y-10">
      <Card className="rounded-[2rem] border-base-border shadow-sm p-8 bg-white overflow-hidden">
        <CardContent className="p-0 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">AI Study Planner</h2>
            <p className="text-sm text-base-muted font-medium">Personalize your journey. Tell Claude when you're taking the exam and how hard you want to study.</p>
            
            <div className="flex flex-wrap gap-8 items-end pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-base-muted">Exam Date</label>
                <div className="relative group">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-base-muted group-hover:text-base-text transition-colors" />
                  <input 
                    type="date" 
                    value={examDate}
                    onChange={handleDateChange}
                    className="pl-12 pr-6 py-3 bg-base-surface border border-base-border rounded-2xl focus:outline-none focus:ring-1 focus:ring-accent-blue-mid text-sm font-bold shadow-sm cursor-pointer hover:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-base-muted">Intensity Level</label>
                <Select value={pace} onValueChange={setPace}>
                  <SelectTrigger className="w-40 py-6 px-6 bg-base-surface border-base-border rounded-2xl font-bold text-sm shadow-sm hover:bg-white transition-all">
                    <SelectValue placeholder="Pace" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-base-border/50 shadow-xl p-2">
                    <SelectItem value="Light" className="rounded-xl font-bold py-3">Light</SelectItem>
                    <SelectItem value="Steady" className="rounded-xl font-bold py-3">Steady</SelectItem>
                    <SelectItem value="Intense" className="rounded-xl font-bold py-3">Intense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                 onClick={handleGenerate}
                 disabled={loading}
                 className="h-[52px] px-10 bg-black text-white hover:bg-accent-blue-mid rounded-2xl font-bold text-sm shadow-lg shadow-black/10 flex items-center space-x-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Brain size={20} />}
                <span>{plan.length > 0 ? 'Regenerate Plan' : 'Generate Plan'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {plan.map((day, i) => (
            <motion.div
               key={i}
               initial={{ opacity: 0, y: 30, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ delay: i * 0.08, type: 'spring', damping: 20 }}
               className="h-full"
            >
              <Card className="rounded-[2.5rem] border-base-border shadow-md hover:shadow-xl hover:-translate-y-2 transition-all p-8 bg-white flex flex-col h-full overflow-hidden group">
                <div className="flex justify-between items-start mb-8">
                  <div>
                     <p className="text-[10px] font-extrabold text-accent-blue-dark bg-accent-blue/40 px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-widest">
                       Day {i + 1}
                     </p>
                     <h3 className="text-xl font-extrabold tracking-tight">
                       {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                     </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-base-muted font-bold text-xs bg-base-surface px-4 py-2 rounded-2xl border border-base-border/50 group-hover:bg-accent-blue group-hover:text-accent-blue-dark transition-colors">
                    <Clock size={14} />
                    <span>{day.time}m</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {day.topics.map((topic: string, j: number) => {
                     const isHY = syllabus[0].subjects.flatMap(s => s.units.flatMap(u => u.topics)).find(t => t.name === topic)?.isHighYield;
                     return (
                      <div key={j} className={`p-4 rounded-3xl flex items-center space-x-4 transition-all ${isHY ? 'bg-accent-blue/20 border border-accent-blue-mid/20' : 'bg-base-surface/50 border border-base-border'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isHY ? 'bg-accent-blue-dark shadow-[0_0_10px_rgba(30,58,95,0.4)]' : 'bg-base-muted'}`} />
                        <span className="text-xs font-bold flex-1 truncate">{topic}</span>
                        {isHY && <Star size={14} className="text-accent-blue-dark fill-accent-blue-dark" />}
                      </div>
                     );
                  })}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {plan.length === 0 && !loading && (
        <Card className="p-32 text-center space-y-6 border-dashed border-2 border-base-border bg-base-surface/20 rounded-[3rem]">
          <div className="w-20 h-20 bg-white border border-base-border rounded-full flex items-center justify-center mx-auto text-base-muted shadow-sm">
            <Zap size={40} className="text-accent-blue-mid" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold tracking-tight">Your AI Roadmap is Ready</h3>
            <p className="text-base-muted max-w-sm mx-auto font-medium">Tell Claude your exam goals and get a personalized day-by-day study schedule instantly.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
