'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/student/Sidebar';
import { Dashboard } from '@/components/student/Dashboard';
import { Syllabus } from '@/components/student/Syllabus';
import { StudyPlan } from '@/components/student/StudyPlan';
import { AskAI } from '@/components/student/AskAI';
import { syllabus } from '@/data/syllabus';
import { storage } from '@/lib/storage';

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [progress, setProgress] = useState(0);

  const currentSemester = syllabus[0];

  useEffect(() => {
    const completed = storage.getCompletedTopics();
    const total = currentSemester.subjects.flatMap(s => s.units.flatMap(u => u.topics)).length;
    setProgress(Math.round((completed.length / total) * 100));
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'syllabus': return <Syllabus activeSemesterId={currentSemester.id} />;
      case 'study-plan': return <StudyPlan />;
      case 'ask-ai': return <AskAI />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-base-bg flex selection:bg-accent-blue/50 selection:text-accent-blue-dark">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        semesterName={currentSemester.name}
        progress={progress}
      />
      
      <main className="flex-1 p-10 mt-5 max-w-7xl mx-auto overflow-y-auto h-screen bg-white">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, x: 10 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.2 }}
           className="w-full h-full"
        >
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-base-muted font-medium mt-1">
              Welcome back to Cursus. {activeTab === 'dashboard' ? 'Here is your current focus.' : `Explore your ${activeTab.replace('-', ' ')}.`}
            </p>
          </header>

          <div className="pb-10">
            {renderContent()}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
