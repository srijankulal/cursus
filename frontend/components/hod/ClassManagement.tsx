'use client';

import { useEffect, useState } from 'react';
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
  students?: Array<{ _id: string; rollNumber: string }>;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
}

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    semester: '1',
    capacity: '',
    classGuide: '',
    faculties: [] as string[],
  });

  // Fetch classes and faculties
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        const classRes = await fetch('/api/hod/classes', {
          headers: { 'x-user-id': userId || '' },
        });
        
        if (classRes.ok) {
          const data = await classRes.json();
          setClasses(data.classes);
        }

        // Fetch available faculties (you'll need to create this endpoint)
        const facultyRes = await fetch('/api/hod/faculties');
        if (facultyRes.ok) {
          const data = await facultyRes.json();
          setFaculties(data.faculties);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setFeedback({ type: 'error', message: 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.name || !formData.capacity || !formData.classGuide) {
      setFeedback({ type: 'error', message: 'Please fill all required fields' });
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/hod/classes/${editingId}` : '/api/hod/classes';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({
          name: formData.name,
          semester: parseInt(formData.semester),
          capacity: parseInt(formData.capacity),
          classGuide: formData.classGuide,
          faculties: formData.faculties.length > 0 ? formData.faculties : [formData.classGuide],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({ type: 'error', message: data.message || 'Operation failed' });
        return;
      }

      if (editingId) {
        setClasses(classes.map(c => c._id === editingId ? data.class : c));
        setEditingId(null);
      } else {
        setClasses([...classes, data.class]);
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
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/hod/classes/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId || '' },
      });

      if (response.ok) {
        setClasses(classes.filter(c => c._id !== id));
        setFeedback({ type: 'success', message: 'Class deleted' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ type: 'error', message: 'Failed to delete class' });
    }
  };

  const handleEdit = (classItem: Class) => {
    setFormData({
      name: classItem.name,
      semester: classItem.semester.toString(),
      capacity: classItem.capacity.toString(),
      classGuide: classItem.classGuide._id,
      faculties: classItem.faculties.map(f => f._id),
    });
    setEditingId(classItem._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      semester: '1',
      capacity: '',
      classGuide: '',
      faculties: [],
    });
    setEditingId(null);
  };

  const handleAddFaculty = (facultyId: string) => {
    if (!formData.faculties.includes(facultyId)) {
      setFormData({
        ...formData,
        faculties: [...formData.faculties, facultyId],
      });
    }
  };

  const handleRemoveFaculty = (facultyId: string) => {
    setFormData({
      ...formData,
      faculties: formData.faculties.filter(f => f !== facultyId),
    });
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
                    <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
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

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Additional Faculties</label>
                  <div className="space-y-2">
                    <Select onValueChange={handleAddFaculty} value="">
                      <SelectTrigger>
                        <SelectValue placeholder="Add more faculties" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties
                          .filter(f => !formData.faculties.includes(f._id) && f._id !== formData.classGuide)
                          .map(f => (
                            <SelectItem key={f._id} value={f._id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {formData.faculties.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.faculties.map(fId => {
                          const faculty = faculties.find(f => f._id === fId);
                          return (
                            <button
                              key={fId}
                              type="button"
                              onClick={() => handleRemoveFaculty(fId)}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                            >
                              {faculty?.name}
                              <span>×</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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