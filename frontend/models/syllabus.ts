export interface Topic {
  id: string;
  name: string;
  isHighYield: boolean;
  unitId: string;
}

export interface Unit {
  id: string;
  name: string;
  topics: Topic[];
  subjectId: string;
}

export interface Subject {
  id: string;
  name: string;
  units: Unit[];
  semesterId: string;
}

export interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
}

const today = new Date();
export const EXAM_DATE_DEFAULT = new Date(today);
EXAM_DATE_DEFAULT.setDate(today.getDate() + 30);

export const syllabus: Semester[] = [
  {
    id: 'sem3',
    name: 'Semester 3',
    subjects: [
      {
        id: 'ds',
        name: 'Data Structures',
        semesterId: 'sem3',
        units: [
          {
            id: 'ds-u1',
            name: 'Introduction to DS',
            subjectId: 'ds',
            topics: [
              { id: 't1', name: 'Stack', isHighYield: true, unitId: 'ds-u1' },
              { id: 't2', name: 'Queue', isHighYield: false, unitId: 'ds-u1' },
              { id: 't3', name: 'Linked List', isHighYield: true, unitId: 'ds-u1' },
              { id: 't4', name: 'Arrays', isHighYield: false, unitId: 'ds-u1' },
            ],
          },
          {
            id: 'ds-u2',
            name: 'Searching & Sorting',
            subjectId: 'ds',
            topics: [
              { id: 't5', name: 'Binary Search', isHighYield: true, unitId: 'ds-u2' },
              { id: 't6', name: 'Quick Sort', isHighYield: true, unitId: 'ds-u2' },
              { id: 't7', name: 'Bubble Sort', isHighYield: false, unitId: 'ds-u2' },
              { id: 't8', name: 'Linear Search', isHighYield: false, unitId: 'ds-u2' },
            ],
          },
          {
            id: 'ds-u3',
            name: 'Trees & Graphs',
            subjectId: 'ds',
            topics: [
              { id: 't9', name: 'Binary Trees', isHighYield: true, unitId: 'ds-u3' },
              { id: 't10', name: 'BFS/DFS', isHighYield: true, unitId: 'ds-u3' },
              { id: 't11', name: 'Adjacency Matrix', isHighYield: false, unitId: 'ds-u3' },
              { id: 't12', name: 'Graph Traversal', isHighYield: false, unitId: 'ds-u3' },
            ],
          },
        ],
      },
      {
        id: 'os',
        name: 'Operating Systems',
        semesterId: 'sem3',
        units: [
          {
            id: 'os-u1',
            name: 'OS Concepts',
            subjectId: 'os',
            topics: [
              { id: 't13', name: 'Process Management', isHighYield: true, unitId: 'os-u1' },
              { id: 't14', name: 'Threads', isHighYield: false, unitId: 'os-u1' },
              { id: 't15', name: 'Deadlock', isHighYield: true, unitId: 'os-u1' },
              { id: 't16', name: 'System Calls', isHighYield: false, unitId: 'os-u1' },
            ],
          },
          {
            id: 'os-u2',
            name: 'CPU Scheduling',
            subjectId: 'os',
            topics: [
              { id: 't17', name: 'Round Robin', isHighYield: true, unitId: 'os-u2' },
              { id: 't18', name: 'FCFS', isHighYield: false, unitId: 'os-u2' },
              { id: 't19', name: 'SJF', isHighYield: true, unitId: 'os-u2' },
              { id: 't20', name: 'Priority Scheduling', isHighYield: false, unitId: 'os-u2' },
            ],
          },
          {
            id: 'os-u3',
            name: 'Memory Management',
            subjectId: 'os',
            topics: [
              { id: 't21', name: 'Paging', isHighYield: true, unitId: 'os-u3' },
              { id: 't22', name: 'Segmentation', isHighYield: false, unitId: 'os-u3' },
              { id: 't23', name: 'Virtual Memory', isHighYield: true, unitId: 'os-u3' },
              { id: 't24', name: 'Fragmentation', isHighYield: false, unitId: 'os-u3' },
            ],
          },
        ],
      },
      {
        id: 'dbms',
        name: 'Database Management',
        semesterId: 'sem3',
        units: [
          {
            id: 'dbms-u1',
            name: 'ER Models',
            subjectId: 'dbms',
            topics: [
              { id: 't25', name: 'Entities & Attributes', isHighYield: true, unitId: 'dbms-u1' },
              { id: 't26', name: 'ER Diagrams', isHighYield: true, unitId: 'dbms-u1' },
              { id: 't27', name: 'Relationships', isHighYield: false, unitId: 'dbms-u1' },
              { id: 't28', name: 'Keys', isHighYield: false, unitId: 'dbms-u1' },
            ],
          },
          {
            id: 'dbms-u2',
            name: 'SQL',
            subjectId: 'dbms',
            topics: [
              { id: 't29', name: 'SELECT Queries', isHighYield: true, unitId: 'dbms-u2' },
              { id: 't30', name: 'Joins', isHighYield: true, unitId: 'dbms-u2' },
              { id: 't31', name: 'Aggregate Functions', isHighYield: false, unitId: 'dbms-u2' },
              { id: 't32', name: 'Subqueries', isHighYield: false, unitId: 'dbms-u2' },
            ],
          },
          {
            id: 'dbms-u3',
            name: 'Normalization',
            subjectId: 'dbms',
            topics: [
              { id: 't33', name: '1NF, 2NF, 3NF', isHighYield: true, unitId: 'dbms-u3' },
              { id: 't34', name: 'BCNF', isHighYield: true, unitId: 'dbms-u3' },
              { id: 't35', name: 'Dependency Preservation', isHighYield: false, unitId: 'dbms-u3' },
              { id: 't36', name: 'Decomposition', isHighYield: false, unitId: 'dbms-u3' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sem4',
    name: 'Semester 4',
    subjects: [
      {
        id: 'java',
        name: 'Java Programming',
        semesterId: 'sem4',
        units: [
          {
            id: 'java-u1',
            name: 'OOP Concepts',
            subjectId: 'java',
            topics: [
              { id: 't37', name: 'Classes & Objects', isHighYield: true, unitId: 'java-u1' },
              { id: 't38', name: 'Inheritance', isHighYield: true, unitId: 'java-u1' },
              { id: 't39', name: 'Polymorphism', isHighYield: false, unitId: 'java-u1' },
              { id: 't40', name: 'Encapsulation', isHighYield: false, unitId: 'java-u1' },
            ],
          },
          {
            id: 'java-u2',
            name: 'Exception Handling',
            subjectId: 'java',
            topics: [
              { id: 't41', name: 'Try-Catch', isHighYield: true, unitId: 'java-u2' },
              { id: 't42', name: 'Finally Block', isHighYield: false, unitId: 'java-u2' },
              { id: 't43', name: 'Custom Exceptions', isHighYield: true, unitId: 'java-u2' },
              { id: 't44', name: 'Throws Clause', isHighYield: false, unitId: 'java-u2' },
            ],
          },
          {
            id: 'java-u3',
            name: 'Multithreading',
            subjectId: 'java',
            topics: [
              { id: 't45', name: 'Thread Lifecycle', isHighYield: true, unitId: 'java-u3' },
              { id: 't46', name: 'Synchronization', isHighYield: true, unitId: 'java-u3' },
              { id: 't47', name: 'Inter-thread Communication', isHighYield: false, unitId: 'java-u3' },
              { id: 't48', name: 'Thread Priority', isHighYield: false, unitId: 'java-u3' },
            ],
          },
        ],
      },
      {
        id: 'se',
        name: 'Software Engineering',
        semesterId: 'sem4',
        units: [
          {
            id: 'se-u1',
            name: 'Process Models',
            subjectId: 'se',
            topics: [
              { id: 't49', name: 'Waterfall Model', isHighYield: true, unitId: 'se-u1' },
              { id: 't50', name: 'Agile Model', isHighYield: true, unitId: 'se-u1' },
              { id: 't51', name: 'Spiral Model', isHighYield: false, unitId: 'se-u1' },
              { id: 't52', name: 'RAD Model', isHighYield: false, unitId: 'se-u1' },
            ],
          },
          {
            id: 'se-u2',
            name: 'Requirements Engineering',
            subjectId: 'se',
            topics: [
              { id: 't53', name: 'SRS Document', isHighYield: true, unitId: 'se-u2' },
              { id: 't54', name: 'Functional Requirements', isHighYield: false, unitId: 'se-u2' },
              { id: 't55', name: 'Non-Functional Requirements', isHighYield: true, unitId: 'se-u2' },
              { id: 't56', name: 'Requirement Analysis', isHighYield: false, unitId: 'se-u2' },
            ],
          },
          {
            id: 'se-u3',
            name: 'Software Testing',
            subjectId: 'se',
            topics: [
              { id: 't57', name: 'White Box Testing', isHighYield: true, unitId: 'se-u3' },
              { id: 't58', name: 'Black Box Testing', isHighYield: true, unitId: 'se-u3' },
              { id: 't59', name: 'Unit Testing', isHighYield: false, unitId: 'se-u3' },
              { id: 't60', name: 'Integration Testing', isHighYield: false, unitId: 'se-u3' },
            ],
          },
        ],
      },
      {
        id: 'cn',
        name: 'Computer Networks',
        semesterId: 'sem4',
        units: [
          {
            id: 'cn-u1',
            name: 'Network Models',
            subjectId: 'cn',
            topics: [
              { id: 't61', name: 'OSI Model', isHighYield: true, unitId: 'cn-u1' },
              { id: 't62', name: 'TCP/IP Model', isHighYield: true, unitId: 'cn-u1' },
              { id: 't63', name: 'Layers Comparison', isHighYield: false, unitId: 'cn-u1' },
              { id: 't64', name: 'Network Topologies', isHighYield: false, unitId: 'cn-u1' },
            ],
          },
          {
            id: 'cn-u2',
            name: 'IP Addressing',
            subjectId: 'cn',
            topics: [
              { id: 't65', name: 'IPv4 vs IPv6', isHighYield: true, unitId: 'cn-u2' },
              { id: 't66', name: 'Subnetting', isHighYield: true, unitId: 'cn-u2' },
              { id: 't67', name: 'Classless Inter-Domain Routing', isHighYield: false, unitId: 'cn-u2' },
              { id: 't68', name: 'Network Masks', isHighYield: false, unitId: 'cn-u2' },
            ],
          },
          {
            id: 'cn-u3',
            name: 'Network Protocols',
            subjectId: 'cn',
            topics: [
              { id: 't69', name: 'HTTP/HTTPS', isHighYield: true, unitId: 'cn-u3' },
              { id: 't70', name: 'DNS', isHighYield: true, unitId: 'cn-u3' },
              { id: 't71', name: 'DHCP', isHighYield: false, unitId: 'cn-u3' },
              { id: 't72', name: 'FTP', isHighYield: false, unitId: 'cn-u3' },
            ],
          },
        ],
      },
    ],
  },
];
