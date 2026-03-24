'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LayoutDashboard, BookOpen, Users, ClipboardCheck, Upload, Bell } from 'lucide-react';
import { UploadManager } from '@/components/hod/UploadManager';
import Link from 'next/link';

const tabs = [
  { id: 'dashboard', label: 'My Classes', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'students', label: 'Student Progress', icon: Users },
  { id: 'uploads', label: 'Upload Notes/Docs', icon: Upload },
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
}

export default function StaffPage() {
  const [tab, setTab] = useState('dashboard');
  const [classes, setClasses] = useState<StaffClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [newRollNumber, setNewRollNumber] = useState('');
  const [selectedCandidateRoll, setSelectedCandidateRoll] = useState('');
  const [candidateStudents, setCandidateStudents] = useState<StudentCandidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const manageableClasses = useMemo(() => classes.filter((c) => c.canManageStudents), [classes]);
  const selectedClass = useMemo(
    () => manageableClasses.find((c) => c._id === selectedClassId) ?? null,
    [manageableClasses, selectedClassId]
  );

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/classes');
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.message || 'Failed to load classes.');
        setFeedbackType('error');
        return;
      }

      const staffClasses: StaffClass[] = Array.isArray(data.classes) ? data.classes : [];
      setClasses(staffClasses);

      const firstManageable = staffClasses.find((c) => c.canManageStudents);
      if (firstManageable) {
        setSelectedClassId((prev) => prev || firstManageable._id);
      }
    } catch {
      setFeedback('Failed to load classes.');
      setFeedbackType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCandidates = useCallback(async (classId: string) => {
    const res = await fetch(`/api/staff/classes/${classId}/students`);
    const data = await res.json();
    if (!res.ok) {
      setCandidateStudents([]);
      setFeedback(data.message || 'Failed to load students.');
      setFeedbackType('error');
      return;
    }
    setCandidateStudents(Array.isArray(data.candidates) ? data.candidates : []);
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (!selectedClassId) {
      setCandidateStudents([]);
      setSelectedCandidateRoll('');
      return;
    }
    void fetchCandidates(selectedClassId);
  }, [selectedClassId, fetchCandidates]);

  const handleAddStudent = async () => {
    if (!selectedClass) {
      setFeedback('Select a class where you are class guide.');
      setFeedbackType('error');
      return;
    }

    if (!newRollNumber.trim()) {
      setFeedback('Enter a student roll number.');
      setFeedbackType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      setFeedbackType(null);

      const res = await fetch(`/api/staff/classes/${selectedClass._id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: newRollNumber.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.message || 'Unable to add student.');
        setFeedbackType('error');
        return;
      }

      setFeedback(data.message || 'Student added to class.');
      setFeedbackType('success');
      setNewRollNumber('');
      setSelectedCandidateRoll('');
      await fetchClasses();
      await fetchCandidates(selectedClass._id);
    } catch {
      setFeedback('Unable to add student.');
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#F5F4F0',
        fontFamily: "'DM Sans', sans-serif",
        color: '#1A1916',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .staff-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 0 16px; height: 44px; border-radius: 12px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; border: none; width: 100%; text-align: left;
          transition: background 0.18s, color 0.18s;
          position: relative; font-family: 'DM Sans', sans-serif; background: none;
        }
        .staff-nav-link.inactive { color: #9E9B94; }
        .staff-nav-link.inactive:hover { background: rgba(74,144,104,0.08); color: #4A9068; }
        .staff-nav-link.active { background: #E2F5EA; color: #4A9068; border: 1px solid #B8DEC9; }

        .staff-card { background: #FDFCF9; border: 1.5px solid #E8E6E0; border-radius: 20px; }

        .staff-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 100px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
        }

        .staff-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #6B6860; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 12px;
          padding: 8px 16px; border: 1.5px solid #E8E6E0;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          cursor: pointer; text-decoration: none; white-space: nowrap;
        }
        .staff-btn-ghost:hover { border-color: #C8C6BF; color: #1A1916; background: #FDFCF9; }

        .staff-input {
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          border: 1.5px solid #E8E6E0; background: #F5F4F0;
          color: #1A1916; border-radius: 10px; height: 42px; width: 100%;
          padding: 0 12px; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .staff-input:focus { outline: none; border-color: #4A9068; box-shadow: 0 0 0 2.5px rgba(74,144,104,0.15); }

        .dot-grid-staff {
          background-image: radial-gradient(circle, #D0CEC8 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .staff-scroll::-webkit-scrollbar { width: 4px; }
        .staff-scroll::-webkit-scrollbar-track { background: transparent; }
        .staff-scroll::-webkit-scrollbar-thumb { background: #E8E6E0; border-radius: 99px; }
        .staff-scroll::-webkit-scrollbar-thumb:hover { background: #C8C6BF; }

        .mobile-overlay-staff {
          position: fixed; inset: 0; background: rgba(26,25,22,0.4);
          backdrop-filter: blur(4px); z-index: 40;
        }

        @media (min-width: 1024px) {
          .staff-sidebar { transform: translateX(0) !important; }
          .mobile-overlay-staff { display: none !important; }
          .staff-main { margin-left: 240px !important; }
          .lg-hidden { display: none !important; }
        }
      `}</style>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-overlay-staff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className="staff-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          backgroundColor: '#FDFCF9',
          borderRight: '1.5px solid #E8E6E0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.3s ease',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 20px',
            borderBottom: '1.5px solid #E8E6E0',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: '#1A1916',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: '#F5F4F0',
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'DM Serif Display, serif',
              }}
            >
              C
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 400,
                color: '#1A1916',
                letterSpacing: '-0.02em',
                fontFamily: 'DM Serif Display, serif',
              }}
            >
              Cursus
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#9E9B94',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Staff Portal
            </div>
          </div>
          <span className="staff-tag" style={{ backgroundColor: '#E2F5EA', color: '#4A9068', flexShrink: 0 }}>
            Staff
          </span>
        </div>

        <nav className="staff-scroll" style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          <div
            className="dot-grid-staff"
            style={{
              height: 48,
              borderRadius: 12,
              marginBottom: 8,
              opacity: 0.35,
              maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
            }}
          />

          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`staff-nav-link ${isActive ? 'active' : 'inactive'}`}
              >
                <t.icon size={16} style={{ flexShrink: 0, color: isActive ? '#4A9068' : 'currentColor' }} />
                {t.label}
                {isActive && (
                  <motion.span
                    layoutId="staff-nav-indicator"
                    style={{
                      marginLeft: 'auto',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#4A9068',
                      flexShrink: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1.5px solid #E8E6E0' }}>
          <Link href="/" className="staff-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={13} /> Back to home
          </Link>
        </div>
      </aside>

      <main className="staff-main staff-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header
          style={{
            height: 64,
            flexShrink: 0,
            backgroundColor: 'rgba(245,244,240,0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #E8E6E0',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg-hidden"
              style={{
                background: 'none',
                border: '1.5px solid #E8E6E0',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                color: '#6B6860',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LayoutDashboard size={16} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: 'DM Serif Display, serif',
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  color: '#1A1916',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tabs.find((t) => t.id === tab)?.label}
              </h1>
              <p style={{ fontSize: 11, color: '#9E9B94', fontWeight: 500, marginTop: 1 }}>
                Manage your assigned classes and students
              </p>
            </div>
          </div>

          <button className="staff-btn-ghost" style={{ padding: '8px 10px', gap: 0, position: 'relative' }}>
            <Bell size={15} />
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#C06060',
                border: '1.5px solid #F5F4F0',
              }}
            />
          </button>
        </header>

        <div className="staff-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 60px', backgroundColor: '#F5F4F0', position: 'relative' }}>
          <div
            className="dot-grid-staff"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              opacity: 0.3,
              pointerEvents: 'none',
              maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
              zIndex: 0,
            }}
          />

          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === 'dashboard' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {feedback && <FeedbackBanner type={feedbackType}>{feedback}</FeedbackBanner>}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                      {[
                        { label: 'Assigned Classes', value: String(classes.length), icon: BookOpen, accent: '#5A7AB5', bg: '#E4ECFB' },
                        { label: 'Class Guide Roles', value: String(manageableClasses.length), icon: Users, accent: '#4A9068', bg: '#E2F5EA' },
                        {
                          label: 'Total Students',
                          value: String(classes.reduce((s, c) => s + c.studentCount, 0)),
                          icon: ClipboardCheck,
                          accent: '#C06060',
                          bg: '#FDE8E8',
                        },
                      ].map((s, i) => (
                        <div key={i} className="staff-card" style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              backgroundColor: s.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <s.icon size={18} style={{ color: s.accent }} />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 26,
                                fontWeight: 700,
                                color: '#1A1916',
                                lineHeight: 1,
                                marginBottom: 4,
                                fontFamily: 'DM Sans, sans-serif',
                              }}
                            >
                              {s.value}
                            </p>
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#B0AEA7', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                              {s.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="staff-card" style={{ padding: '28px 24px' }}>
                      <SectionLabel>My Assigned Classes</SectionLabel>
                      {loading ? (
                        <p style={{ fontSize: 13, color: '#9E9B94' }}>Loading classes...</p>
                      ) : classes.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#9E9B94' }}>No classes assigned yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {classes.map((item) => (
                            <div
                              key={item._id}
                              style={{ borderRadius: 14, border: '1.5px solid #E8E6E0', backgroundColor: '#F5F4F0', padding: '16px 18px' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1916' }}>{item.name}</p>
                                  <p style={{ fontSize: 11, color: '#9E9B94', marginTop: 3, fontWeight: 500 }}>
                                    Semester {item.semester} · {item.department}
                                  </p>
                                </div>
                                <span
                                  className="staff-tag"
                                  style={item.canManageStudents ? { backgroundColor: '#E2F5EA', color: '#4A9068' } : { backgroundColor: '#E4ECFB', color: '#5A7AB5' }}
                                >
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

                {tab === 'attendance' && (
                  <EmptyState
                    icon={<ClipboardCheck size={52} strokeWidth={1.5} style={{ color: '#C8C6BF' }} />}
                    title="Class Attendance"
                    desc="Attendance features can be scoped to classes returned by your assignment list."
                  />
                )}

                {tab === 'students' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {manageableClasses.length === 0 ? (
                      <EmptyState
                        icon={<Users size={52} strokeWidth={1.5} style={{ color: '#C8C6BF' }} />}
                        title="Student Management"
                        desc="You are not assigned as class guide for any class yet."
                      />
                    ) : (
                      <div className="staff-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <SectionLabel>Class Guide — Student Management</SectionLabel>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div>
                            <FieldLabel>Select Class</FieldLabel>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                              <SelectTrigger className="staff-input" style={{ display: 'flex' }}>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent style={{ fontFamily: 'DM Sans, sans-serif', borderRadius: 12, border: '1.5px solid #E8E6E0' }}>
                                {manageableClasses.map((c) => (
                                  <SelectItem key={c._id} value={c._id} style={{ fontSize: 13 }}>
                                    {c.name} — Sem {c.semester}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <FieldLabel>Pick Student</FieldLabel>
                            <Select
                              value={selectedCandidateRoll}
                              onValueChange={(v) => {
                                setSelectedCandidateRoll(v);
                                setNewRollNumber(v);
                              }}
                            >
                              <SelectTrigger className="staff-input" style={{ display: 'flex' }}>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent style={{ fontFamily: 'DM Sans, sans-serif', borderRadius: 12, border: '1.5px solid #E8E6E0' }}>
                                {candidateStudents.map((c) => (
                                  <SelectItem key={c._id} value={c.rollNumber} style={{ fontSize: 13 }}>
                                    {c.rollNumber} — {c.name}
                                    {c.inSelectedClass ? ' (In class)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
                          <div>
                            <FieldLabel>Roll Number</FieldLabel>
                            <Input className="staff-input" value={newRollNumber} onChange={(e) => setNewRollNumber(e.target.value)} placeholder="e.g. BCA24-001" />
                          </div>
                          <button
                            onClick={handleAddStudent}
                            disabled={isSubmitting}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isSubmitting ? '#C8C6BF' : '#1A1916',
                              color: '#F5F4F0',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 12,
                              padding: '9px 18px',
                              border: 'none',
                              height: 42,
                              width: '100%',
                              cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isSubmitting ? 'Adding...' : 'Add Student'}
                          </button>
                        </div>

                        {feedback && <FeedbackBanner type={feedbackType}>{feedback}</FeedbackBanner>}

                        {selectedClass && (
                          <div style={{ borderRadius: 14, border: '1.5px solid #E8E6E0', backgroundColor: '#F5F4F0', padding: '18px', marginTop: 8 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#B0AEA7', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
                              Students in {selectedClass.name}
                            </p>
                            {selectedClass.students.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedClass.students.map((student) => (
                                  <div
                                    key={student._id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: '#FDFCF9',
                                      border: '1px solid #E8E6E0',
                                      borderRadius: 10,
                                      padding: '10px 14px',
                                    }}
                                  >
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1916' }}>{student.rollNumber}</span>
                                    <span className="staff-tag" style={{ backgroundColor: '#E2F5EA', color: '#4A9068' }}>
                                      Sem {student.semester}
                                    </span>
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

                {tab === 'uploads' && <UploadManager staffMode={true} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#B0AEA7',
        marginBottom: 20,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#6B6860',
        marginBottom: 6,
        letterSpacing: '0.02em',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {children}
    </p>
  );
}

function FeedbackBanner({ type, children }: { type: 'success' | 'error' | null; children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '10px 14px',
        borderRadius: 10,
        ...(type === 'success'
          ? { background: '#E2F5EA', color: '#4A9068', border: '1px solid #B8DEC9' }
          : { background: '#FDE8E8', color: '#C06060', border: '1px solid #F0C0C0' }),
      }}
    >
      {children}
    </p>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
        textAlign: 'center',
        gap: 16,
        border: '1.5px dashed #E8E6E0',
        borderRadius: 20,
        backgroundColor: '#FDFCF9',
      }}
    >
      {icon}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ width: 32, height: 2, backgroundColor: '#E8E6E0', borderRadius: 2 }} />
        <h3
          style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#1A1916',
          }}
        >
          {title}
        </h3>
        <div style={{ width: 32, height: 2, backgroundColor: '#E8E6E0', borderRadius: 2 }} />
      </div>
      <p style={{ fontSize: 13, color: '#7A7872', maxWidth: 360, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}
