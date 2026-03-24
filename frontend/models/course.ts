import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICourse extends Document {
  subject: string;
  semester: number;
  department: string;
  topics: string[];
  totalTopics: number;
  coveredTopics: number;
  coveragePercent: number;
  contentApproved: boolean;
  pendingReview: boolean;
  contentVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 6 },
    department: { type: String, required: true, trim: true },
    topics: { type: [String], default: [] },
    totalTopics: { type: Number, default: 0 },
    coveredTopics: { type: Number, default: 0 },
    coveragePercent: { type: Number, default: 0 },
    contentApproved: { type: Boolean, default: false },
    pendingReview: { type: Boolean, default: false },
    contentVisible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseSchema.index(
  { department: 1, semester: 1, subject: 1 },
  { unique: true, name: 'department_semester_subject_unique' }
);

export const Course: Model<ICourse> =
  (mongoose.models.Course as Model<ICourse>) ||
  mongoose.model<ICourse>('Course', CourseSchema);
