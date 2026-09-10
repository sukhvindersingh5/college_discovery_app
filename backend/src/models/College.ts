import mongoose, { Schema, Document } from 'mongoose';

export interface ICollege extends Document {
  id: number;
  name: string;
  location: string;
  state: string;
  type: string;
  category: string;
  fees_per_year: number;
  total_fees: number;
  rating: number;
  ranking_nirf: number | null;
  established: number;
  courses: string[];
  placement_avg_lpa: number | null;
  placement_highest_lpa: number | null;
  placement_percent: number | null;
  image_url: string | null;
  description: string | null;
  website: string | null;
  created_at: Date;
}

const CollegeSchema = new Schema<ICollege>({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: { type: String, default: '' },
  state: { type: String, default: '' },
  type: { type: String, default: '' },
  category: { type: String, default: '' },
  fees_per_year: { type: Number, default: 0 },
  total_fees: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ranking_nirf: { type: Number, default: null },
  established: { type: Number, default: 0 },
  courses: { type: [String], default: [] },
  placement_avg_lpa: { type: Number, default: null },
  placement_highest_lpa: { type: Number, default: null },
  placement_percent: { type: Number, default: null },
  image_url: { type: String, default: null },
  description: { type: String, default: null },
  website: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

export const College = mongoose.model<ICollege>('College', CollegeSchema);
