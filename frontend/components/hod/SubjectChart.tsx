'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'DS', completion: 45, full: 100, color: '#3b82f6' },
  { name: 'OS', completion: 32, full: 100, color: '#f59e0b' },
  { name: 'DBMS', completion: 68, full: 100, color: '#10b981' },
  { name: 'MATH', completion: 25, full: 100, color: '#ef4444' },
  { name: 'JAVA', completion: 55, full: 100, color: '#6366f1' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name} Completion</p>
        <p className="text-xl font-bold text-slate-900">{payload[0].value}% <span className="text-xs font-normal opacity-40">done</span></p>
      </div>
    );
  }
  return null;
};

export const SubjectChart = () => (
  <div className="h-[300px] w-full mt-4">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
      <BarChart data={data} margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b', transform: 'translate(0, 5)' }}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', rx: 12, ry: 12 }} />
        <Bar 
          dataKey="completion" 
          radius={[10, 10, 10, 10]} 
          barSize={40}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
