const COMPLETED_TOPICS_KEY = 'cursus_completed_topics';
const EXAM_DATE_KEY = 'cursus_exam_date';
const STUDY_PLAN_KEY = 'cursus_study_plan';

export const storage = {
  getCompletedTopics: (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(COMPLETED_TOPICS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  toggleTopicCompletion: (topicId: string): string[] => {
    if (typeof window === 'undefined') return [];
    const completed = storage.getCompletedTopics();
    const index = completed.indexOf(topicId);
    let updated;
    if (index === -1) {
      updated = [...completed, topicId];
    } else {
      updated = completed.filter((id) => id !== topicId);
    }
    localStorage.setItem(COMPLETED_TOPICS_KEY, JSON.stringify(updated));
    return updated;
  },
  getExamDate: (): Date | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(EXAM_DATE_KEY);
    return stored ? new Date(stored) : null;
  },
  setExamDate: (date: Date): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EXAM_DATE_KEY, date.toISOString());
  },
  getStudyPlan: (): any | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STUDY_PLAN_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  setStudyPlan: (plan: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STUDY_PLAN_KEY, JSON.stringify(plan));
  },
};
