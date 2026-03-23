export interface Student {
  id: string;
  name: string;
  completion: number;
  riskLevel: 'green' | 'yellow' | 'red';
  daysLeft: number;
  subjectsBehind: string[];
}

export const mockStudents: Student[] = [
  {
    id: 's1',
    name: 'Rahul Kumar',
    completion: 85,
    riskLevel: 'green',
    daysLeft: 30,
    subjectsBehind: [],
  },
  {
    id: 's2',
    name: 'Priya Sharma',
    completion: 72,
    riskLevel: 'green',
    daysLeft: 30,
    subjectsBehind: ['Computer Networks'],
  },
  {
    id: 's3',
    name: 'Amit Patel',
    completion: 45,
    riskLevel: 'red',
    daysLeft: 30,
    subjectsBehind: ['Data Structures', 'Operating Systems'],
  },
  {
    id: 's4',
    name: 'Sneha Reddy',
    completion: 60,
    riskLevel: 'yellow',
    daysLeft: 30,
    subjectsBehind: ['Software Engineering'],
  },
  {
    id: 's5',
    name: 'Vikram Singh',
    completion: 30,
    riskLevel: 'red',
    daysLeft: 30,
    subjectsBehind: ['Java Programming', 'Database Management'],
  },
  {
    id: 's6',
    name: 'Anjali Gupta',
    completion: 90,
    riskLevel: 'green',
    daysLeft: 30,
    subjectsBehind: [],
  },
  {
    id: 's7',
    name: 'Karan Malhotra',
    completion: 55,
    riskLevel: 'yellow',
    daysLeft: 30,
    subjectsBehind: ['Operating Systems'],
  },
  {
    id: 's8',
    name: 'Megha Jain',
    completion: 40,
    riskLevel: 'red',
    daysLeft: 30,
    subjectsBehind: ['Data Structures', 'Computer Networks'],
  },
  {
    id: 's9',
    name: 'Siddharth Rao',
    completion: 78,
    riskLevel: 'green',
    daysLeft: 30,
    subjectsBehind: [],
  },
  {
    id: 's10',
    name: 'Riya Verma',
    completion: 65,
    riskLevel: 'yellow',
    daysLeft: 30,
    subjectsBehind: ['Java Programming'],
  },
];
