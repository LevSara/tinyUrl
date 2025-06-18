const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
      ref: 'Link', // Reference to the Link model
    },
  ],
  //how to create the db of link+source+clicks?
  arrOfSourceAndClicks: {
    type: Array,
    default: [], // Default to an empty array
  },
});

// Method to hash the password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to generate the JWT token
UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id },
    proccess.env.JWT_SECRET, // Ensure you have a JWT_SECRET in your environment variables
    { expirtesIn: '1h' } // Token valid for 24 hours
  );
  return token;
};


module.exports = mongoose.model('User', UserSchema);