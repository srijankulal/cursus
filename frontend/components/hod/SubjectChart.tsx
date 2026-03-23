'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const data = [
  { name: 'DS', completion: 65, color: '#4a7fcb' },
  { name: 'OS', completion: 42, color: '#c94a4a' },
  { name: 'DBMS', completion: 58, color: '#4a7fcb' },
  { name: 'Java', completion: 82, color: '#4a9e6e' },
  { name: 'SE', completion: 74, color: '#4a9e6e' },
  { name: 'CN', completion: 35, color: '#c94a4a' },
];

export const SubjectChart = () => {
  return (
    <Card className="h-full w-full p-10 bg-white border border-base-border rounded-[3rem] shadow-xl space-y-8 flex flex-col group overflow-hidden">
      <CardHeader className="p-0 space-y-1">
        <div className="flex items-center space-x-3 text-accent-blue-dark bg-accent-blue/30 w-fit px-4 py-1.5 rounded-full border border-accent-blue-mid/20 mb-2">
           <TrendingUp size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Analysis View</span>
        </div>
        <CardTitle className="text-3xl font-black tracking-tighter">Subject Completion Avg.</CardTitle>
        <p className="text-sm text-base-muted font-bold">Comprehensive overview of progress levels across core subjects.</p>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 900, fill: '#0a0a0a' }} />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: '#f9f9f9' }} 
              contentStyle={{ borderRadius: '2rem', border: '1px solid #f0f0f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '12px' }}
            />
            <Bar dataKey="completion" radius={[12, 12, 0, 0]} barSize={48}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="opacity-80 hover:opacity-100 transition-opacity" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
