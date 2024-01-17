const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: true
    },
    streetAddress1: {
        type: String,
        required: true
    },
    streetAddress2: {
        type: String,
        required: false
    },
    townCity: {
        type: String,
        required: true
    },
    stateCounty: {
        type: String,
        required: true
    },
    postcodeZIP: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    }
}, { _id: false });

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,

    },
    is_admin: {
        type: Number,
        required: true,
        default: 0
    },
    otp: {
        type: Boolean,
        required: true,
        default: false
    },
    Status: {
        type: Boolean,
        required: true,
        default: true
    },
    addresses: [addressSchema] // An array of address objects
}, { versionKey: false });

module.exports = mongoose.model('user', userSchema);
