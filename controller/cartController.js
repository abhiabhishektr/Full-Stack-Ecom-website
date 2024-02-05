const Cartdb = require("../model/cartmodel");
const userdb = require("../model/usermodel");
const productdb = require("../model/pdtmodel");
const orderdb = require("../model/order");
const WalletModel = require("../model/wallet");

const cart = async (req, res) => {
    let idd = req.session.userid;

    if (!idd) {
        res.redirect("/login?loginMessage=Please Sign In first.");
    } else {
        try {
            const cartData = await Cartdb.findOne({ user: idd }).populate({
                path: "products.productId",
                model: "Product", // Make sure it matches the model name for the Product
            });
            const productQuantities = [];
            // Assuming there is a specific product index (e.g., index 1) you want to get the quantity from
            cartData.products.forEach((product, index) => {
                const qty = product.productId.stockQuantity;
                productQuantities.push(qty);
            });

            res.render("cart", { cartData,productQuantities, cartCount: req.cartCount});
        } catch (error) {
            console.error("Error fetching cart data:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};



const updatecart = async (req, res) => {
    if (!req.session.userid) {
        res.json({ status: "error", message: "Please log in first." });
    } else {
        let idd = req.session.userid;
        let email = req.session.user;

        let productid = req.params.id;
        let exist = await Cartdb.findOne({ user: idd });
        let product = await productdb.findById(productid);
        try {
            if (!exist) {
                const newcart = new Cartdb({
                    user: idd,
                    userEmail: email,
                    products: [
                        {
                            productId: product._id,
                            name: product.name,
                            quantity: 1,
                            productPrice: product.price,
                            totalPrice: product.price * 1,
                            image: product.imageUrls[0],
                        },
                    ],
                    subtotal: product.price,
                });
                await newcart.save();
                res.json({ status: "success", message: "Product added to cart." });
            } else {
                const existingProduct = exist.products.find((item) => item.productId.equals(product._id));

                if (existingProduct) {
                    res.json({ status: "error", message: "Product already in the cart." });
                } else {
                    exist.products.push({
                        productId: product._id,
                        name: product.name,
                        quantity: 1,
                        productPrice: product.price,
                        totalPrice: product.price * 1,
                        image: product.imageUrls[0],
                    });

                    // Recalculate the subtotal based on the updated products
                    exist.subtotal = exist.products.reduce((total, product) => {
                        return total + product.totalPrice;
                    }, 0);
                    await exist.save();
                    res.json({ status: "success", message: "Product added to cart." });
                }
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: "error", message: "Internal Server Error" });
        }
    }
};

const updateCartDetails = async (req, res) => {
    try {
        const { cartId, productId, quantity } = req.body;
        const id = req.session.userid;

        const existingCart = await Cartdb.findById(cartId);

        if (!existingCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const productToUpdate = existingCart.products.find((p) => p.productId.equals(productId));

        if (!productToUpdate) {
            return res.status(404).json({ success: false, message: "Product not found in the cart" });
        }

        productToUpdate.quantity = quantity;
        productToUpdate.totalPrice = quantity * productToUpdate.productPrice;

        const updatedCart = await existingCart.save();
        const updatedTotalPrice = productToUpdate.totalPrice;
        const totalPriceTotal = existingCart.products.reduce((total, product) => {
            return total + product.totalPrice;
        }, 0);
        existingCart.subtotal = totalPriceTotal;

        await existingCart.save();

        res.json({
            success: true,
            message: "Quantity updated successfully",
            updatedTotalPrice,
            totalPriceTotal,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const paymentmethod = async (req, res) => {
    try {
        const userId = req.session.userid;
        const user = await userdb.findById(userId);
        let walletBalance = 0;  // Declare walletBalance here with a default value

        if (user) {
            const userWallet = await WalletModel.findOne({ userId: userId });

            if (userWallet) {
                walletBalance = userWallet.balance;
            }

            const addresses = user.addresses || [];

            const cart = await Cartdb.findOne({ user: userId }).populate({
                path: "products.productId",
                model: "Product", // Make sure it matches the model name for the Product
            });

            if (cart) {
                res.render("paymentmethod", { addresses, cart, walletBalance });
            } else {
                res.redirect("/");
            }
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error in paymentmethod:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// const addAddress = async (req, res) => {
//     if (!req.session.userid) {
//         return res.send('<script>alert("Please log in first."); window.location="/login?loginMessage=Please Sign In first.";</script>');
//     } else {
//         try {
//             const fromprofile = req.params.id;
//             const userId = req.session.userid;
//             const addressData = {
//                 firstName: req.body.firstName,
//                 lastName: req.body.lastName,
//                 companyName: req.body.companyName,
//                 country: req.body.country,
//                 streetAddress1: req.body.streetAddress1,
//                 streetAddress2: req.body.streetAddress2,
//                 townCity: req.body.townCity,
//                 stateCounty: req.body.stateCounty,
//                 postcodeZIP: req.body.postcodeZIP,
//                 phone: req.body.phone,
//             };

//             const user = await userdb.findById(userId);

//             if (!user) {
//                 return res.status(404).json({ message: 'User not found' });
//             }

//             console.log("Before pushing new address:", user);

//             console.log("After pushing new address:", user);

//             await user.save(); // Wait for the save operation to complete

//             const selectedTab = 'address';

//             if (fromprofile == 1) {
//                 res.redirect(`/profile?tab=${selectedTab}`);
//                 // res.redirect('/profile');

//             } else {
//                 res.redirect('/paymentmethod');
//             }
//         } catch (error) {
//             console.error('Error adding address:', error);
//             res.status(500).json({ message: 'Internal server error' });
//         }
//     }
// };
const addAddress = async (req, res) => {
    if (!req.session.userid) {
        return res.send(
            '<script>alert("Please log in first."); window.location="/login?loginMessage=Please Sign In first.";</script>'
        );
    } else {
        try {
            const fromProfile = req.params.id;
            const userId = req.session.userid;
            const addressData = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                companyName: req.body.companyName,
                country: req.body.country,
                streetAddress1: req.body.streetAddress1,
                streetAddress2: req.body.streetAddress2,
                townCity: req.body.townCity,
                stateCounty: req.body.stateCounty,
                postcodeZIP: req.body.postcodeZIP,
                phone: req.body.phone,
            };

            const updateQuery = {
                $push: { addresses: addressData },
            };

            // Update the user document to push the new address into the addresses array
            const updatedUser = await userdb.findByIdAndUpdate(userId, updateQuery, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const selectedTab = "address";

            if (fromProfile == 1) {
                res.redirect(`/profile?tab=${selectedTab}`);
            } else {
                res.redirect("/paymentmethod");
            }
        } catch (error) {
            console.error("Error adding address:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

//     const selectedBillingOption = req.body.billingOption;
//     console.log(req.body);
//     console.log('Selected Billing Option:', selectedBillingOption);
//  const address=req.query.addressIndex

// res.redirect('/cart')

// const checkOut= async (req,res)=>{

//     try {

//         const addressIndex=req.body.addressIndex
//         const selectedBillingOption = req.body.billingOption;
//         // console.log(addressIndex);
//         const userId = req.session.userid;
//         const userAddr = await userdb.findById(userId);
//     const addresses=userAddr.addresses[addressIndex]

//         // Find the user's cart items
//         const cart = await Cartdb.findOne({ user: userId }).populate({
//             path: 'products.productId',
//             model: 'Product', // Make sure it matches the model name for the Product
//         });

//         if (!cart) {
//             return res.status(404).json({ error: 'Cart not found' });
//         }

//         // Extract relevant information from the cart
//         const { user, userEmail, products } = cart;

//         // Create an order document based on the cart data
//         const order = new orderdb({
//             user,
//             userEmail,
//             Products: products.map(product => ({
//                 products: product.productId,
//                 name: product.name,
//                 price: product.productPrice,
//                 quantity: product.quantity,
//                 total: product.totalPrice,
//                 reason: 'none', // You might need to modify this based on your requirements
//                 image: product.image,
//             })),
//             orderStatus: 'placed', // Assuming the order is initially placed
//             paymentMode:selectedBillingOption , // Assuming paymentMode is passed in the request body
//             total: req.body.total, // Assuming total is passed in the request body
//             date: new Date(),
//             address: addresses, // Assuming address is passed in the request body
//         });

//         // Save the order document
//         const savedOrder = await order.save();

//         // Clear the user's cart after successful checkout
//         await Cartdb.findOneAndDelete({ user: savedOrder.user });

//         for (let i = 0; i < cart.products.length; i++) {
//             const productId = cart.products[i].productId;
//             const count = cart.products[i].quantity;

//            let att = await productdb.updateOne({
//                 _id: productId
//             }, {
//                 $inc: {
//                     stockQuantity: -count
//                 }
//             });
//             console.log("a",att);
//         }

//         // Send a response indicating success
//         res.redirect('/profile?tab=orders')

//         // res.status(200).json({ message: 'Order placed successfully', order: savedOrder });

//     } catch (error) {
//         // Handle any errors
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }

// }

// const checkOut = async (req, res) => {
//     try {
//         const addressIndex = req.body.addressIndex;
//         const selectedBillingOption = req.body.billingOption;
//         const userId = req.session.userid;
//         const userAddr = await userdb.findById(userId);
//         const addresses = userAddr.addresses[addressIndex];

//         // Find the user's cart items
//         const cart = await Cartdb.findOne({ user: userId }).populate({
//             path: 'products.productId',
//             model: 'Product',
//         });

//         if (!cart) {
//             return res.status(404).json({ error: 'Cart not found' });
//         }

//         // Extract relevant information from the cart
//         const { user, userEmail, products } = cart;

//         // Create an order document based on the cart data
//         const order = new orderdb({
//             user,
//             userEmail,
//             Products: products.map(product => ({
//                 products: product.productId,
//                 name: product.name,
//                 price: product.productPrice,
//                 quantity: product.quantity,
//                 total: product.totalPrice,
//                 reason: 'none',
//                 image: product.image,
//             })),
//             orderStatus: 'placed',
//             paymentMode: selectedBillingOption,
//             total: req.body.total,
//             date: new Date(),
//             address: addresses,
//         });

//         // Save the order document
//         const savedOrder = await order.save();

//         // Clear the user's cart after successful checkout
//         await Cartdb.findOneAndDelete({ user: savedOrder.user });

//         for (let i = 0; i < cart.products.length; i++) {
//             const productId = cart.products[i].productId;
//             const count = cart.products[i].quantity;

//             let att = await productdb.updateOne(
//                 {
//                     _id: productId,
//                 },
//                 {
//                     $inc: {
//                         stockQuantity: -count,
//                     },
//                 }
//             );
//             console.log("a", att);
//         }

//         if (selectedBillingOption === 'Razor-Online') {
//             // If the selected payment option is online (Razorpay), initiate Razorpay payment
//             const orderId = savedOrder._id; // Unique order ID

//             // You need to implement a function to create a Razorpay order on your server
//             const razorpayOrder = await createRazorpayOrder(orderId, req.body.total);

//             // Send the Razorpay order details to the client
//             return res.json({
//                 message: 'Razorpay order initiated successfully',
//                 orderId,
//                 razorpayOrder,
//             });
//         }

//         // Send a response indicating success for other payment options
//         res.redirect('/profile?tab=orders');
//     } catch (error) {
//         // Handle any errors
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

// // Function to create a Razorpay order
// const createRazorpayOrder = async (orderId, totalAmount) => {
//     // Implement the logic to create a Razorpay order on your server
//     // Refer to the Razorpay API documentation for details on creating an order
//     // Return the necessary details, including order_id, and other relevant information
//     // Example: const razorpayOrder = await razorpay.orders.create({ amount: totalAmount, currency: 'INR', receipt: orderId });
//     // Return the necessary details for the client-side integration
//     // return razorpayOrder;
// };

// const cartItemRemove = async (req, res) => {
//     const productIdToRemove = req.params.productId;
//     const userId = req.session.userid;

//     if (!userId) {
//         return res.status(401).json({ success: false, message: 'User not authenticated.' });
//     }

//     try {
//         // Find the user's cart
//         const userCart = await Cartdb.findOne({ user: userId });

//         if (!userCart) {
//             return res.status(404).json({ success: false, message: 'User does not have a cart.' });
//         }

//         // Find the index of the product to remove
//         const productIndex = userCart.products.findIndex(product => product.productId.toString() === productIdToRemove);

//         if (productIndex === -1) {
//             return res.status(404).json({ success: false, message: 'Product not found in the cart.' });
//         }

//         // Remove the product from the cart
//         userCart.products.splice(productIndex, 1);

//         // Save the updated cart
//         await userCart.save();

//         return res.json({ success: true, message: 'Product removed from the cart.' });
//     } catch (error) {
//         console.error('Error:', error);
//         return res.status(500).json({ success: false, message: 'Internal server error.' });
//     }
// };
const cartItemRemove = async (req, res) => {
    const productIdToRemove = req.params.productId;
    const userId = req.session.userid;

    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    try {
        // Find the user's cart
        const userCart = await Cartdb.findOne({ user: userId });

        if (!userCart) {
            return res.status(404).json({ success: false, message: "User does not have a cart." });
        }

        // Find the index of the product to remove
        const productIndex = userCart.products.findIndex((product) => product.productId.toString() === productIdToRemove);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in the cart." });
        }

        // Get the removed product's total price
        const removedProductTotalPrice = userCart.products[productIndex].totalPrice;

        // Remove the product from the cart
        userCart.products.splice(productIndex, 1);

        // Recalculate the subtotal
        userCart.subtotal -= removedProductTotalPrice;

        // Save the updated cart
        await userCart.save();

        return res.json({ success: true, message: "Product removed from the cart.", subtotal: userCart.subtotal });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    cart,
    updatecart, // add to cart
    updateCartDetails,
    paymentmethod,
    addAddress,
    // checkOut,
    cartItemRemove,
};
