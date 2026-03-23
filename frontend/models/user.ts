import { Schema, model, models, type Model, type Document } from 'mongoose';

import { USER_ROLES, type UserRole } from '@/lib/auth/users';

export interface IUser extends Document {
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1, role: 1 }, { unique: true, name: 'email_role_unique' });

userSchema.virtual('hodProfile', {
  ref: 'Hod',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.virtual('facultyProfile', {
  ref: 'Faculty',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.virtual('studentProfile', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema);

export default User;