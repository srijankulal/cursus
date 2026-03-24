'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Unit {
  number?: number;
  unit_number?: number;
  title: string;
  hours?: number;
  topics: string[];
}

interface StaffSyllabusTrackerProps {
  units: Unit[];
  completedTopics: string[];
  onSave: (completedTopics: string[]) => Promise<void>;
  isSaving: boolean;
}

export const StaffSyllabusTracker = ({
  units,
  completedTopics,
  onSave,
  isSaving,
}: StaffSyllabusTrackerProps) => {
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([0]));
  const [checkedTopics, setCheckedTopics] = useState<Set<string>>(new Set(completedTopics));
  const [hasChanges, setHasChanges] = useState(false);

  const toggleUnit = (unitNumber: number | undefined) => {
    if (!unitNumber) return;
    const updated = new Set(expandedUnits);
    if (updated.has(unitNumber)) {
      updated.delete(unitNumber);
    } else {
      updated.add(unitNumber);
    }
    setExpandedUnits(updated);
  };

  const toggleTopic = (topic: string) => {
    const updated = new Set(checkedTopics);
    if (updated.has(topic)) {
      updated.delete(topic);
    } else {
      updated.add(topic);
    }
    setCheckedTopics(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(Array.from(checkedTopics));
    setHasChanges(false);
  };

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500 font-medium">No syllabus available for this class.</p>
      </div>
    );
  }

  // Line 70: Add a null check for u.topics
const totalTopics = units.reduce((sum, u) => sum + (u.topics?.length || 0), 0);
  const completedCount = checkedTopics.size;
  const progressPercent = Math.round((completedCount / totalTopics) * 100);

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Teaching Progress</h3>
          <p className="text-sm text-slate-600 mt-1">{completedCount} of {totalTopics} topics completed</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg gap-2 px-6 transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Progress'}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700">Progress</span>
          <span className="text-sm font-bold text-blue-600">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        {units.map((unit, idx) => {
          const unitNum = unit.unit_number ?? unit.number ?? (idx + 1);
          const isExpanded = expandedUnits.has(unitNum);
          const unitCompleted = unit.topics?.filter(t => checkedTopics.has(t)).length ?? 0;
          const unitPercent = unit.topics?.length ? Math.round((unitCompleted / unit.topics.length) * 100) : 0;

          return (
            <motion.div
              key={unitNum}
              layout
              className="border border-slate-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Unit Header */}
              <button
                onClick={() => toggleUnit(unitNum)}
                className="w-full px-5 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    U{unitNum}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {unit.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {unitCompleted}/{unit.topics?.length ?? 0} topics • {unit.hours}h • {unitPercent}%
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-slate-400 group-hover:text-slate-600"
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>

              {/* Topics List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-100 bg-slate-50"
                  >
                    <div className="p-4 space-y-3">
                      {unit.topics?.map((topic, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-3 cursor-pointer group/topic"
                        >
                          <Checkbox
                            checked={checkedTopics.has(topic)}
                            onCheckedChange={() => toggleTopic(topic)}
                            className="mt-1"
                          />
                          <span
                            className={cn(
                              'text-sm leading-relaxed transition-all',
                              checkedTopics.has(topic)
                                ? 'line-through text-slate-400'
                                : 'text-slate-700 group-hover/topic:text-slate-900'
                            )}
                          >
                            {topic}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Info Alert */}
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm">
        <p className="font-semibold text-blue-900">✓ Mark topics as you teach them</p>
        <p className="text-blue-700 text-xs mt-1">Your progress is saved per class and visible to students.</p>
      </div>
    </div>
  );
};
