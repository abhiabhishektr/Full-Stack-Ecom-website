  const mongoose = require("mongoose");

  const productSchema = mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: "Active",
    },
    category: {
      type: String,
    },
    manufacturer: {
      type: String,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
  imageUrls  : [{
      type: String,
    }],
    size: {
      type: String, // You can change this to an array if a product can have multiple sizes
    },
    productDeleted: {
      type: String,
    },
  }, { versionKey: false });

  module.exports = mongoose.model('Product', productSchema);
