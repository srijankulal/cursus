import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IHod extends Document {
  user: Types.ObjectId;
  department: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HodSchema = new Schema<IHod>(
  {
    user:         { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department:   { type: String, required: true, trim: true },
    profileImage: { type: String },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Hod: Model<IHod> =
  (mongoose.models.Hod as Model<IHod>) || mongoose.model<IHod>("Hod", HodSchema);