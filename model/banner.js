const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
  image: {
    type: String, // Assuming you store the image URL
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create Banner Model
const Banner = mongoose.model('Banner', bannerSchema);

// Export the model
module.exports = Banner;
