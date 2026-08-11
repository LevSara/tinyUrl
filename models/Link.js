import mongoose from 'mongoose';

const sourceClickSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    clicks: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const linkSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, trim: true, required: true, maxlength: 2048 },
    shortUrl: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clicks: { type: Number, default: 0, min: 0 },
    sources: { type: [sourceClickSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Link', linkSchema);
