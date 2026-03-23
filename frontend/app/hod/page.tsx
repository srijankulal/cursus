'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { StatsRow } from '@/components/hod/StatsRow';
import { SubjectChart } from '@/components/hod/SubjectChart';
import { AtRiskTable } from '@/components/hod/AtRiskTable';
import { ProgressChart } from '@/components/hod/ProgressChart';
import { ChevronDown, Download, Filter, Search } from 'lucide-react';
import Link from 'next/link';

export default function HODPage() {
  const [selectedBatch, setSelectedBatch] = useState('BCA 2023');

  return (
    <div className="min-h-screen bg-base-surface/50 p-10 selection:bg-accent-green/50 selection:text-accent-green-dark">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mt-5">
          <div className="flex flex-col space-y-2">
             <div className="flex items-center space-x-3 mb-1">
               <Link href="/" className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">C</Link>
               <span className="text-xl font-extrabold tracking-tight">Cursus <span className="text-base-muted ml-2 font-medium">— HOD Dashboard</span></span>
             </div>
             <h1 className="text-4xl font-extrabold tracking-tight flex items-center">
               Academic Performance
               <span className="ml-4 px-3 py-1 bg-white border border-base-border rounded-full text-xs font-bold tracking-widest uppercase">Live View</span>
             </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <select 
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="pl-4 pr-10 py-3 bg-white border border-base-border rounded-2xl focus:outline-none focus:ring-1 focus:ring-accent-green-mid appearance-none font-bold text-sm cursor-pointer shadow-sm hover:border-accent-green-mid transition-all"
              >
                <option value="BCA 2023">BCA 2023</option>
                <option value="BCA 2024">BCA 2024</option>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-muted group-hover:text-base-text transition-colors" />
            </div>
            
            <button className="p-3 bg-white border border-base-border rounded-2xl hover:bg-base-surface transition-all shadow-sm">
               <Download size={20} className="text-base-muted" />
            </button>
            <button className="p-3 bg-white border border-base-border rounded-2xl hover:bg-base-surface transition-all shadow-sm">
               <Filter size={20} className="text-base-muted" />
            </button>
          </div>
        </header>

        <StatsRow 
          totalStudents={64}
          avgCompletion={58}
          atRisk={12}
          onTrack={34}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <SubjectChart />
           <ProgressChart />
        </div>

        <AtRiskTable />
        
        <footer className="pt-10 pb-6 text-center">
           <p className="text-sm text-base-muted font-medium">Cursus HOD Dashboard &copy; 2026. All analytics are mock data for demonstration purposes.</p>
        </footer>
      </div>
    </div>
  );
}
