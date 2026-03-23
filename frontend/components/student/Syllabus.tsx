'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { syllabus, Subject, Unit, Topic } from '@/data/syllabus';
import { storage } from '@/lib/storage';
import { Star, MessageCircle, CheckCircle2 } from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export const Syllabus = ({ activeSemesterId }: { activeSemesterId: string }) => {
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  const currentSemester = syllabus.find(s => s.id === activeSemesterId) || syllabus[0];

  useEffect(() => {
    setCompletedTopics(storage.getCompletedTopics());
  }, []);

  const toggleTopic = (id: string, checked: boolean) => {
    const updated = storage.toggleTopicCompletion(id);
    setCompletedTopics(updated);
  };

  const getProgress = (items: Topic[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(t => completedTopics.includes(t.id)).length;
    return Math.round((completed / items.length) * 100);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 border border-base-border rounded-[2rem] shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">Syllabus Explorer</h2>
          <p className="text-sm text-base-muted font-medium">Track completion and study with AI and high-yield insights.</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-accent-blue-dark bg-accent-blue/40 px-2 py-0.5 rounded-full">Focused</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-accent-green-dark bg-accent-green/40 px-2 py-0.5 rounded-full">Mastered</span>
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-6">
        {currentSemester.subjects.map(subject => {
          const subjectTopics = subject.units.flatMap(u => u.topics);
          const progress = getProgress(subjectTopics);

          return (
            <AccordionItem 
              key={subject.id} 
              value={subject.id}
              className="bg-white border border-base-border rounded-[2rem] shadow-sm overflow-hidden hover:shadow-md transition-shadow px-6 no-underline"
            >
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center justify-between w-full pr-8">
                  <div className="flex flex-col items-start space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">{subject.name}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-bold text-base-muted uppercase tracking-wider">{subject.units.length} Units</span>
                      <span className="text-[10px] font-bold text-base-muted uppercase tracking-wider">{subjectTopics.length} Topics</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end space-y-1">
                       <Progress value={progress} className="w-32 h-2.5 bg-base-surface" />
                       <span className="text-xs font-bold text-accent-green-dark">{progress}% Complete</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <div className="space-y-4 pt-4 border-t border-base-border">
                  {subject.units.map(unit => {
                    const unitProgress = getProgress(unit.topics);

                    return (
                      <Accordion type="single" collapsible key={unit.id}>
                        <AccordionItem value={unit.id} className="border-none bg-base-surface/40 rounded-3xl overflow-hidden px-4">
                          <AccordionTrigger className="hover:no-underline py-5 pr-4">
                             <div className="flex items-center justify-between w-full">
                               <div className="flex flex-col items-start">
                                 <h4 className="font-bold text-base-text">{unit.name}</h4>
                                 <span className="text-xs text-base-muted">{unit.topics.length} topics</span>
                               </div>
                               <div className="flex items-center space-x-6">
                                 <Progress value={unitProgress} className="w-20 h-2 bg-white" />
                                 <span className="text-xs font-bold text-accent-green-dark w-10">{unitProgress}%</span>
                               </div>
                             </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-white rounded-2xl mx-1 mb-3 border border-base-border/50">
                            <div className="divide-y divide-base-border/30">
                              {unit.topics.map(topic => (
                                <div key={topic.id} className="flex items-center justify-between p-4 px-6 hover:bg-base-surface/30 group transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                                  <div className="flex items-center space-x-5">
                                    <Checkbox 
                                      id={topic.id}
                                      checked={completedTopics.includes(topic.id)}
                                      onCheckedChange={(checked) => toggleTopic(topic.id, !!checked)}
                                      className="w-6 h-6 rounded-lg data-[state=checked]:bg-accent-green-mid data-[state=checked]:border-accent-green-mid"
                                    />
                                    <div className="flex flex-col">
                                      <label 
                                        htmlFor={topic.id}
                                        className={`text-sm font-semibold transition-all cursor-pointer ${completedTopics.includes(topic.id) ? 'text-base-muted line-through opacity-60' : 'text-base-text'}`}
                                      >
                                        {topic.name}
                                      </label>
                                      {topic.isHighYield && (
                                        <div className="flex items-center mt-0.5 space-x-1">
                                          <Star size={10} className="text-accent-blue-dark fill-accent-blue-dark" />
                                          <span className="text-[9px] font-bold text-accent-blue-dark uppercase tracking-widest">High Yield</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest px-4 h-9 hover:bg-accent-blue-mid transition-all active:scale-95"
                                  >
                                    <MessageCircle size={14} className="mr-2" />
                                    Ask AI
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
