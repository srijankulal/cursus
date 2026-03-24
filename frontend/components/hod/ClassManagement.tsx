'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';

interface Class {
  _id: string;
  name: string;
  semester: number;
  capacity: number;
  classGuide: { _id: string; name: string; email: string };
  faculties: Array<{ _id: string; name: string; email: string }>;
  courseAssignments?: Array<{
    subjectId: string;
    subjectName: string;
    faculty: string | { _id: string; name?: string; email?: string };
  }>;
  students?: Array<{ _id: string; rollNumber: string }>;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  name: string;
}

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isValidObjectId = (value: string | null | undefined) =>
    Boolean(value && /^[a-fA-F0-9]{24}$/.test(value));

  const resolveUserId = useCallback(async () => {
    const localUserId = localStorage.getItem('userId');

    if (isValidObjectId(localUserId)) {
      return localUserId as string;
    }

    if (localUserId) {
      localStorage.removeItem('userId');
    }

    const sessionRes = await fetch('/api/auth/session');
    if (!sessionRes.ok) {
      return null;
    }

    const sessionData = await sessionRes.json();
    const sessionUserId = sessionData.userId as string | null;

    if (isValidObjectId(sessionUserId)) {
      localStorage.setItem('userId', sessionUserId as string);
      return sessionUserId as string;
    }

    return null;
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    semester: '1',
    capacity: '',
    classGuide: '',
  });

  const fetchCoursesForSemester = async (semester: string) => {
    const response = await fetch(`/api/hod/courses?semester=${semester}`);

    if (!response.ok) {
      setCourses([]);
      setCourseAssignments({});
      return;
    }

    const data = await response.json();
    const semesterCourses: Course[] = Array.isArray(data.courses) ? data.courses : [];

    setCourses(semesterCourses);
    setCourseAssignments((prev) => {
      const next: Record<string, string> = {};

      semesterCourses.forEach((course) => {
        if (prev[course.id]) {
          next[course.id] = prev[course.id];
        }
      });

      return next;
    });
  };

  const fetchClassesFromDb = async (userId: string | null) => {
    const headers: HeadersInit = {};
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const classRes = await fetch('/api/hod/classes', { headers });

    if (!classRes.ok) {
      const errorData = await classRes.json().catch(() => ({}));
      setClasses([]);
      return {
        ok: false as const,
        message: errorData.message || 'Unable to load classes from database.',
      };
    }

    const data = await classRes.json();
    setClasses(Array.isArray(data.classes) ? data.classes : []);
    return { ok: true as const };
  };

  // Fetch classes and faculties
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await resolveUserId();
        
        const classesResult = await fetchClassesFromDb(userId);
        if (!classesResult.ok) {
          setFeedback({ type: 'error', message: classesResult.message });
        }

        await fetchCoursesForSemester('1');

        // Fetch available faculties (you'll need to create this endpoint)
        const facultyRes = await fetch('/api/hod/faculties', {
          headers: userId ? { 'x-user-id': userId } : {},
        });
        if (facultyRes.ok) {
          const data = await facultyRes.json();
          setFaculties(Array.isArray(data.faculties) ? data.faculties : []);
        } else {
          const errorData = await facultyRes.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: errorData.message || 'Unable to load faculties for this HOD account.',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setFeedback({ type: 'error', message: 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolveUserId]);

  const handleSemesterChange = async (semester: string) => {
    setFormData((prev) => ({ ...prev, semester }));
    await fetchCoursesForSemester(semester);
  };

  const handleCourseFacultyChange = (courseId: string, facultyId: string) => {
    setCourseAssignments((prev) => ({
      ...prev,
      [courseId]: facultyId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.name || !formData.capacity || !formData.classGuide) {
      setFeedback({ type: 'error', message: 'Please fill all required fields' });
      return;
    }

    if (courses.length === 0) {
      setFeedback({ type: 'error', message: 'No courses found for the selected semester.' });
      return;
    }

    const assignmentPayload = courses.map((course) => ({
      subjectId: course.id,
      subjectName: course.name,
      faculty: courseAssignments[course.id],
    }));

    const hasMissingCourseFaculty = assignmentPayload.some((item) => !item.faculty);
    if (hasMissingCourseFaculty) {
      setFeedback({ type: 'error', message: 'Assign a faculty to each course before saving.' });
      return;
    }

    try {
      const userId = await resolveUserId();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/hod/classes/${editingId}` : '/api/hod/classes';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          semester: parseInt(formData.semester),
          capacity: parseInt(formData.capacity),
          classGuide: formData.classGuide,
          courseAssignments: assignmentPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({ type: 'error', message: data.message || 'Operation failed' });
        return;
      }

      const classesResult = await fetchClassesFromDb(userId);
      if (!classesResult.ok) {
        setFeedback({ type: 'error', message: classesResult.message });
      }
      if (editingId) {
        setEditingId(null);
      }

      setFeedback({ type: 'success', message: editingId ? 'Class updated' : 'Class created' });
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ type: 'error', message: 'An error occurred' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const userId = await resolveUserId();
      const response = await fetch(`/api/hod/classes/${id}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : {},
      });

      if (response.ok) {
        const classesResult = await fetchClassesFromDb(userId);
        if (!classesResult.ok) {
          setFeedback({ type: 'error', message: classesResult.message });
          return;
        }
        setFeedback({ type: 'success', message: 'Class deleted' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setFeedback({ type: 'error', message: errorData.message || 'Failed to delete class' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ type: 'error', message: 'Failed to delete class' });
    }
  };

  const handleEdit = (classItem: Class) => {
    const nextAssignments: Record<string, string> = {};

    (classItem.courseAssignments ?? []).forEach((assignment) => {
      const assignedFaculty = assignment.faculty;
      if (typeof assignedFaculty === 'string') {
        nextAssignments[assignment.subjectId] = assignedFaculty;
      } else if (assignedFaculty?._id) {
        nextAssignments[assignment.subjectId] = assignedFaculty._id;
      }
    });

    setFormData({
      name: classItem.name,
      semester: classItem.semester.toString(),
      capacity: classItem.capacity.toString(),
      classGuide: classItem.classGuide._id,
    });

    setCourseAssignments(nextAssignments);
    void fetchCoursesForSemester(classItem.semester.toString());
    setEditingId(classItem._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      semester: '1',
      capacity: '',
      classGuide: '',
    });
    setCourses([]);
    setCourseAssignments({});
    void fetchCoursesForSemester('1');
    setEditingId(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Class Management</h2>
          <p className="text-sm text-slate-500 mt-1">Create and manage classes for your department</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} />
          New Class
        </Button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {feedback.message}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 bg-white border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6">
                {editingId ? 'Edit Class' : 'Create New Class'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Class Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., BCA 2023-A"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Semester *</label>
                    <Select value={formData.semester} onValueChange={(v) => void handleSemesterChange(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Capacity *</label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="e.g., 60"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Class Guide *</label>
                    <Select value={formData.classGuide} onValueChange={(v) => setFormData({ ...formData, classGuide: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map(f => (
                          <SelectItem key={f._id} value={f._id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Course Faculty Assignment *</label>

                  {courses.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      No courses available for Semester {formData.semester}.
                    </p>
                  ) : (
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {courses.map((course) => (
                        <div key={course.id} className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
                          <p className="text-sm font-medium text-slate-700">{course.name}</p>
                          <Select
                            value={courseAssignments[course.id] ?? ''}
                            onValueChange={(facultyId) => handleCourseFacultyChange(course.id, facultyId)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              {faculties.map((faculty) => (
                                <SelectItem key={`${course.id}-${faculty._id}`} value={faculty._id}>
                                  {faculty.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingId ? 'Update Class' : 'Create Class'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <Users size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No classes created yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first class to get started</p>
          </div>
        ) : (
          classes.map(classItem => (
            <motion.div
              key={classItem._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">{classItem.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Semester {classItem.semester}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(classItem)}
                    className="p-2 hover:bg-slate-100 rounded transition"
                  >
                    <Edit2 size={14} className="text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(classItem._id)}
                    className="p-2 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacity:</span>
                  <span className="font-medium text-slate-900">{classItem.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-500">Class Guide:</span>
                  <p className="font-medium text-slate-900">{classItem.classGuide.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Faculties:</span>
                  <p className="text-xs text-slate-600 mt-1">{classItem.faculties.length} assigned</p>
                </div>
                <div>
                  <span className="text-slate-500">Course Assignments:</span>
                  <p className="text-xs text-slate-600 mt-1">{classItem.courseAssignments?.length ?? 0} courses mapped</p>
                </div>
                {classItem.students && (
                  <div>
                    <span className="text-slate-500">Students:</span>
                    <p className="font-medium text-slate-900">{classItem.students.length}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}