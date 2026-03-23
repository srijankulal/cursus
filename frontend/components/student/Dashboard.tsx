'use client';

import { motion } from 'framer-motion';
import { calculateRisk, RiskStatus } from '@/lib/riskCalculator';
import { syllabus, EXAM_DATE_DEFAULT } from '@/data/syllabus';
import { storage } from '@/lib/storage';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export const Dashboard = () => {
  const [status, setStatus] = useState<RiskStatus | null>(null);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  
  const currentSemester = syllabus[0];

  useEffect(() => {
    const completedIds = storage.getCompletedTopics();
    const allTopics = currentSemester.subjects.flatMap(s => s.units.flatMap(u => u.topics));
    const totalTopics = allTopics.length;
    const completedTopicsCount = completedIds.length;
    const examDate = storage.getExamDate() || EXAM_DATE_DEFAULT;
    
    const riskStatus = calculateRisk(totalTopics, completedTopicsCount, examDate);
    setStatus(riskStatus);

    const last5Ids = [...completedIds].reverse().slice(0, 5);
    const last5 = last5Ids.map(id => allTopics.find(t => t.id === id)?.name || id);
    setRecentTopics(last5);
  }, []);

  if (!status) return null;

  const riskColors = {
    green: { bg: 'bg-accent-green/40', text: 'text-accent-green-dark', border: 'border-accent-green-mid/20' },
    yellow: { bg: 'bg-accent-blue/40', text: 'text-accent-blue-dark', border: 'border-accent-blue-mid/20' },
    red: { bg: 'bg-accent-red/40', text: 'text-accent-red-dark', border: 'border-accent-red-mid/20' },
  };

  const highYieldTotal = currentSemester.subjects.flatMap(s => s.units.flatMap(u => u.topics.filter(t => t.isHighYield))).length;
  const highYieldCompleted = currentSemester.subjects.flatMap(s => s.units.flatMap(u => u.topics.filter(t => t.isHighYield && storage.getCompletedTopics().includes(t.id)))).length;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className={`${riskColors[status.riskLevel].bg} ${riskColors[status.riskLevel].text} ${riskColors[status.riskLevel].border} border-2 shadow-sm rounded-[2rem]`}>
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-70">Current Risk Level</p>
                  <h2 className="text-4xl font-extrabold tracking-tight">
                    {status.riskLevel === 'yellow' ? 'Warning' : status.riskLevel.toUpperCase()}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold">{status.daysLeft}</p>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Days Left</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                <div>
                  <p className="text-2xl font-bold">{status.requiredPace}</p>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-tighter">Daily Target</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{status.percentageComplete}%</p>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-tighter">Completion</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{status.currentPace}</p>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-tighter">Your Pace</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{status.totalTopics - status.completedTopics}</p>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-tighter">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
          <Card className="rounded-[2rem] shadow-sm border-base-border">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <p className="text-3xl font-extrabold">{highYieldTotal - highYieldCompleted}</p>
              <p className="text-[10px] font-bold text-base-muted uppercase tracking-widest">High Yield Left</p>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] shadow-sm border-base-border">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <p className="text-3xl font-extrabold">{status.completedTopics}</p>
              <p className="text-[10px] font-bold text-base-muted uppercase tracking-widest">Total Done</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Topics', value: status.totalTopics },
              { label: 'Completed', value: status.completedTopics },
              { label: 'Remaining', value: status.totalTopics - status.completedTopics },
              { label: 'High Yield Rem.', value: highYieldTotal - highYieldCompleted },
            ].map((stat, i) => (
              <Card key={i} className="rounded-2xl border-base-border/50 bg-base-surface/50 shadow-none">
                <CardContent className="p-5">
                  <p className="text-[10px] text-base-muted font-bold mb-1 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-extrabold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight">Recent Activity</h3>
          <Card className="rounded-[2rem] border-base-border shadow-sm overflow-hidden">
            {recentTopics.length > 0 ? (
              <div className="divide-y divide-base-border">
                {recentTopics.map((topic, i) => (
                  <div key={i} className="p-4 flex items-center space-x-4 hover:bg-base-surface transition-colors cursor-default">
                    <div className="w-8 h-8 bg-accent-green/30 rounded-xl flex items-center justify-center text-accent-green-dark">
                       <CheckCircle2 size={16} />
                    </div>
                    <span className="font-semibold text-sm text-base-text">{topic}</span>
                    <span className="ml-auto text-[10px] font-bold text-base-muted uppercase">Done</span>
                  </div>
                ))}
              </div>
            ) : (
              <CardContent className="p-10 text-center text-base-muted italic text-sm">
                No activity yet. Start marking topics!
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
