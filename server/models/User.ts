import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'team';
  preferredTrack?: 'HLD' | 'LLD' | null;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
  preferredTrack: { type: String, enum: ['HLD', 'LLD'], default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);

