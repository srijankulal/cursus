import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface ITopic {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  isCovered: boolean;
  coveredDate?: Date;
  isSelfStudied: boolean;
  order: number;
}

export interface ISyllabus extends Document {
  subject: string;
  semester: number;
  department: string;
  faculty: Types.ObjectId;
  topics: ITopic[];
  totalTopics: number;
  coveredTopics: number;
  coveragePercent: number;
  contentApproved: boolean;
  pendingReview: boolean;
  contentVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>({
  title:         { type: String, required: true, trim: true },
  description:   { type: String },
  isCovered:     { type: Boolean, default: false },
  coveredDate:   { type: Date },
  isSelfStudied: { type: Boolean, default: false },
  order:         { type: Number, required: true },
});

const SyllabusSchema = new Schema<ISyllabus>(
  {
    subject:         { type: String, required: true, trim: true },
    semester:        { type: Number, required: true, min: 1, max: 6 },
    department:      { type: String, required: true, trim: true },
    faculty:         { type: Schema.Types.ObjectId, ref: "faculty", required: true },
    topics:          { type: [TopicSchema], default: [] },
    totalTopics:     { type: Number, default: 0 },
    coveredTopics:   { type: Number, default: 0 },
    coveragePercent: { type: Number, default: 0, min: 0, max: 100 },
    contentApproved: { type: Boolean, default: false },
    pendingReview:   { type: Boolean, default: false },
    contentVisible:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

SyllabusSchema.pre("save", function (next) {
  this.totalTopics     = this.topics.length;
  this.coveredTopics   = this.topics.filter((t) => t.isCovered).length;
  this.coveragePercent = this.totalTopics > 0
    ? Math.round((this.coveredTopics / this.totalTopics) * 100)
    : 0;
  next();
});

export const Syllabus: Model<ISyllabus> = mongoose.model<ISyllabus>("syllabus", SyllabusSchema);