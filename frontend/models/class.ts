import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface ICourseAssignment {
  subjectId: string;
  subjectName: string;
  faculty: Types.ObjectId;
}

export interface IClass extends Document {
  department: string;
  name: string;
  semester: number;
  capacity: number;
  classGuide: Types.ObjectId;
  faculties: Types.ObjectId[];
  courseAssignments: ICourseAssignment[];
  students?: Types.ObjectId[];
  hod: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseAssignmentSchema = new mongoose.Schema<ICourseAssignment>(
  {
    subjectId: { type: String, required: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  },
  { _id: false }
);

const ClassSchema = new mongoose.Schema<IClass>(
  {
    department: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 6 },
    capacity: { type: Number, required: true, min: 1 },
    classGuide: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    faculties: { type: [mongoose.Schema.Types.ObjectId], ref: "Faculty", default: [] },
    courseAssignments: { type: [CourseAssignmentSchema], default: [] },
    students: { type: [mongoose.Schema.Types.ObjectId], ref: "Student", default: [] },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: "Hod", required: true },
  },
  { timestamps: true }
);

export const Class: Model<IClass> =
  (mongoose.models.Class as Model<IClass>) || mongoose.model<IClass>("Class", ClassSchema);