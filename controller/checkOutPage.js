const Cartdb = require("../model/cartmodel");
const userdb = require("../model/usermodel");
const productdb = require("../model/pdtmodel");
const orderdb=require("../model/order")
require('dotenv').config()


const Razorpay = require('razorpay');
const {RAZORPAY_ID_KEY,RAZORPAY_SECRET_KEY}=process.env
const razorpay = new Razorpay({
  key_id : RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});



















const checkOut = async (req, res) => {
    const {RAZORPAY_ID_KEY,RAZORPAY_SECRET_KEY}=process.env
    let paymentOption = req.params.paymentOption
    console.log(paymentOption)
    console.log(RAZORPAY_ID_KEY);
if (paymentOption=='online') 
{
    try {
        const selectedBillingOption = req.body.billingOption;
        const addressIndex = req.body.addressIndex;
        // const selectedBillingOption = req.body.billingOption;
        const userId = req.session.userid;
        const userAddr = await userdb.findById(userId);
        const addresses = userAddr.addresses[addressIndex];

const options={
    id:898989,
    amount:100,
    currency:'INR',
    receipt:'abhishekabtr@gmail.com',
    
}
razorpay.orders.create(options,
    (err,order)=>{
        if(!err){
            res.status(200).send({
                success: true,
                msg: 'Order Created',
                orderId: options.id,
                amount: options.amount / 100, // Convert amount back to rupees
                key_id: RAZORPAY_ID_KEY,
                product_name: 'req.body.name',
                description:' req.body.description',
                contact: '8567345632',
                name: 'Sandeep Sharma',
                email: 'sandeep@gmail.com',
              });
        }else
        {
            res.status(400).send({success:false,msg:"something went wrong"})
        }
    })

 




    } catch (error) {
        console.error('Error in checkOut:', error);
        res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
} else 
{
    
    try {
        const addressIndex = req.body.addressIndex;
        const selectedBillingOption = req.body.billingOption;
        const userId = req.session.userid;
        const userAddr = await userdb.findById(userId);
        const addresses = userAddr.addresses[addressIndex];

        // Find the user's cart items
        const cart = await Cartdb.findOne({ user: userId }).populate({
            path: 'products.productId',
            model: 'Product',
        });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Extract relevant information from the cart
        const { user, userEmail, products } = cart;

        // Create an order document based on the cart data
        const order = new orderdb({
            user,
            userEmail,
            Products: products.map(product => ({
                products: product.productId,
                name: product.name,
                price: product.productPrice,
                quantity: product.quantity,
                total: product.totalPrice,
                reason: 'none',
                image: product.image,
            })),
            orderStatus: 'placed',
            paymentMode: selectedBillingOption,
            total: req.body.total,
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

        // if (selectedBillingOption === 'Razor-Online') {
        //     // If the selected payment option is online (Razorpay), initiate Razorpay payment
        //     const orderId = savedOrder._id; // Unique order ID

        //     // You need to implement a function to create a Razorpay order on your server
        //     const razorpayOrder = await createRazorpayOrder(orderId, req.body.total);

        //     // Send the Razorpay order details to the client
        //     return res.json({
        //         message: 'Razorpay order initiated successfully',
        //         orderId,
        //         razorpayOrder,
        //     });
        // }

        // Send a response indicating success for other payment options
        res.redirect('/profile?tab=orders');
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }

}


};

// Function to create a Razorpay order
const createRazorpayOrder = async (orderId, totalAmount) => {
    // Implement the logic to create a Razorpay order on your server
    // Refer to the Razorpay API documentation for details on creating an order
    // Return the necessary details, including order_id, and other relevant information
    // Example: const razorpayOrder = await razorpay.orders.create({ amount: totalAmount, currency: 'INR', receipt: orderId });
    // Return the necessary details for the client-side integration
    // return razorpayOrder;
};



module.exports ={
    checkOut
}