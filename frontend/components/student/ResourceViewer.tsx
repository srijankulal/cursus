'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Resource {
  _id: string;
  subject: string;
  type: 'note' | 'question_paper';
  url: string;
  semester: number;
  department: string;
  createdAt: string;
}

export function ResourceViewer({ semester }: { semester: number }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'note' | 'question_paper'>('all');

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        // FORCE fetching Semester 6 for testing purposes so your MongoDB doc shows up
        const targetSemester = 6; 
        
        const response = await fetch(`/api/resources?semester=${targetSemester}`, {
          cache: 'no-store'
        });
        const data = await response.json();
        
        if (data.success && data.resources) {
          setResources(data.resources);
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources(); 
  }, [semester]);

  const filteredResources = resources.filter(res => 
    activeFilter === 'all' || res.type === activeFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Study Materials</h2>
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Semester 6 
        </span>
      </div>

      {/* Filter Tabs - Now always visible */}
      {!loading && (
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-max">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Materials
          </button>
          <button
            onClick={() => setActiveFilter('note')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === 'note' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveFilter('question_paper')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === 'question_paper' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Question Papers
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-sm">
          Loading Resources...
        </div>
      ) : resources.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">No resources found</h3>
          <p className="text-slate-500 text-sm mt-1">Faculty have not uploaded any materials yet.</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">No matches found</h3>
          <p className="text-slate-500 text-sm mt-1">No {activeFilter === 'note' ? 'notes' : 'question papers'} found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => {
            const isNote = res.type === 'note';
            
            return (
              <Card key={res._id} className="hover:shadow-md transition-shadow border-slate-200 cursor-pointer">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isNote ? 'bg-indigo-50' : 'bg-amber-50'}`}>
                    <FileText className={isNote ? 'text-indigo-500' : 'text-amber-500'} size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className={isNote 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[9px] tracking-wider" 
                        : "bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] tracking-wider"}>
                        {isNote ? 'Notes' : 'Question Paper'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 truncate text-base leading-tight">
                      {res.subject}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Sem {res.semester} • {res.department}
                    </p>
                  </div>
                  
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0"
                  >
                    <Download size={18} />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}