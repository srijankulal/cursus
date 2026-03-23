import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// 1. Define an interface representing a User document
export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  type: 'admin' | 'customer' | 'guest'; // String literal types for better safety
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Schema corresponding to the interface
const userSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 8 
  },
  type: { 
    type: String, 
    enum: ['admin', 'customer', 'guest'], 
    default: 'customer' 
  }
}, {
  timestamps: true
});

// 3. Password Hashing Middleware
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// 4. Create and export the Model
const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;