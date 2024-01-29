

const mongoose = require('mongoose');

const ordersSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    Products: [{
        products: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',

        },
        name: {
            type: String,

        },
        price: {
            type: Number,

        },
        quantity: {
            type: Number,

        },
        total: {
            type: Number,

        },

        reason:{
            type: String,
            //  default:"N/A",
            // required: true,
           
        },
        image:{
            type:String
        }
    }],
    orderStatus: {
        type: String,
        default: 'placed',
        enum: ['placed', 'shipped', 'delivered', 'request return', 'returned', 'requested cancellation', 'cancelled']
    },
    paymentMode: {
        type: String,

    },
    subtotal: {
        type: Number
    },
    date: {
        type: Date
    },
    address: {
        type: Object
    },
    onlinePaymentStatus:{
        type: String,
    },onlineTransactionId:{
        type: String,
    }

}, { versionKey: false });

module.exports = mongoose.model('orders', ordersSchema);