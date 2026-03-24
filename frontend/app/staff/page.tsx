'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LayoutDashboard, BookOpen, Users, ClipboardCheck, Settings, Bell, Calendar, Upload } from 'lucide-react';
import { UploadManager } from '@/components/hod/UploadManager';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const tabs = [
  { id: 'dashboard', label: 'My Classes', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
<<<<<<< HEAD
<<<<<<< Updated upstream
  { id: 'students', label: 'Student Progress', icon: Users },
=======
  { id: 'students', label: 'Manage Students', icon: Users },
  { id: 'uploads', label: 'Upload Notes/Docs', icon: Upload },
>>>>>>> Stashed changes
=======
  { id: 'students', label: 'Manage Students', icon: Users },
>>>>>>> 4e062c9ec85af7bcc83809741dd8e68e64ac7f57
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

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/staff/classes');
      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.message || 'Failed to load classes.');
        return;
      }

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
      setFeedback('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

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
    void fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setCandidateStudents([]);
      setSyllabusUnits([]);
      setCompletedTopics([]);
      return;
    }

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
      setIsSubmitting(true);
      setFeedback(null);

      const response = await fetch(`/api/staff/classes/${selectedClass._id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: newRollNumber.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.message || 'Unable to add student.');
        return;
      }

      setFeedback('✓ Student added!');
      setNewRollNumber('');
      await fetchCandidates(selectedClass._id);
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
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(true);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                <Icon size={20} className="shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 text-slate-300 hover:text-white"
          >
            <Menu size={20} />
          </button>
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

          <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20">
            <div className="max-w-6xl mx-auto space-y-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab === 'dashboard' && (
                    <div className="space-y-8">
                       {feedback && (
                         <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                           {feedback}
                         </div>
                       )}

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {[
                           { label: 'Assigned Classes', v: String(classes.length), icon: BookOpen, col: 'text-indigo-600', bg: 'bg-indigo-50' },
                           { label: 'Class Guide Roles', v: String(manageableClasses.length), icon: Users, col: 'text-blue-600', bg: 'bg-blue-50' },
                           { label: 'Total Students', v: String(classes.reduce((sum, item) => sum + item.studentCount, 0)), icon: Calendar, col: 'text-emerald-600', bg: 'bg-emerald-50' },
                         ].map((s, i) => (
                           <div key={i} className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm flex items-center gap-6">
                             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", s.bg)}>
                               <s.icon size={20} className={s.col} />
                             </div>
                             <div>
                               <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{s.v}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                             </div>
                           </div>
                         ))}
                       </div>

                       <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-premium">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">My Assigned Classes</h3>
                         </div>
                         {loading ? (
                           <p className="text-sm text-slate-500">Loading classes...</p>
                         ) : classes.length === 0 ? (
                           <p className="text-sm text-slate-500">No classes assigned yet.</p>
                         ) : (
                           <div className="space-y-4">
                             {classes.map((item) => (
                               <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                                 <div className="flex items-center justify-between gap-4">
                                   <div>
                                     <p className="text-base font-bold text-slate-900">{item.name}</p>
                                     <p className="text-xs font-medium text-slate-500 mt-1">
                                       Semester {item.semester} • {item.department}
                                     </p>
                                   </div>
                                   <span className={cn(
                                     'text-[10px] font-bold uppercase px-2 py-1 rounded-md',
                                     item.canManageStudents
                                       ? 'bg-emerald-100 text-emerald-700'
                                       : 'bg-indigo-100 text-indigo-700'
                                   )}>
                                     {item.canManageStudents ? 'Class Guide' : 'Subject Faculty'}
                                   </span>
                                 </div>

                                 <div className="mt-4 grid gap-2 text-sm text-slate-700">
                                   <p>Students: {item.studentCount} / {item.capacity}</p>
                                   <p>
                                     Assigned Subjects:{' '}
                                     {item.assignedSubjects.length > 0
                                       ? item.assignedSubjects.map((subject) => subject.subjectName).join(', ')
                                       : 'None'}
                                   </p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                  )}

                  {tab === 'attendance' && (
                    <div className="p-20 text-center space-y-6 rounded-4xl border-2 border-dashed border-indigo-100 bg-indigo-50/20">
                       <ClipboardCheck size={64} className="mx-auto text-indigo-200" />
                       <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-slate-800">Class Attendance</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Attendance features can now be scoped to classes returned by your assignment list.</p>
                       </div>
                    </div>
                  )}

                  {tab === 'students' && (
<<<<<<< HEAD
<<<<<<< Updated upstream
                    <div className="p-20 text-center space-y-6 rounded-[2rem] border-2 border-dashed border-indigo-100 bg-indigo-50/20">
                       <Users size={64} className="mx-auto text-indigo-200" />
                       <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-slate-800">Student Progress View</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">See how many students have marked specific units as done and identify high-yield confusion points.</p>
                       </div>
=======
=======
>>>>>>> 4e062c9ec85af7bcc83809741dd8e68e64ac7f57
                    <div className="space-y-6 rounded-4xl border border-indigo-100 bg-white p-8 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900">Class Guide Student Management</h3>

                      {manageableClasses.length === 0 ? (
                        <p className="text-sm text-slate-500">You are not class guide for any class yet.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="md:col-span-2">
                              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                  {manageableClasses.map((item) => (
                                    <SelectItem key={item._id} value={item._id}>
                                      {item.name} - Sem {item.semester}
                                    </SelectItem>
                                  ))}
<<<<<<< HEAD

                            
=======
>>>>>>> 4e062c9ec85af7bcc83809741dd8e68e64ac7f57
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Select
                                value={selectedCandidateRoll}
                                onValueChange={(value) => {
                                  setSelectedCandidateRoll(value);
                                  setNewRollNumber(value);
                                }}
                              >
<<<<<<< HEAD
                                
=======
>>>>>>> 4e062c9ec85af7bcc83809741dd8e68e64ac7f57
                                <SelectTrigger>
                                  <SelectValue placeholder="Pick student" />
                                </SelectTrigger>
                                <SelectContent>
                                  {candidateStudents.map((candidate) => (
                                    <SelectItem key={candidate._id} value={candidate.rollNumber}>
                                      {candidate.rollNumber} - {candidate.name}
                                      {candidate.inSelectedClass ? ' (Already in class)' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <div className="md:col-span-2">
                              <Input
                                value={newRollNumber}
                                onChange={(event) => setNewRollNumber(event.target.value)}
                                placeholder="Roll number"
                              />
                            </div>
                            <Button onClick={handleAddStudent} disabled={isSubmitting}>
                              Add Student
                            </Button>
                          </div>

                          {feedback && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              {feedback}
                            </div>
                          )}
<<<<<<< HEAD
                          
              
=======
>>>>>>> 4e062c9ec85af7bcc83809741dd8e68e64ac7f57

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-3">Students in selected class</h4>
                            {selectedClass && selectedClass.students.length > 0 ? (
                              <div className="space-y-2">
                                {selectedClass.students.map((student) => (
                                  <div key={student._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                                    <span className="font-medium text-slate-800">{student.rollNumber}</span>
                                    <span className="text-xs text-slate-500">Semester {student.semester}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No students added yet.</p>
                            )}
                          </div>
                        </>
                      )}
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> 4e062c9ec85af7bcc83809741dd8e68e64ac7f57
                    </div>
                  )}

                  {tab === 'uploads' && (
                      <UploadManager staffMode={true} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}