import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface ISyllabusProgress extends Document {
  class: Types.ObjectId;
  completedTopics: string[]; // Array of topic strings that have been taught
  createdAt: Date;
  updatedAt: Date;
}

const SyllabusProgressSchema = new mongoose.Schema<ISyllabusProgress>(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, unique: true },
    completedTopics: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const SyllabusProgress: Model<ISyllabusProgress> =
  (mongoose.models.SyllabusProgress as Model<ISyllabusProgress>) ||
  mongoose.model<ISyllabusProgress>("SyllabusProgress", SyllabusProgressSchema);
