'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Save, Loader2, BookOpen, AlertCircle, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Unit {
  unit_number: number;
  title: string;
  content?: string;
  topics?: string[];
}

interface Subject {
  subject_code?: string;
  subject_name: string;
  units: Unit[];
  semester?: number;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export const SyllabusManager = () => {
  const [selectedSemester, setSelectedSemester] = useState<number | null>(6);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [currentSyllabus, setCurrentSyllabus] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedSemester === 6) {
      fetchSubjects(6);
    } else {
      setSubjects([]);
      setSelectedSubject(null);
      setCurrentSyllabus([]);
    }
  }, [selectedSemester]);

  async function fetchSubjects(sem: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/syllabus?semester=${sem}`);
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects", err);
      // fallback silent fail
    } finally {
      setLoading(false);
    }
  }

  const handleSubjectChange = (subjectName: string) => {
    setSelectedSubject(subjectName);
    const sub = subjects.find(s => s.subject_name === subjectName);
    if (sub) {
      setCurrentSyllabus(JSON.parse(JSON.stringify(sub.units)));
    }
  };

  const handleUnitChange = (index: number, value: string) => {
    const updated = [...currentSyllabus];
    updated[index].topics = value.split('\n').filter(t => t.trim() !== '');
    delete updated[index].content;
    setCurrentSyllabus(updated);
  };

  async function handleSave() {
    if (!selectedSubject) return;
    
    const subjectData = subjects.find(s => s.subject_name === selectedSubject);
    if (!subjectData) return;

    setSaving(true);
    try {
      const res = await fetch('/api/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subjectData,
          units: currentSyllabus,
        }),
      });
      if (res.ok) {
        setSubjects(prev => prev.map(s => 
          s.subject_name === selectedSubject ? { ...s, units: [...currentSyllabus] } : s
        ));
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error("Failed to save changes", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10 pb-20">
      
      {/* Header section integrated smoothly */}
      <section className="space-y-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <FileEdit className="text-blue-600" size={24} />
          Syllabus Management
        </h2>
        <p className="text-slate-500 font-medium text-sm">Configure and manage your department&apos;s curriculum directly from the dashboard.</p>
      </section>

      {/* Semester Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {SEMESTERS.map(sem => (
          <button
            key={sem}
            disabled={sem !== 6}
            onClick={() => setSelectedSemester(sem)}
            className={cn(
              "p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 relative group overflow-hidden shadow-sm",
              selectedSemester === sem ? "bg-blue-600 border-blue-600 text-white shadow-xl scale-105" : 
              sem === 6 ? "bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg text-slate-800" :
              "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed grayscale"
            )}
          >
            <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedSemester === sem ? "text-blue-100" : "text-slate-400")}>Sem</span>
            <span className="text-2xl font-black leading-none">{sem}</span>
            {sem === 6 && !selectedSemester && (
              <div className="absolute inset-0 bg-blue-500/5 transition-opacity opacity-0 group-hover:opacity-100" />
            )}
          </button>
        ))}
      </div>

      {/* Subject and Editor Area */}
      <AnimatePresence mode="wait">
        {selectedSemester === 6 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
                <div>
                   <h3 className="font-bold text-slate-800 leading-tight">Subject Selection</h3>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select a course to edit</p>
                </div>
              </div>

              <Select value={selectedSubject || ''} onValueChange={handleSubjectChange}>
                <SelectTrigger className="w-full sm:w-72 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm shadow-sm ring-0 focus:ring-2 focus:ring-blue-500/20 text-slate-700">
                  <SelectValue placeholder="Choose a subject..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  {subjects.map(s => (
                    <SelectItem key={s.subject_name} value={s.subject_name} className="py-3 px-4 font-bold text-sm">
                      {s.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubject && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-2">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                      Curriculum Editor
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[10px] uppercase font-black tracking-widest text-blue-600 border border-blue-100/50">Live Sync</span>
                   </h2>
                   <Button 
                     onClick={handleSave} 
                     disabled={saving}
                     className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl gap-2 px-6 shadow-lg shadow-black/10 active:scale-95 transition-all"
                   >
                     {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                     {saving ? 'Saving...' : 'Save Syllabus'}
                   </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentSyllabus.map((unit, idx) => (
                    <Card key={idx} className="p-6 border-slate-200 rounded-3xl shadow-premium bg-white group hover:border-slate-300 transition-colors relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="flex items-center gap-3 mb-4 relative z-10">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           U{unit.unit_number || idx + 1}
                         </div>
                         <input
                           type="text"
                           className="bg-transparent border-none font-bold text-slate-800 text-base focus:outline-none focus:ring-0 p-0 w-full placeholder:text-slate-300"
                           value={unit.title}
                           placeholder="Unit Title"
                           onChange={(e) => {
                             const updated = [...currentSyllabus];
                             updated[idx].title = e.target.value;
                             setCurrentSyllabus(updated);
                           }}
                         />
                      </div>
                      <textarea
                        className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all resize-none relative z-10 placeholder:text-slate-300"
                        value={unit.topics ? unit.topics.join('\n') : (unit.content ? unit.content.split('.').map(t=>t.trim()).filter(Boolean).join('\n') : '')}
                        onChange={(e) => handleUnitChange(idx, e.target.value)}
                        placeholder="List topic names (one per line)..."
                      />
                    </Card>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-amber-900/60 leading-relaxed uppercase tracking-wider">
                    Important: Listing each topic on a new line will automatically map topics to the student dashboard and AI study plan generators.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
