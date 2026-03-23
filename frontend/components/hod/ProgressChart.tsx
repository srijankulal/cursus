'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const data = [
  { day: 'Day 1', completion: 12 },
  { day: 'Day 5', completion: 18 },
  { day: 'Day 10', completion: 28 },
  { day: 'Day 15', completion: 35 },
  { day: 'Day 20', completion: 48 },
  { day: 'Day 25', completion: 52 },
  { day: 'Day 30', completion: 61 },
];

export const ProgressChart = () => {
  return (
    <Card className="h-full w-full p-10 bg-white border border-base-border rounded-[3rem] shadow-xl space-y-8 flex flex-col group overflow-hidden">
      <CardHeader className="p-0 space-y-1">
        <div className="flex items-center space-x-3 text-accent-green-dark bg-accent-green/30 w-fit px-4 py-1.5 rounded-full border border-accent-green-mid/20 mb-2">
           <Calendar size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Growth Analytics</span>
        </div>
        <CardTitle className="text-3xl font-black tracking-tighter">Class Progress Over Time</CardTitle>
        <p className="text-sm text-base-muted font-bold">Historical data tracking how the batch is progressing towards exams.</p>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 900, fill: '#0a0a0a' }} />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ borderRadius: '2rem', border: '1px solid #f0f0f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="completion" 
              stroke="#4a9e6e" 
              strokeWidth={8} 
              dot={{ r: 10, fill: '#4a9e6e', strokeWidth: 0 }}
              activeDot={{ r: 12, strokeWidth: 4, stroke: '#ffffff', fill: '#1a4a31' }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
