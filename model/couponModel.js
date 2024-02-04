const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
    },
    discountAmount: {
        type: Number,
        required: true,
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    minOrderAmount: { type: Number },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
