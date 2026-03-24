import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type QPNoteType = "question_paper" | "note" | "study_material";

export interface IQPNote extends Document {
  semester: number;
  subject: string;
  url: string;
  type: QPNoteType;
  facultyUploaded: boolean;
  faculty: Types.ObjectId;
  department: string;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QPNoteSchema = new Schema<IQPNote>(
  {
    semester:        { type: Number, required: true, min: 1, max: 6 },
    subject:         { type: String, required: true, trim: true },
    url:             { type: String, required: true },
    type:            { type: String, enum: ["question_paper", "note"], required: true },
    facultyUploaded: { type: Boolean, required: true, default: true },
    faculty:         { type: Schema.Types.ObjectId, ref: "faculty", required: true },
    department:      { type: String, required: true, trim: true },
    isApproved:      { type: Boolean, default: false },
    isVisible:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

QPNoteSchema.index({ semester: 1, subject: 1, type: 1 });

export const QPNote: Model<IQPNote> = mongoose.model<IQPNote>("qp_notes", QPNoteSchema);