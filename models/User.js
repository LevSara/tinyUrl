import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    links: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Link' }],
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function generateAuthToken() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export default mongoose.model('User', userSchema);
