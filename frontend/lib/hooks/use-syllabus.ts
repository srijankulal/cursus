'use client';

import { useState, useEffect } from 'react';

export interface Topic {
  id: string;
  name: string;
  isHighYield: boolean;
  unitId: string;
}

export interface Unit {
  id: string;
  unit_number: number;
  name: string;
  hours: number;
  content: string;
  topics: Topic[];
  subjectId: string;
}

export interface Subject {
  id: string;
  subject_code: string;
  name: string;
  type: string;
  credits: number;
  total_hours: number;
  exam_marks: number;
  cie_marks: number;
  total_marks: number;
  units: Unit[];
  semesterNumber: number;
}

export interface Semester {
  id: string;
  semesterNumber: number;
  name: string;
  subjects: Subject[];
}

const today = new Date();
export const EXAM_DATE_DEFAULT = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

function parseTopics(content: string, unitId: string): Topic[] {
  return content.split(".").map(s => s.trim()).filter(Boolean).map((topicName, index) => ({
    id: `${unitId}-t${index + 1}`,
    name: topicName,
    isHighYield: topicName.toLowerCase().includes("architecture") || 
                 topicName.toLowerCase().includes("jdbc") ||
                 topicName.toLowerCase().includes("servlet") ||
                 topicName.toLowerCase().includes("machine learning") ||
                 topicName.toLowerCase().includes("mysql"),
    unitId
  }));
}

export function useSyllabus(semesterNumber: number = 6) {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSyllabus() {
      try {
        setLoading(true);
        const response = await fetch(`/api/syllabus?semester=${semesterNumber}`);
        if (!response.ok) {
          throw new Error('Failed to fetch syllabus');
        }
        const subjects: any[] = await response.json();
        
        // Transform the data to match our interface (using 'name' for both Subject and Unit)
        const transformedSubjects: Subject[] = subjects.map(s => ({
          ...s,
          id: s.id || s.subject_code,
          name: s.subject_name || s.name,
          units: (s.units || []).map((u: any) => {
            const unitId = s.subject_code + "-u" + u.unit_number;
            let topics: Topic[] = [];
            
            if (Array.isArray(u.topics) && u.topics.length > 0 && typeof u.topics[0] === 'string') {
               topics = u.topics.map((tName: string, idx: number) => ({
                 id: `${unitId}-t${idx + 1}`,
                 name: tName,
                 isHighYield: tName.toLowerCase().includes("architecture") || 
                              tName.toLowerCase().includes("jdbc") ||
                              tName.toLowerCase().includes("servlet") ||
                              tName.toLowerCase().includes("machine learning") ||
                              tName.toLowerCase().includes("mysql"),
                 unitId
               }));
            } else if (Array.isArray(u.topics)) {
               topics = u.topics; // Already Topic objects
            } else {
               topics = parseTopics(u.content || "", unitId);
            }

            return {
              ...u,
              id: u.id || unitId,
              name: u.title || u.name,
              topics
            };
          })
        }));
        
        // Wrap subjects into a Semester object for component compatibility
        setSemester({
          id: `sem${semesterNumber}`,
          semesterNumber,
          name: `Semester ${semesterNumber}`,
          subjects: transformedSubjects
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSyllabus();
  }, [semesterNumber]);

  return { semester, loading, error };
}
