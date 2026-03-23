import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Dictionary mapping semesters to their corresponding subjects based on the provided curriculum
export const SEMESTER_SUBJECTS: Record<number, string[]> = {
  1: [
    "Fundamentals of Computers",
    "Programming in C",
    "Mathematical Foundation",
    "Business Statistics",
    "Environmental Studies and Value Education"
  ],
  2: [
    "Data Structures using C",
    "Object Oriented Concepts using JAVA",
    "Discrete Mathematical Structures",
    "Applied Statistics"
  ],
  3: [
    "Data Base Management Systems",
    "C# and DOT NET Framework",
    "Operating System Concepts",
    "Computer Oriented Numerical Analysis",
    "Open Source Tools"
  ],
  4: [
    "Python Programming",
    "Computer Multimedia and Animation",
    "Computer Communication and Networks",
    "Constitution of India and Value Education",
    "Financial Education and Investment Awareness"
  ],
  5: [
    "Design and Analysis of Algorithms",
    "Statistical Computing and R Programming",
    "Software Engineering",
    "Cloud Computing"
  ],
  6: [
    "PHP and MySQL",
    "Advanced Java and J2EE",
    "Artificial Intelligence and Applications",
    "Fundamentals of Data Science",
    "Web Content Management System"
  ]
};

export interface IAssignedClass {
  semester: number;
  subject: string;
}

export interface IFaculty extends Document {
  user: Types.ObjectId;
  department: string;
  phone?: string;
  assignedClasses: IAssignedClass[];
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AssignedClassSchema = new Schema<IAssignedClass>(
  {
    semester: { type: Number, required: true, min: 1, max: 6 },
    subject:  { 
      type: String, 
      required: true, 
      trim: true,
      validate: {
        validator: function (subjectName: string) {
          // 'this' refers to the IAssignedClass subdocument
          const sem = this.semester;
          if (!SEMESTER_SUBJECTS[sem]) return false;
          return SEMESTER_SUBJECTS[sem].includes(subjectName);
        },
        message: (props) => `${props.value} is not a valid subject for the chosen semester.`
      }
    },
  },
  { _id: false }
);

const FacultySchema = new Schema<IFaculty>(
  {
    user:            { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department:      { type: String, required: true, trim: true },
    phone:           { type: String },
    assignedClasses: { type: [AssignedClassSchema], default: [] }, // This holds the subjects the faculty teaches
    profileImage:    { type: String },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faculty: Model<IFaculty> =
  (mongoose.models.Faculty as Model<IFaculty>) || mongoose.model<IFaculty>("Faculty", FacultySchema);