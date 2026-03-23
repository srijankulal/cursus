'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Layers, Cpu, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-neutral-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-lg shadow-black/10">
            <span className="text-white text-sm font-bold tracking-tighter">C</span>
          </div>
          <span className="font-bold text-black text-lg tracking-tight">Cursus</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/student" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-black font-semibold tracking-tight transition-colors">Student</Button>
          </Link>
          <Link href="/hod">
            <Button size="sm" className="bg-black text-white hover:bg-neutral-800 rounded-xl px-5 h-9 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-black/5">
              HOD Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-40 pb-24 text-center max-w-5xl mx-auto w-full relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-50/40 via-transparent to-transparent -z-10 blur-3xl opacity-60" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white border border-neutral-200 rounded-full text-[11px] font-bold uppercase tracking-widest text-neutral-500 shadow-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Powered by Gemini AI
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-black leading-[0.9] sm:leading-[0.9]">
            Stay ahead of<br />
            <span className="text-neutral-300 transition-colors hover:text-neutral-400 cursor-default">your syllabus.</span>
          </h1>

          <p className="text-neutral-500 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto tracking-tight">
            Cursus tracks your BCA syllabus completion, flags what matters most,
            and uses Gemini AI to build your personalized study path.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 px-4">
            <Link href="/student">
              <Button className="h-14 px-10 bg-black text-white hover:bg-neutral-800 rounded-2xl font-bold gap-2 text-base transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-black/10">
                Launch Portal <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/staff">
              <Button variant="outline" className="h-14 px-10 rounded-2xl font-bold border-neutral-200 text-black hover:bg-white hover:border-black/20 bg-white/50 backdrop-blur-sm shadow-sm transition-all text-base">
                Staff Access
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-32 w-full"
        >
          {[
            { icon: Layers, title: 'Smart Tracker', desc: 'Real-time syllabus monitoring across all BCA units and subjects.', color: 'blue' },
            { icon: Cpu, title: 'AI Study Plan', desc: 'Gemini-powered dynamic schedules tailored to your learning pace.', color: 'violet' },
            { icon: BarChart3, title: 'Risk Insights', desc: 'Advanced analytics to identify potential bottlenecks before they occur.', color: 'amber' },
          ].map((f, i) => (
            <Card key={i} className="group relative overflow-hidden text-left p-8 border border-neutral-200/60 rounded-[2rem] shadow-none bg-white/80 backdrop-blur-sm hover:bg-white hover:border-neutral-300 hover:shadow-2xl hover:shadow-black/[0.03] transition-all duration-500">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${
                f.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                f.color === 'violet' ? 'bg-violet-50 text-violet-600' : 
                'bg-amber-50 text-amber-600'
              }`}>
                <f.icon size={22} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-base text-black mb-2 tracking-tight">{f.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed font-medium tracking-tight">{f.desc}</p>
            </Card>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-12 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 border-t border-neutral-100">
        &copy; 2024 Cursus Platform &bull; Built for BCA Excellence
      </footer>
    </div>
  );
}
