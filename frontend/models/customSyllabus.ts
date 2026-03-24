import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface IUnit {
  unit_number: number;
  title: string;
  hours: number;
  topics: string[];
}

export interface ICustomSyllabus extends Document {
  class: Types.ObjectId;
  units: IUnit[];
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new mongoose.Schema<IUnit>(
  {
    unit_number: { type: Number, required: true },
    title: { type: String, required: true },
    hours: { type: Number, required: true },
    topics: { type: [String], required: true },
  },
  { _id: false }
);

const CustomSyllabusSchema = new mongoose.Schema<ICustomSyllabus>(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, unique: true },
    units: { type: [UnitSchema], required: true, default: [] },
  },
  { timestamps: true }
);

export const CustomSyllabus: Model<ICustomSyllabus> =
  (mongoose.models.CustomSyllabus as Model<ICustomSyllabus>) ||
  mongoose.model<ICustomSyllabus>("CustomSyllabus", CustomSyllabusSchema);