import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const FALLBACK_SYLLABUS = [
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const semester = searchParams.get('semester');

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'cursus');

    // Fetch ALL records from syllabus, don't filter by semester yet
    const syllabus = await db.collection('syllabus').find({}).toArray();

    if (syllabus.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(syllabus);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, subject_name, units, ...rest } = body;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'cursus');
    
    console.log('Using database:', db.databaseName);
    console.log('Subject Name:', subject_name);

    const result = await db.collection('syllabus').updateOne(
      { subject_name },
      { $set: { units, ...rest } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
