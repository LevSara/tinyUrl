const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    trim: true, // Trim whitespace from the URL
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true, // Ensure short URLs are unique, which is important for a URL shortening service
  }, 
   numOfClicks: {
    type: Number,
    default: 0, // Default to 0 clicks
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
 required: false, 
  },
  source: {
    type: String,
  required: false, // Ensure source is provided
  },
    clicksBySource: {
        type: Map,          // Mongoose 'Map' type is perfect for dynamic keys (like 'email', 'ads', 'social')
        of: Number,         // The values in the map will be numbers (the count for each source)
        default: {},        // Initialize as an empty object/map if no clicks yet
    },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  //to store the source of the link? or to source in the array of sources in the user? or where???
  //maybe like this?
  // Array to store the number of clicks by source
  clicksBySource: [{ source: String, count: Number }]

  // We won't store the shortUrl here, as per your spec.
  // It will be derived from _id.
});

module.exports = mongoose.model('Link', LinkSchema);