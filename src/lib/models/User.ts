import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser {
  email: string;
  password?: string; // Optional if we implement OAuth providers later
  role: 'admin' | 'customer';
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: function() {
        // Password is required for credential-based logins
        return true;
      }
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);

export default User;
