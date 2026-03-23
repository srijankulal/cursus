'use client';

import { motion } from 'framer-motion';
import { mockStudents, Student } from '@/models/mockStudents';
import { MoreVertical, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const AtRiskTable = () => {
  const riskStyles = {
    green: { bg: 'bg-accent-green/40', text: 'text-accent-green-dark', border: 'border-accent-green-mid/20' },
    yellow: { bg: 'bg-accent-blue/40', text: 'text-accent-blue-dark', border: 'border-accent-blue-mid/20' },
    red: { bg: 'bg-accent-red/40', text: 'text-accent-red-dark', border: 'border-accent-red-mid/20' },
  };

  return (
    <Card className="rounded-[3rem] border-base-border shadow-xl bg-white overflow-hidden p-10 space-y-10">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-3xl font-black tracking-tight flex items-center">
            Student Performance Registry
            <div className="ml-4 w-10 h-10 bg-base-surface rounded-2xl flex items-center justify-center text-base-muted border border-base-border">
              <AlertCircle size={20} />
            </div>
          </h3>
          <p className="text-sm font-bold text-base-muted">Real-time analysis of syllabus coverage and academic risk levels.</p>
        </div>
        <Button variant="outline" className="rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-12 border-base-border hover:bg-base-surface transition-all">
          <span>View Archive</span>
          <ChevronRight size={18} className="ml-2" />
        </Button>
      </div>

      <div className="rounded-[2rem] border border-base-border overflow-hidden">
        <Table className="bg-white">
          <TableHeader className="bg-base-surface/50">
            <TableRow className="border-b border-base-border group">
              <TableHead className="py-6 px-10 text-[11px] font-black uppercase tracking-[0.15em] text-base-muted">Student</TableHead>
              <TableHead className="py-6 text-center text-[11px] font-black uppercase tracking-[0.15em] text-base-muted">Coverage</TableHead>
              <TableHead className="py-6 text-center text-[11px] font-black uppercase tracking-[0.15em] text-base-muted">Risk Status</TableHead>
              <TableHead className="py-6 text-center text-[11px] font-black uppercase tracking-[0.15em] text-base-muted">Days Left</TableHead>
              <TableHead className="py-6 text-[11px] font-black uppercase tracking-[0.15em] text-base-muted">Behind Subjects</TableHead>
              <TableHead className="py-6 px-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-base-border">
            {mockStudents.map((student, i) => (
              <TableRow key={student.id} className="group hover:bg-base-surface transition-colors data-[state=selected]:bg-transparent border-b border-base-border">
                <TableCell className="py-8 px-10 font-black text-base text-base-text">{student.name}</TableCell>
                <TableCell className="py-8 text-center min-w-[150px]">
                   <div className="flex flex-col items-center space-y-2">
                     <span className="font-extrabold text-sm">{student.completion}%</span>
                     <Progress value={student.completion} className={`h-2 shadow-inner ${student.riskLevel === 'red' ? 'bg-accent-red/20' : student.riskLevel === 'yellow' ? 'bg-accent-blue/20' : 'bg-accent-green/20'}`} />
                   </div>
                </TableCell>
                <TableCell className="py-8 text-center">
                  <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${riskStyles[student.riskLevel].bg} ${riskStyles[student.riskLevel].text} border ${riskStyles[student.riskLevel].border} shadow-sm`}>
                    {student.riskLevel}
                  </span>
                </TableCell>
                <TableCell className="py-8 text-center font-black text-base-muted text-sm">{student.daysLeft}d</TableCell>
                <TableCell className="py-8">
                   <div className="flex flex-wrap gap-2 max-w-xs">
                     {student.subjectsBehind.length > 0 ? student.subjectsBehind.map((s, j) => (
                       <span key={j} className="px-3 py-1.5 rounded-xl border border-base-border bg-white text-[9px] font-bold text-base-muted uppercase tracking-tight">{s}</span>
                     )) : (
                       <div className="flex items-center space-x-2 text-accent-green-dark">
                         <CheckCircle2 size={14} className="animate-pulse" />
                         <span className="text-[10px] font-bold uppercase">Optimal Pace</span>
                       </div>
                     )}
                   </div>
                </TableCell>
                <TableCell className="py-8 px-10 text-right">
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white border-transparent hover:border-base-border group-hover:shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={20} className="text-base-muted" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
