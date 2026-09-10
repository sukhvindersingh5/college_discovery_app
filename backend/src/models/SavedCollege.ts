import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedCollege extends Document {
  user_id: number;
  college_id: number;
  created_at: Date;
}

const SavedCollegeSchema = new Schema<ISavedCollege>({
  user_id: { type: Number, required: true },
  college_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

// Enforce uniqueness — same as "onConflict: 'user_id,college_id'"
SavedCollegeSchema.index({ user_id: 1, college_id: 1 }, { unique: true });

export const SavedCollege = mongoose.model<ISavedCollege>('SavedCollege', SavedCollegeSchema);
