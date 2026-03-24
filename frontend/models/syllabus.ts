export interface Topic {
  id: string;
  name: string;
  isHighYield: boolean;
  unitId: string;
}

export interface Unit {
  id: string;
  unit_number: number;
  title: string;
  hours: number;
  content: string; // The raw content string from the JSON
  topics: Topic[]; // Derived from parsing content by ". "
  subjectId: string;
}

export interface Subject {
  id: string; // subject_code
  subject_code: string;
  subject_name: string;
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
  id: string; // "sem" + semesterNumber
  semesterNumber: number;
  name: string;
  subjects: Subject[];
}

const today = new Date();
export const EXAM_DATE_DEFAULT = new Date(today);
EXAM_DATE_DEFAULT.setDate(today.getDate() + 30);

/**
 * Helper to parse the content string into individual topics
 */
function parseTopics(content: string, unitId: string): Topic[] {
  // Split by "." and filter out empty strings
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

const rawData = [
  {
    "semester": 6,
    "subject_code": "G601DC2.6",
    "subject_name": "J2EE and Enterprise Java",
    "type": "DSC",
    "credits": 3,
    "total_hours": 48,
    "exam_marks": 60,
    "cie_marks": 40,
    "total_marks": 100,
    "units": [
      {
        "unit_number": 1,
        "title": "Introducing J2EE",
        "hours": 12,
        "content": "Need for Enterprise Computing. The J2EE Advantage: Platform Independence, Managed Objects, Reusability, Modularity. Enterprise Architecture Types: Single-Tier Systems, 2-Tier Architecture, 3-Tier Architecture, n-Tier Architecture, Architecture of J2EE. Introducing J2EE Runtime and J2EE APIs. Types of J2EE Technologies: Introducing J2EE Components, Containers and Connectors. Introducing J2EE Service Technologies, Introducing J2EE Communication Technologies."
      },
      {
        "unit_number": 2,
        "title": "Java DataBase Connectivity (JDBC)",
        "hours": 12,
        "content": "Getting Started with JDBC: Introducing JDBC, JDBC Components, JDBC Features, JDBC Architecture, Types of JDBC Drivers. Working with JDBC API: Major Classes and Interfaces, Communication with Databases using JDBC APIs. Implementing JDBC Statements and ResultSets: JDBC Statements, Working with Statement, Methods of Statement Class, Working with PreparedStatement Interface, Comparing Statement and PreparedStatement Objects, Describing setters of PreparedStatement, Advantages and Disadvantages of PreparedStatement, Using PreparedStatement, Working with ResultSet Interface, Using ResultSet."
      },
      {
        "unit_number": 3,
        "title": "Java Servlets",
        "hours": 12,
        "content": "Introduction to Java Servlets, Benefits of Using a Java Servlet, A Simple Java Servlet, Anatomy of a Java Servlet, Deployment Descriptor, Reading Data from a Client, Reading HTTP Request Headers, Sending Data to a Client and Writing the HTTP Response Header, Working with Cookies, Tracking Sessions."
      },
      {
        "unit_number": 4,
        "title": "Java Server Pages (JSP)",
        "hours": 12,
        "content": "Introduction to JSP: Understanding JSP, Advantages of JSP over Servlets, the JSP Architecture, JSP Life Cycle, Creating Simple JSP Page. Working with JSP Basic Tags and Implicit Objects: Scripting Tags, Implicit Objects, Directive Tags. Working with JavaBeans and Action Tags: JavaBean, Advantages of Using Beans, Action Tags."
      }
    ]
  },
  {
    "semester": 6,
    "subject_code": "G601DC1.6",
    "subject_name": "PHP and MySQL",
    "type": "DSC",
    "credits": 3,
    "total_hours": 42,
    "exam_marks": 60,
    "cie_marks": 40,
    "total_marks": 100,
    "units": [
      {
        "unit_number": 1,
        "title": "Introduction to PHP",
        "hours": 10,
        "content": "Overview of PHP: History and Features of PHP, PHP Installation and Configuration, Basic PHP Syntax, PHP Tags, Comments, Variables, Data Types, Constants. Operators: Arithmetic, Comparison, Logical, String, Assignment Operators. Control Structures: if, if-else, if-elseif-else, switch. Loops: while, do-while, for, foreach. Arrays: Indexed Arrays, Associative Arrays, Multidimensional Arrays, Array Functions."
      },
      {
        "unit_number": 2,
        "title": "PHP Functions, Forms and File Handling",
        "hours": 10,
        "content": "Functions: Defining and Calling Functions, Function Arguments, Return Values, Variable Scope (local, global, static), Built-in String Functions, Math Functions, Date and Time Functions. Forms: HTML Forms with PHP, GET and POST Methods, Form Validation, Sanitizing User Input. File Handling: Opening and Closing Files, Reading and Writing Files, File Upload, Directory Functions. Sessions and Cookies: Creating and Destroying Sessions, Setting and Reading Cookies."
      },
      {
        "unit_number": 3,
        "title": "Object Oriented PHP and MySQL Basics",
        "hours": 10,
        "content": "OOP in PHP: Classes and Objects, Constructors and Destructors, Access Modifiers (public, private, protected), Inheritance, Method Overriding, Interfaces, Abstract Classes, Static Methods and Properties. Introduction to MySQL: Database Concepts, MySQL Data Types, Creating and Dropping Databases and Tables, INSERT, SELECT, UPDATE, DELETE Statements, WHERE Clause, ORDER BY, GROUP BY, HAVING, Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)."
      },
      {
        "unit_number": 4,
        "title": "PHP and MySQL Integration",
        "hours": 12,
        "content": "Connecting PHP to MySQL: Using MySQLi (Procedural and OOP style) and PDO. CRUD Operations: Inserting, Fetching, Updating and Deleting Records through PHP. Prepared Statements: Using Prepared Statements with MySQLi and PDO for Secure Queries. Error Handling in Database Operations. Building a Simple Web Application: Registration and Login System, Displaying Records in Tables, Search and Filter Functionality. Introduction to AJAX with PHP for Dynamic Content."
      }
    ]
  },
  {
    "semester": 6,
    "subject_code": "G601DE1.6",
    "subject_name": "Fundamentals of Data Science",
    "type": "DSE",
    "credits": 3,
    "total_hours": 42,
    "exam_marks": 60,
    "cie_marks": 40,
    "total_marks": 100,
    "units": [
      {
        "unit_number": 1,
        "title": "Introduction to Data Science",
        "hours": 10,
        "content": "What is Data Science: Definition, Importance, Applications of Data Science across domains (Healthcare, Finance, Retail, Social Media). Data Science Lifecycle: Problem Definition, Data Collection, Data Cleaning, Exploratory Analysis, Modeling, Deployment. Types of Data: Structured, Unstructured, Semi-structured. Data Sources: Databases, APIs, Web Scraping, Flat files. Introduction to Python for Data Science: NumPy Arrays, Array Operations, Indexing, Slicing. Introduction to Pandas: Series, DataFrames, Reading CSV and Excel files, Basic DataFrame operations."
      },
      {
        "unit_number": 2,
        "title": "Data Wrangling and Exploratory Data Analysis",
        "hours": 10,
        "content": "Data Wrangling: Handling Missing Values (dropna, fillna), Removing Duplicates, Data Type Conversion, Renaming Columns, Filtering and Selecting Data. Data Transformation: Normalization, Standardization, Encoding Categorical Variables (Label Encoding, One-Hot Encoding). Exploratory Data Analysis (EDA): Descriptive Statistics (mean, median, mode, variance, standard deviation), Distribution Analysis, Correlation, Covariance. Data Visualization: Matplotlib and Seaborn — Bar charts, Histograms, Box plots, Scatter plots, Heatmaps, Pair plots."
      },
      {
        "unit_number": 3,
        "title": "Introduction to Machine Learning",
        "hours": 12,
        "content": "Machine Learning Overview: Types of Machine Learning — Supervised, Unsupervised, Reinforcement Learning. Supervised Learning Algorithms: Linear Regression (Simple and Multiple), Logistic Regression, Decision Trees, K-Nearest Neighbors (KNN). Model Evaluation: Train-Test Split, Cross Validation, Confusion Matrix, Accuracy, Precision, Recall, F1-Score, Mean Squared Error (MSE), R-Squared. Unsupervised Learning: K-Means Clustering, Hierarchical Clustering, Cluster Evaluation. Introduction to scikit-learn: Loading datasets, Preprocessing, Fitting models, Prediction."
      },
      {
        "unit_number": 4,
        "title": "Data Storage, Big Data and Applications",
        "hours": 10,
        "content": "Data Storage: Relational Databases vs NoSQL Databases, Introduction to MongoDB for Data Science, Querying data with SQL and MongoDB. Big Data Concepts: Definition of Big Data, 5Vs (Volume, Velocity, Variety, Veracity, Value), Introduction to Hadoop Ecosystem (HDFS, MapReduce), Introduction to Apache Spark. Real-World Data Science Applications: Recommendation Systems, Sentiment Analysis, Fraud Detection, Image Classification overview. Data Science Ethics: Data Privacy, Bias in Machine Learning, Responsible AI, GDPR basics."
      }
    ]
  }
];

const semesterMap = new Map();

rawData.forEach(item => {
  const semNum = item.semester;
  if (!semesterMap.has(semNum)) {
    semesterMap.set(semNum, {
      id: "sem" + semNum,
      semesterNumber: semNum,
      name: "Semester " + semNum,
      subjects: []
    });
  }

  const semester = semesterMap.get(semNum);
  const subject = {
    id: item.subject_code,
    subject_code: item.subject_code,
    subject_name: item.subject_name,
    type: item.type,
    credits: item.credits,
    total_hours: item.total_hours,
    exam_marks: item.exam_marks,
    cie_marks: item.cie_marks,
    total_marks: item.total_marks,
    semesterNumber: semNum,
    units: item.units.map(u => {
      const unitId = item.subject_code + "-u" + u.unit_number;
      return {
        id: unitId,
        unit_number: u.unit_number,
        title: u.title,
        hours: u.hours,
        content: u.content,
        subjectId: item.subject_code,
        topics: parseTopics(u.content, unitId)
      };
    })
  };
  semester.subjects.push(subject);
});

export const syllabus = Array.from(semesterMap.values());
