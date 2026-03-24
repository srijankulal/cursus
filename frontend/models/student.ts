import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type RiskLevel = "low" | "medium" | "high";

export interface IStudent extends Document {
  user: Types.ObjectId;
  department: string;
  phone?: string;
  semester: number;
  rollNumber: string;
  aiPlanAvailable: boolean;
  riskLevel: RiskLevel;
  examDate?: Date;
  profileImage?: string;
  isActive: boolean;
  class?: Types.ObjectId;  // Reference to Class
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    user:            { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department:      { type: String, required: true, trim: true },
    phone:           { type: String },
    semester:        { type: Number, required: true, min: 1, max: 6 },
    rollNumber:      { type: String, required: true, unique: true, trim: true },
    // aiPlanAvailable: { type: Boolean, default: false },
    // riskLevel:       { type: String, enum: ["low", "medium", "high"], default: "low" },
    // examDate:        { type: Date },
    profileImage:    { type: String },
    isActive:        { type: Boolean, default: true },
    class:           { type: Schema.Types.ObjectId, ref: "Class" },
    
  },
  { timestamps: true }
);

export const Student: Model<IStudent> =
  (mongoose.models.Student as Model<IStudent>) || mongoose.model<IStudent>("Student", StudentSchema);