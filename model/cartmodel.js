const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    userEmail: {
        type: String,  // Assuming the user's email is stored as a string
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            },
            productPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                default: 0
            },
            status: {
                type: String,
                default: "placed"
            },
            cancellationReason: {
                type: String,
                default: "none"
            },
            image: {
                type: String
            }
        },
    ]
});

const Cart = mongoose.model('cart', cartSchema);
module.exports = Cart;
