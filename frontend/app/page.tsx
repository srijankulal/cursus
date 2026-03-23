'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Briefcase, Zap, Brain, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-base-text flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent-blue),white_70%)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-blue/10 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-green/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-4xl w-full text-center space-y-16"
      >
        <div className="space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="w-14 h-14 bg-black text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-black/10 transform -rotate-12 transition-transform hover:rotate-0">C</div>
            <span className="text-4xl font-black tracking-tighter">Cursus</span>
            <div className="px-3 py-1 bg-accent-blue/40 text-accent-blue-dark text-[10px] font-black uppercase tracking-widest rounded-full border border-accent-blue-mid/20">Beta</div>
          </motion.div>
          
          <h1 className="text-7xl font-black tracking-tighter leading-[0.95] text-balance">
            Track your <span className="text-accent-blue-mid">Syllabus.</span><br />
            Master with <span className="text-accent-green-mid">AI.</span>
          </h1>
          <p className="text-xl text-base-muted font-bold max-w-2xl mx-auto leading-relaxed">
            The next-generation BCA syllabus tracker and study planner powered by Claude Sonnet. Personalized, high-yield, and performance-driven.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 px-4">
          <Link href="/student" className="group">
            <Card className="rounded-[3rem] border border-base-border shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white p-10 h-full flex flex-col items-center justify-center space-y-8 overflow-hidden relative group">
              <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-accent-blue/30 rounded-[2rem] flex items-center justify-center text-accent-blue-dark shadow-inner transform group-hover:scale-110 transition-transform">
                <GraduationCap size={40} />
              </div>
              <div className="text-center relative">
                <h3 className="text-2xl font-black tracking-tight mb-2">Student Portal</h3>
                <p className="text-sm text-base-muted font-bold tracking-tight">Track syllabus, check risk levels & AI study plans.</p>
              </div>
              <Button className="h-14 px-12 bg-black text-white rounded-2xl font-black text-base group-hover:bg-accent-blue-mid transition-all shadow-xl shadow-black/10 active:scale-95">
                Sign In
              </Button>
            </Card>
          </Link>

          <Link href="/hod" className="group">
            <Card className="rounded-[3rem] border border-base-border shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white p-10 h-full flex flex-col items-center justify-center space-y-8 overflow-hidden relative group">
              <div className="absolute inset-0 bg-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-accent-green/30 rounded-[2rem] flex items-center justify-center text-accent-green-dark shadow-inner transform group-hover:scale-110 transition-transform">
                <Briefcase size={40} />
              </div>
              <div className="text-center relative">
                <h3 className="text-2xl font-black tracking-tight mb-2">HOD Dashboard</h3>
                <p className="text-sm text-base-muted font-bold tracking-tight">Class-wide analytics, risk reports & performance charts.</p>
              </div>
              <Button variant="outline" className="h-14 px-12 bg-white text-base-text border-base-border rounded-2xl font-black text-base group-hover:border-accent-green-mid transition-all shadow-md active:scale-95">
                Go to Dashboard
              </Button>
            </Card>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-10 pt-10"
        >
          {[
            { icon: Zap, label: 'Real-time Sync' },
            { icon: Brain, label: 'Claude AI AI' },
            { icon: TrendingUp, label: 'Risk Analysis' }
          ].map((feature, i) => (
            <div key={i} className="flex items-center space-x-3 text-base-muted">
              <feature.icon size={20} className="text-black" />
              <span className="text-xs font-black uppercase tracking-widest">{feature.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
