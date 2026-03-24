'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Users, ClipboardCheck, Menu, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { StaffSyllabusTracker } from '@/components/staff/StaffSyllabusTracker';
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'create', label: 'Create Class', icon: Plus },
  { id: 'manage', label: 'Manage Students', icon: Users },
  { id: 'syllabus', label: 'Class Syllabus', icon: ClipboardCheck },
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

          {/* Feedback Message */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700"
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold mb-6">Your Classes</h2>
                
                {loading ? (
                  <div className="text-center py-12 text-slate-500">Loading classes...</div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">No classes found yet</p>
                    <Button onClick={() => setActiveTab('create')}>Create Your First Class</Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {classes.map((cls) => {
                      const progress = classProgressMap[cls._id] || { completed: 0, total: 0 };
                      const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
                      return (
                      <motion.div
                        key={cls._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-lg bg-linear-to-r from-slate-50 to-slate-100 border border-slate-200 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-900">{cls.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Semester {cls.semester} • {cls.studentCount}/{cls.capacity} students
                            </p>
                            {cls.assignedSubjects.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2">
                                Subjects: {cls.assignedSubjects.map(s => s.subjectName).join(', ')}
                              </p>
                            )}
                          </div>
                          {cls.canManageStudents && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedClassId(cls._id);
                                setActiveTab('manage');
                              }}
                              className="ml-4 shrink-0"
                            >
                              Manage
                            </Button>
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Teaching Progress</span>
                            <span className="font-semibold text-slate-900">{progress.completed}/{progress.total} topics</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full bg-blue-600 rounded-full"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">{progressPercent}% complete</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClassId(cls._id);
                                setActiveTab('syllabus');
                              }}
                              className="text-xs h-7"
                            >
                              Mark Topics
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Create Class Tab */}
            {activeTab === 'create' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 md:p-8 max-w-2xl"
              >
                <h2 className="text-2xl font-bold mb-6">Create New Class</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900">Class Name</label>
                    <Input
                      placeholder="e.g., 6th Semester A"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900">Semester</label>
                    <Select value={createForm.semester} onValueChange={(v) => setCreateForm({ ...createForm, semester: v })}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            Semester {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900">Capacity</label>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      value={createForm.capacity}
                      onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
                      className="border-slate-300"
                    />
                  </div>
                  <Button
                    onClick={handleCreateClass}
                    disabled={isCreating}
                    className="w-full py-2"
                  >
                    {isCreating ? 'Creating...' : 'Create Class'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Manage Students Tab */}
            {activeTab === 'manage' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 md:p-8"
              >
                <h2 className="text-2xl font-bold mb-6">Manage Students</h2>
                
                <div className="space-y-6">
                  {/* Select Class */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-900">Select Class</label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Choose class" />
                      </SelectTrigger>
                      <SelectContent>
                        {manageableClasses.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.name} (Sem {cls.semester})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClass && (
                    <>
                      {/* Semester Filter */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-900">Filter by Semester</label>
                        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="All semesters" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {uniqueSemesters.map((sem) => (
                              <SelectItem key={sem} value={String(sem)}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add Student */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="font-bold text-lg mb-3 text-slate-900">Add Student</h3>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter roll number"
                            value={newRollNumber}
                            onChange={(e) => setNewRollNumber(e.target.value)}
                            className="border-slate-300"
                          />
                          <Button onClick={handleAddStudent} disabled={isSubmitting}>
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Student List */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="font-bold text-lg mb-3 text-slate-900">Students ({filteredStudents.length})</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {filteredStudents.length === 0 ? (
                            <p className="text-slate-500">No students found.</p>
                          ) : (
                            filteredStudents.map((student) => (
                              <div key={student._id} className="p-3 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition">
                                <div className="font-semibold text-slate-900">{student.rollNumber}</div>
                                <div className="text-sm text-slate-600">{student.name}</div>
                                {student.inSelectedClass && (
                                  <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1">
                                    In {selectedClass.name}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Syllabus Tab */}
            {activeTab === 'syllabus' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 md:p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Track Teaching Progress</h2>
                </div>

                {!selectedClass ? (
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="border-slate-300 max-w-md">
                      <SelectValue placeholder="Select class first" />
                    </SelectTrigger>
                    <SelectContent>
                      {manageableClasses.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-4 max-w-5xl">
                    <StaffSyllabusTracker
                      units={syllabusUnits}
                      completedTopics={completedTopics}
                      onSave={handleSaveProgress}
                      isSaving={isSaving}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}