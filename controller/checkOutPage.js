const Cartdb = require("../model/cartmodel");
const userdb = require("../model/usermodel");
const productdb = require("../model/pdtmodel");
const orderdb = require("../model/order");
require("dotenv").config();

const Razorpay = require("razorpay");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpay = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
});





const success = async (req, res) => {
    try {
        const userId = req.session.userid;
        console.log("i'm in thee sussec");
        const { razorpayOrderId, paymentResponse,mongodbOrderIds } = req.body;






        const mongoDBOrder = await orderdb.findOne({ onlinePaymentStatus: 'intiated', '_id': mongodbOrderIds });

        if (!mongoDBOrder) {
            console.error('MongoDB Order not found for Razorpay order ID:', razorpayOrderId);
            return res.status(404).send({ success: false, msg: 'Order not found' });
        }

        // Update the onlinePaymentStatus to "success"
        mongoDBOrder.onlinePaymentStatus = "success";
        mongoDBOrder.onlineTransactionId = razorpayOrderId;
        await mongoDBOrder.save();

        const cart = await Cartdb.findOne({ user: userId }).populate({
            path: "products.productId",
            model: "Product",
        });

        await Cartdb.findOneAndDelete({ user:userId });

        for (let i = 0; i < cart.products.length; i++) {
            const productId = cart.products[i].productId;
            const count = cart.products[i].quantity;

            let att = await productdb.updateOne(
                {
                    _id: productId,
                },
                {
                    $inc: {
                        stockQuantity: -count,
                    },
                }
            );
            console.log("a", att);
        }

        // res.redirect("/profile?tab=orders");

        // Add any additional logic or response handling here

        res.status(200).send({ success: true, msg: 'Payment success' });
    } catch (error) {
        console.error('Error in Razorpay success callback:', error);
        res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
};

const failure = async (req, res) => {
    try {
        console.log("I'm in  failure ");
        const { razorpayOrderId, error, paymentResponse, mongodbOrderIds } = req.body;

        console.log("Razorpay Order ID:", razorpayOrderId);
        console.log("Error Details:", error);
        console.log("MongoDB Order ID:", mongodbOrderIds);

        // Assuming you have received the payment failure response from Razorpay
        // Fetch the corresponding MongoDB order using the Razorpay order ID
        const mongoDBOrder = await orderdb.findOne({ onlinePaymentStatus: 'intiated', '_id': mongodbOrderIds });

        if (!mongoDBOrder) {
            console.error('MongoDB Order not found for Razorpay order ID:', razorpayOrderId);
            return res.status(404).send({ success: false, msg: 'Order not found' });
        }
        mongoDBOrder.onlinePaymentStatus = "Failed";
        mongoDBOrder.onlineTransactionId = razorpayOrderId;
        await mongoDBOrder.save();

        // Add any additional logic related to handling payment failure
        // For example, update order status or log the failure details

        res.status(200).send({ success: true, msg: 'Payment failure' });
    } catch (error) {
        console.error('Error in Razorpay failure callback:', error);
        res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
};







const checkOut = async (req, res) => {
    try {
        const { RAZORPAY_ID_KEY } = process.env;
        const paymentOption = req.params.paymentOption;

        if (paymentOption === "online") {

            const addressIndex = req.body.add
            const userId = req.session.userid;
            const userAddr = await userdb.findById(userId);
            const addresses = userAddr.addresses[addressIndex];
            const cart = await Cartdb.findOne({ user: userId }).populate({
                path: "products.productId",
                model: "Product",
            });


            if (!cart) {
                return res.status(404).json({ error: "Cart not found" });
            }

            // Extract relevant information from the cart
            const { user, userEmail, products,subtotal } = cart;

            // Create an order document based on the cart data
            const order = new orderdb({
                user,
                userEmail,
                Products: products.map((product) => ({
                    products: product.productId,
                    name: product.name,
                    price: product.productPrice,
                    quantity: product.quantity,
                    total: product.totalPrice,
                    reason: "none",
                    image: product.image,
                })),
                orderStatus: "placed",
                paymentMode: paymentOption,
                subtotal: subtotal,
                date: new Date(),
                address: addresses,
                onlinePaymentStatus:"intiated",
                onlineTransactionId:"Not Available"
            });

            // Save the order document
            const savedOrder = await order.save();
            const { ObjectId } = require('mongodb');
            const objectId=savedOrder._id;
            const mongodbOrderIdNo = objectId.toHexString();
            // let totalAmt=savedOrder.toat
          

      
            const timestamp = Date.now();
            const receiptId = `${userEmail}_${timestamp}`;
            

            const options = {
                amount: subtotal * 100, // Replace with the actual amount
                currency: "INR",
                receipt: receiptId ,
                payment_capture: 0, // Manual capture of the payment
                notes: {
                    mongodbOrderId: mongodbOrderIdNo, // Pass the MongoDB order ID
                },
            };
            
     
            // Create a Razorpay order
            razorpay.orders.create(options, (err, razorpayOrder) => {
                if (err) {
                    console.error("Error creating Razorpay order:", err);
                    return res.status(500).send({ success: false, msg: "Internal Server Error" });
                }

                // Send the order details to the client
                res.status(200).send({
                    success: true,
                    msg: "Order Created",
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount, // Convert amount back to rupees
                    key_id: RAZORPAY_ID_KEY,
                    product_name: 'Shoe Rack', // Replace with the actual product name
                    description:"Your order for Shoe Rack" , // Replace with the actual product description
                    contact: addresses.phone,
                    name:`${addresses.firstName} ${addresses.lastName}`,
                    email: userAddr.email,
                    mongodbOrderId: options.notes.mongodbOrderId

                });
            });
        } else {
            try {
                const addressIndex = req.body.addressIndex;
                const selectedBillingOption = req.body.billingOption;
                const userId = req.session.userid;
                const userAddr = await userdb.findById(userId);
                const addresses = userAddr.addresses[addressIndex];

                // Find the user's cart items
                const cart = await Cartdb.findOne({ user: userId }).populate({
                    path: "products.productId",
                    model: "Product",
                });

                if (!cart) {
                    return res.status(404).json({ error: "Cart not found" });
                }

                // Extract relevant information from the cart
                const { user, userEmail, products,subtotal } = cart;

                // Create an order document based on the cart data
                const order = new orderdb({
                    user,
                    userEmail,
                    Products: products.map((product) => ({
                        products: product.productId,
                        name: product.name,
                        price: product.productPrice,
                        quantity: product.quantity,
                        total: product.totalPrice,
                        reason: "none",
                        image: product.image,
                    })),
                    orderStatus: "placed",
                    paymentMode: selectedBillingOption,
                      subtotal: subtotal,
                    date: new Date(),
                    address: addresses,
                });

                // Save the order document
                const savedOrder = await order.save();

                // Clear the user's cart after successful checkout
                await Cartdb.findOneAndDelete({ user: savedOrder.user });

                for (let i = 0; i < cart.products.length; i++) {
                    const productId = cart.products[i].productId;
                    const count = cart.products[i].quantity;

                    let att = await productdb.updateOne(
                        {
                            _id: productId,
                        },
                        {
                            $inc: {
                                stockQuantity: -count,
                            },
                        }
                    );
                    console.log("a", att);
                }

                res.redirect("/profile?tab=orders");
            } catch (error) {
                // Handle any errors
                console.error(error);
                res.status(500).json({ error: "Internal server error" });
            }
        }
    } catch (error) {
        console.error("Error in checkOut:", error);
        res.status(500).send({ success: false, msg: "Internal Server Error" });
    }
};




module.exports = {
    checkOut,
    success,
    failure
};
