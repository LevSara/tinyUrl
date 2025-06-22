import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    trim: true,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },
  numOfClicks: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },

  clicksBySource: {
    type: Map,
    of: Number,
    default: () => new Map(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

export default mongoose.model('Link', LinkSchema);