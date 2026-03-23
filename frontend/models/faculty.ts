import mongoose, { Document, Schema, Model, Types } from "mongoose";

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
    semester: { type: Number, required: true },
    subject:  { type: String, required: true, trim: true },
  },
  { _id: false }
);

const FacultySchema = new Schema<IFaculty>(
  {
    user:            { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department:      { type: String, required: true, trim: true },
    phone:           { type: String },
    assignedClasses: { type: [AssignedClassSchema], default: [] },
    profileImage:    { type: String },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faculty: Model<IFaculty> =
  (mongoose.models.Faculty as Model<IFaculty>) || mongoose.model<IFaculty>("Faculty", FacultySchema);