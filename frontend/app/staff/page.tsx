'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LayoutDashboard, BookOpen, Users, ClipboardCheck, Upload, Bell } from 'lucide-react';
import { UploadManager } from '@/components/hod/UploadManager';
import Link from 'next/link';



const tabs = [
  { id: 'dashboard',  label: 'My Classes',        icon: BookOpen       },
  { id: 'attendance', label: 'Attendance',        icon: ClipboardCheck },
  { id: 'students',   label: 'Student Progress',  icon: Users          },
  { id: 'uploads',    label: 'Upload Notes/Docs', icon: Upload         },
];

interface StaffClass {
  _id: string;
  name: string;
  semester: number;
  department: string;
  capacity: number;
  studentCount: number;
  canManageStudents: boolean;
  assignedSubjects: Array<{ subjectId: string; subjectName: string }>;
  students: Array<{ _id: string; rollNumber: string; semester: number }>;
  assignedSubjects: Array<{ subjectId: string; subjectName: string }>;
  students: Array<{ _id: string; rollNumber: string; semester: number }>;
}

interface StudentCandidate {
  _id: string;
  rollNumber: string;
  name: string;
  assignedClassId: string | null;
  inSelectedClass: boolean;
   semester: number; 
}

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [classes, setClasses] = useState<StaffClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Create class state
  const [createForm, setCreateForm] = useState({ name: '', semester: '', capacity: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Student management state
  const [newRollNumber, setNewRollNumber] = useState('');
  const [candidateStudents, setCandidateStudents] = useState<StudentCandidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState<string>('');

  // Syllabus tracking state
  const [syllabusUnits, setSyllabusUnits] = useState<Array<{ number: number; title: string; topics: string[] }>>([]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);  const [classProgressMap, setClassProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const manageableClasses = useMemo(
    () => classes.filter((item) => item.canManageStudents),
    [classes]
  );

  const selectedClass = useMemo(
    () => manageableClasses.find((item) => item._id === selectedClassId) ?? null,
    [manageableClasses, selectedClassId]
  );

  const filteredStudents = useMemo(() => {
    if (!semesterFilter) return candidateStudents;
    return candidateStudents.filter(s => s.inSelectedClass || s.semester === Number(semesterFilter));
  }, [candidateStudents, semesterFilter]);

  const uniqueSemesters = useMemo(
    () => [...new Set(candidateStudents.map(s => s.semester))].filter(Boolean).sort((a, b) => a - b),
    [candidateStudents]
  );

  const fetchClassProgress = async (classId: string, semester: number) => {
    try {
      // Fetch semester syllabus
      const syllabusRes = await fetch(`/api/syllabus?semester=${semester}`);
      const syllabusData = await syllabusRes.json();
      const totalTopics = syllabusData.subjects?.[0]?.units?.reduce((sum: number, unit: { topics?: Array<string> }) => sum + (unit.topics?.length || 0), 0) || 0;

      // Fetch progress
      const progressRes = await fetch(`/api/staff/classes/${classId}/syllabus`);
      const progressData = await progressRes.json();
      const completedCount = progressData.completedTopics?.length || 0;

      return { completed: completedCount, total: totalTopics };
    } catch {
      return { completed: 0, total: 0 };
    }
  };

  const fetchClasses = useCallback(async () => {
    try {
      const res  = await fetch('/api/staff/classes');
      const data = await res.json();
      if (!res.ok) { setFeedback(data.message || 'Failed to load classes.'); setFeedbackType('error'); return; }
      const staffClasses: StaffClass[] = Array.isArray(data.classes) ? data.classes : [];
      setClasses(staffClasses);

      // Fetch progress for all classes
      const progressMap: Record<string, { completed: number; total: number }> = {};
      for (const cls of staffClasses) {
        const progress = await fetchClassProgress(cls._id, cls.semester);
        progressMap[cls._id] = progress;
      }
      setClassProgressMap(progressMap);

      if (!selectedClassId && staffClasses.length > 0) {
        setSelectedClassId(staffClasses[0]._id);
      }
    } catch {
      setFeedback('Failed to load classes.'); setFeedbackType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCandidates = async (classId: string) => {
    const response = await fetch(`/api/staff/classes/${classId}/students`);
    const data = await response.json();

    if (!response.ok) {
      setCandidateStudents([]);
      return;
    }

    setCandidateStudents(Array.isArray(data.candidates) ? data.candidates : []);
  };
const fetchSyllabusAndProgress = async (classId: string, semester: number) => {
  try {
    console.log('📚 Fetching syllabus for semester:', semester);
    
    // Fetch semester syllabus
    const semesterResponse = await fetch(`/api/syllabus?semester=${semester}`);
    const semesterData = await semesterResponse.json();
    console.log('📚 Semester response:', semesterData);
    
    // API returns array of subjects directly
    const units = semesterData?.[0]?.units || [];
    console.log('📚 Units extracted:', units.length, 'units');
    setSyllabusUnits(units);

    // Fetch progress for this class
    const progressResponse = await fetch(`/api/staff/classes/${classId}/syllabus`);
    const progressData = await progressResponse.json();
    console.log('📚 Progress response:', progressData);
    
    if (progressData.ok) {
      setCompletedTopics(progressData.completedTopics || []);
    }
  } catch {
    console.error('Error fetching syllabus/progress');
  }
};
  useEffect(() => {
    if (!selectedClassId) { setCandidateStudents([]); setSelectedCandidateRoll(''); return; }
    void fetchCandidates(selectedClassId);
    const semester = manageableClasses.find(c => c._id === selectedClassId)?.semester || 6;
    void fetchSyllabusAndProgress(selectedClassId, semester);
  }, [selectedClassId, manageableClasses]);

  const handleCreateClass = async () => {
    if (!createForm.name || !createForm.semester || !createForm.capacity) {
      setFeedback('All fields are required.');
      return;
    }

    try {
      setIsCreating(true);
      setFeedback(null);

      const response = await fetch('/api/staff/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          semester: Number(createForm.semester),
          capacity: Number(createForm.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.message || 'Failed to create class.');
        return;
      }

      setFeedback('✓ Class created successfully!');
      setCreateForm({ name: '', semester: '', capacity: '' });
      
      await fetchClasses();
      setTimeout(() => setActiveTab('dashboard'), 1500);
    } catch {
      setFeedback('Error creating class.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClass) {
      setFeedback('Select a class first.');
      return;
    }

    if (!newRollNumber.trim()) {
      setFeedback('Enter a student roll number.');
      return;
    }

    try {
      setIsSubmitting(true); setFeedback(null); setFeedbackType(null);
      const res  = await fetch(`/api/staff/classes/${selectedClass._id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: newRollNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFeedback(data.message || 'Unable to add student.'); setFeedbackType('error'); return; }
      setFeedback(data.message || 'Student added to class.'); setFeedbackType('success');
      setNewRollNumber(''); setSelectedCandidateRoll('');
      await fetchClasses(); await fetchCandidates(selectedClass._id);
    } catch {
      setFeedback('Error adding student.');
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleSaveProgress = async (completed: string[]) => {
  if (!selectedClass) return;
  
  try {
    setIsSaving(true);
    console.log('Saving progress:', completed.length, 'topics');
    
    const response = await fetch(
      `/api/staff/classes/${selectedClass._id}/syllabus`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedTopics: completed }),
      }
    );
    
    const data = await response.json();
    if (data.ok) {
      setFeedback('✓ Progress saved!');
      setCompletedTopics(data.completedTopics);
    }
  } catch {
    setFeedback('Failed to save progress');
  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={cn(
          'bg-slate-900 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Back</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center px-4 h-12 rounded-xl transition-all duration-300 gap-4 group relative',
                  isActive 
                    ? 'bg-white/10 text-white shadow-inner border border-white/10' 
                    : 'text-indigo-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={20} className="shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-indigo-300 hover:text-white gap-3 rounded-xl px-4 py-6">
              <ArrowLeft size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Exit</span>
            </Button>
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">Staff Portal</h1>
            <p className="text-slate-600 mt-2">Manage your classes and customize curriculum</p>
          </div>

            <div className="flex items-center gap-4">
              <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 border border-slate-100 bg-slate-50/50 relative">
                <Bell size={18} className="text-slate-400" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
              </Button>
            </div>
          </header>

        {/* Scrollable content */}
        <div className="staff-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 60px', backgroundColor: '#F5F4F0', position: 'relative' }}>
          {/* Dot grid fade */}
          <div className="dot-grid-staff" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, opacity: 0.3, pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', zIndex: 0 }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >

                {/* ── Dashboard ── */}
                {tab === 'dashboard' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {feedback && (
                      <FeedbackBanner type={feedbackType}>{feedback}</FeedbackBanner>
                    )}

                    {/* Stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                      {[
                        { label: 'Assigned Classes', value: String(classes.length),                                       icon: BookOpen,       accent: '#5A7AB5', bg: '#E4ECFB' },
                        { label: 'Class Guide Roles', value: String(manageableClasses.length),                            icon: Users,          accent: '#4A9068', bg: '#E2F5EA' },
                        { label: 'Total Students',   value: String(classes.reduce((s, c) => s + c.studentCount, 0)), icon: ClipboardCheck, accent: '#C06060', bg: '#FDE8E8' },
                      ].map((s, i) => (
                        <div key={i} className="staff-card" style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <s.icon size={18} style={{ color: s.accent }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 26, fontWeight: 700, color: '#1A1916', lineHeight: 1, marginBottom: 4, fontFamily: 'DM Sans, sans-serif' }}>{s.value}</p>
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#B0AEA7', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Assigned classes list */}
                    <div className="staff-card" style={{ padding: '28px 24px' }}>
                      <SectionLabel>My Assigned Classes</SectionLabel>
                      {loading ? (
                        <p style={{ fontSize: 13, color: '#9E9B94' }}>Loading classes…</p>
                      ) : classes.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#9E9B94' }}>No classes assigned yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {classes.map((item) => (
                            <div key={item._id} style={{ borderRadius: 14, border: '1.5px solid #E8E6E0', backgroundColor: '#F5F4F0', padding: '16px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1916' }}>{item.name}</p>
                                  <p style={{ fontSize: 11, color: '#9E9B94', marginTop: 3, fontWeight: 500 }}>Semester {item.semester} · {item.department}</p>
                                </div>
                                <span className="staff-tag" style={item.canManageStudents ? { backgroundColor: '#E2F5EA', color: '#4A9068' } : { backgroundColor: '#E4ECFB', color: '#5A7AB5' }}>
                                  {item.canManageStudents ? 'Class Guide' : 'Subject Faculty'}
                                </span>
                              </div>
                              <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, color: '#6B6860', fontWeight: 500 }}>
                                  Students: <strong style={{ color: '#1A1916' }}>{item.studentCount} / {item.capacity}</strong>
                                </span>
                                <span style={{ fontSize: 12, color: '#6B6860', fontWeight: 500 }}>
                                  Subjects: <strong style={{ color: '#1A1916' }}>{item.assignedSubjects.length > 0 ? item.assignedSubjects.map((s) => s.subjectName).join(', ') : 'None'}</strong>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Attendance placeholder ── */}
                {tab === 'attendance' && (
                  <EmptyState icon={<ClipboardCheck size={52} strokeWidth={1.5} style={{ color: '#C8C6BF' }} />}
                    title="Class Attendance"
                    desc="Attendance features can be scoped to classes returned by your assignment list."
                  />
                )}

                {/* ── Students ── */}
                {tab === 'students' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {manageableClasses.length === 0 ? (
                      <EmptyState icon={<Users size={52} strokeWidth={1.5} style={{ color: '#C8C6BF' }} />}
                        title="Student Management"
                        desc="You are not assigned as class guide for any class yet."
                      />
                    ) : (
                      <div className="staff-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <SectionLabel>Class Guide — Student Management</SectionLabel>

                        {/* Class + candidate pickers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div>
                            <FieldLabel>Select Class</FieldLabel>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                              <SelectTrigger className="staff-input" style={{ display: 'flex' }}>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent style={{ fontFamily: 'DM Sans, sans-serif', borderRadius: 12, border: '1.5px solid #E8E6E0' }}>
                                {manageableClasses.map((c) => (
                                  <SelectItem key={c._id} value={c._id} style={{ fontSize: 13 }}>{c.name} — Sem {c.semester}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <FieldLabel>Pick Student</FieldLabel>
                            <Select value={selectedCandidateRoll} onValueChange={(v) => { setSelectedCandidateRoll(v); setNewRollNumber(v); }}>
                              <SelectTrigger className="staff-input" style={{ display: 'flex' }}>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent style={{ fontFamily: 'DM Sans, sans-serif', borderRadius: 12, border: '1.5px solid #E8E6E0' }}>
                                {candidateStudents.map((c) => (
                                  <SelectItem key={c._id} value={c.rollNumber} style={{ fontSize: 13 }}>
                                    {c.rollNumber} — {c.name}{c.inSelectedClass ? ' (In class)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Roll number + add */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
                          <div>
                            <FieldLabel>Roll Number</FieldLabel>
                            <Input
                              className="staff-input"
                              value={newRollNumber}
                              onChange={(e) => setNewRollNumber(e.target.value)}
                              placeholder="e.g. BCA24-001"
                            />
                          </div>
                          <button className="staff-btn-primary" onClick={handleAddStudent} disabled={isSubmitting} style={{ height: 42, width: '100%' }}>
                            {isSubmitting ? 'Adding…' : 'Add Student'}
                          </button>
                        </div>

                        {feedback && <FeedbackBanner type={feedbackType}>{feedback}</FeedbackBanner>}

                        {/* Students in selected class */}
                        {selectedClass && (
                          <div style={{ borderRadius: 14, border: '1.5px solid #E8E6E0', backgroundColor: '#F5F4F0', padding: '18px', marginTop: 8 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#B0AEA7', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
                              Students in {selectedClass.name}
                            </p>
                            {selectedClass.students.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedClass.students.map((student) => (
                                  <div key={student._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDFCF9', border: '1px solid #E8E6E0', borderRadius: 10, padding: '10px 14px' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1916' }}>{student.rollNumber}</span>
                                    <span className="staff-tag" style={{ backgroundColor: '#E2F5EA', color: '#4A9068' }}>Sem {student.semester}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: 13, color: '#9E9B94' }}>No students added yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Uploads ── */}
                {tab === 'uploads' && <UploadManager staffMode={true} />}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Helpers ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B0AEA7', marginBottom: 20, fontFamily: 'DM Sans, sans-serif' }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em', fontFamily: 'DM Sans, sans-serif' }}>
      {children}
    </p>
  );
}

function FeedbackBanner({ type, children }: { type: 'success' | 'error' | null; children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 600, padding: '10px 14px', borderRadius: 10,
      ...(type === 'success'
        ? { background: '#E2F5EA', color: '#4A9068', border: '1px solid #B8DEC9' }
        : { background: '#FDE8E8', color: '#C06060', border: '1px solid #F0C0C0' }),
    }}>
      {children}
    </p>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center', gap: 16, border: '1.5px dashed #E8E6E0', borderRadius: 20, backgroundColor: '#FDFCF9' }}>
      {icon}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ width: 32, height: 2, backgroundColor: '#E8E6E0', borderRadius: 2 }} />
        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', color: '#1A1916' }}>{title}</h3>
        <div style={{ width: 32, height: 2, backgroundColor: '#E8E6E0', borderRadius: 2 }} />
      </div>
      <p style={{ fontSize: 13, color: '#7A7872', maxWidth: 360, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}