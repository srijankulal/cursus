'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Unit {
  unit_number?: number;
  title: string;
  content?: string;
  topics?: string[];
}

interface ClassSyllabusEditorProps {
  units: any;
  onSave: (syllabus: any) => Promise<void>;
  isSaving: boolean;
  className?: string;
}

export const ClassSyllabusEditor = ({
  units,
  onSave,
  isSaving,
  className,
}: ClassSyllabusEditorProps) => {
  const [currentSyllabus, setCurrentSyllabus] = useState<Unit[]>([]);

  useEffect(() => {
    if (units) {
      if (Array.isArray(units)) {
        setCurrentSyllabus(units);
      } else if (units.units) {
        setCurrentSyllabus(units.units);
      } else {
        setCurrentSyllabus([]);
      }
    }
  }, [units]);

  const handleUnitTitleChange = (index: number, value: string) => {
    const updated = [...currentSyllabus];
    updated[index].title = value;
    setCurrentSyllabus(updated);
  };

  const handleUnitTopicsChange = (index: number, value: string) => {
    const updated = [...currentSyllabus];
    updated[index].topics = value.split('\n').filter(t => t.trim() !== '');
    delete updated[index].content;
    setCurrentSyllabus(updated);
  };

  const handleSave = async () => {
    await onSave(currentSyllabus);
  };

  if (!units || currentSyllabus.length === 0) {
    return (
      <div className={cn("text-center py-12 bg-slate-50 rounded-lg border border-slate-200", className)}>
        <BookOpen className="mx-auto text-slate-400 mb-4" size={40} />
        <p className="text-slate-500 font-medium">No syllabus content available. Please select a class first.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Save Button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
          Curriculum Editor
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[10px] uppercase font-bold tracking-widest text-blue-600 border border-blue-100">
            Per Class
          </span>
        </h3>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg gap-2 px-4 transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Syllabus'}
        </Button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentSyllabus.map((unit, idx) => (
          <Card
            key={idx}
            className="p-6 border-slate-200 rounded-xl shadow-sm bg-white group hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                U{unit.unit_number || idx + 1}
              </div>
              <input
                type="text"
                className="bg-transparent border-none font-bold text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-blue-50 p-1 rounded w-full placeholder:text-slate-300"
                value={unit.title}
                placeholder="Unit Title"
                onChange={(e) => handleUnitTitleChange(idx, e.target.value)}
              />
            </div>
            <textarea
              className="w-full h-32 p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none placeholder:text-slate-300"
              value={unit.topics ? unit.topics.join('\n') : (unit.content ? unit.content.split('.').map(t => t.trim()).filter(Boolean).join('\n') : '')}
              onChange={(e) => handleUnitTopicsChange(idx, e.target.value)}
              placeholder="List topics (one per line)..."
            />
          </Card>
        ))}
      </div>

      {/* Info Alert */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-amber-900 leading-relaxed">
          Changes made here affect only <strong>this class</strong>. Other classes retain their own syllabus.
        </p>
      </div>
    </div>
  );
};