'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 28 },
  { name: 'Mar', value: 35 },
  { name: 'Apr', value: 58 },
  { name: 'May', value: 72 },
  { name: 'Jun', value: 89 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name} Progress</p>
        <p className="text-xl font-bold text-blue-400">{payload[0].value}% <span className="text-xs font-normal opacity-40 text-white">done</span></p>
      </div>
    );
  }
  return null;
};

export const ProgressChart = () => (
  <div className="h-[300px] w-full mt-4">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b', transform: 'translate(0, 5)' }}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#3b82f6" 
          strokeWidth={4}
          fill="url(#colorPv)"
          strokeLinecap="round"
          animationDuration={2000}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
