import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; // Add this
import jwt from 'jsonwebtoken'; // Add this


const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique:true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique
  },
  password: {
    type: String,
    required: true,
  },
  links: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
    },
  ],
    // required: false,
}, {
  timestamps: true ,// Adds createdAt and updatedAt to User document
    // required: false,

});


// Method to hash the password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
//mehod to compare passwrods
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // 'this.password' refers to the hashed password of the user instance
  return await bcrypt.compare(candidatePassword, this.password);
};
// Method to generate the JWT token
UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET, // Ensure you have a JWT_SECRET in your environment variables
  { expiresIn: '1h' } // Token valid for 24 hours
  );
  return token;
};



export default mongoose.model('User', UserSchema);
