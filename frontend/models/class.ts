
import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface ICourseAssignment {
  subjectId: string;
  subjectName: string;
  faculty: Types.ObjectId;
}

export interface IClass extends Document {
  department: string;
  name: string;                    // e.g., "BCA 2023-A"
  semester: number;
  capacity: number;
  classGuide: Types.ObjectId;      // Single faculty (class guide)
  faculties: Types.ObjectId[];     // Multiple faculties teaching the class
  courseAssignments: ICourseAssignment[];
  students?: Types.ObjectId[];     // Multiple students enrolled
  hod: Types.ObjectId;             // HOD who created the class
  createdAt: Date;
  updatedAt: Date;
}

const CourseAssignmentSchema = new Schema<ICourseAssignment>(
  {
    subjectId: { type: String, required: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    faculty: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
  },
  { _id: false }
);

const ClassSchema = new Schema<IClass>(
  {
    department: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 6 },
    capacity: { type: Number, required: true, min: 1 },
    classGuide: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    faculties: { type: [Schema.Types.ObjectId], ref: "Faculty", default: [] },
    courseAssignments: { type: [CourseAssignmentSchema], default: [] },
    students: { type: [Schema.Types.ObjectId], ref: "Student", default: [] },
    hod: { type: Schema.Types.ObjectId, ref: "Hod", required: true },
  },
  { timestamps: true }
);

export const Class: Model<IClass> =
  (mongoose.models.Class as Model<IClass>) || mongoose.model<IClass>("Class", ClassSchema);
