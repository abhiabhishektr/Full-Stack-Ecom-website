const Cartdb = require("../model/cartmodel");
const userdb = require("../model/usermodel");
const productdb = require("../model/pdtmodel");
const orderdb=require("../model/order")

const cart =async (req, res) => {
    let idd = req.session.userid;


if (!idd) {
    res.redirect('/login?loginMessage=Please Sign In first.');
} else {
    
    const cartData = await Cartdb.findOne({ user: idd }).populate({
                    path: "products.productId",
                    model: "Product", // Make sure it matches the model name for the Product
});
    // console.log(cartData);
       res.render("cart",{cartData});
}
 
 
}

// const cart = async (req, res) => {
//     try {
//         let idd = req.session.userid;

//         if (!idd) {
//             return res.redirect('/login?loginMessage=Please Sign In first.');
//         }

//         let cart = await Cartdb.findOne({ user: idd });
        
//         if (!cart) {
//             // Handle the case where the user has an empty cart
//             return res.render("cart", { products: [] });
//         }
//         const cartData = await Cartdb.findOne({ userid: user }).populate({
//             path: "products.productId",
//             model: "Product", // Make sure it matches the model name for the Product
//           });
      

//         res.render("cart", {cartData });
//     } catch (error) {
//         console.error(error);
//         // Handle errors appropriately, e.g., render an error page
//         res.status(500).render('error', { error: 'Internal Server Error' });
//     }
// };


const updatecart = async (req, res) => {
    if (!req.session.userid) {
        // If the user is not logged in, show an alert box  
        res.send('<script>alert("Please log in first."); window.location="/login?loginMessage=Please Sign In first.";</script>');
    } else {
        let idd = req.session.userid;
        let mailid = req.session.user;
        let productid = req.params.id;
        let exist = await Cartdb.findOne({ user: idd });
        let product = await productdb.findById(productid);

        try {
            if (!exist) {
                const newcart = new Cartdb({
                    user: idd,
                    userEmail: mailid,
                    products: [
                        {
                            productId: product._id,
                            quantity: 1,
                            productPrice: product.price,
                            totalPrice: product.price * 1,
                            image: product.imageUrls[0], // Assuming you want to use the first image URL
                        },
                    ],
                });
                await newcart.save();
                res.send('<script>alert("Product added to cart."); window.location="/";</script>');
            } else {
                // Check if the product is already in the cart
                const existingProduct = exist.products.find(item => item.productId.equals(product._id));

                if (existingProduct) {
                    res.send('<script>alert("Product already in the cart.");</script>');
                    // res.redirect('/cart')

                } else {
                    exist.products.push({
                        productId: product._id,
                        quantity: 1,
                        productPrice: product.price,
                        totalPrice: product.price * 1,
                        image: product.imageUrls[0], // Assuming you want to use the first image URL
                    });

                    await exist.save();
                    res.send('<script>alert("Product added to cart."); window.location="/";</script>');
                }
            }
        } catch (error) {
            console.log(error);
            // Handle the error appropriately, e.g., send an error message to the client
            res.status(500).send('Internal Server Error');
        }
    }
};



const updateCartDetails = async (req,res) => {

        try {
          const { cartId, productId, quantity } = req.body;
          const id = req.session.userid;
    
          const existingCart = await Cartdb.findById(cartId);
      
          if (!existingCart) {
            return res
              .status(404)
              .json({ success: false, message: "Cart not found" });
          }
      
          const productToUpdate = existingCart.products.find((p) =>
            p.productId.equals(productId)
          );
      
          if (!productToUpdate) {
            return res
              .status(404)
              .json({ success: false, message: "Product not found in the cart" });
          }
      
          productToUpdate.quantity = quantity;
          productToUpdate.totalPrice = quantity * productToUpdate.productPrice;
      
          const updatedCart = await existingCart.save();
          const updatedTotalPrice = productToUpdate.totalPrice;
          const totalPriceTotal = existingCart.products.reduce((total, product) => {
            return total + product.totalPrice;
          }, 0);
          console.log(totalPriceTotal);
      
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
    const userId = req.session.userid;  // Corrected syntax
    const user = await userdb.findById(userId);
    const addresses=user.addresses

    // =============
    const cart = await Cartdb.findOne({ user: userId }).populate({
        path: "products.productId",
        model: "Product", // Make sure it matches the model name for the Product
});

// =====================
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.render('paymentmethod',{addresses,cart});

};



const addAddress = async (req, res) => {
    if (!req.session.userid) {
        return res.send('<script>alert("Please log in first."); window.location="/login?loginMessage=Please Sign In first.";</script>');
    } else {
        try {
            const fromprofile = req.params.id;
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

            const user = await userdb.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            console.log("Before pushing new address:", user);
            user.addresses.push(addressData);
            console.log("After pushing new address:", user);

            await user.save(); // Wait for the save operation to complete

            const selectedTab = 'address';

            if (fromprofile == 1) {
                res.redirect(`/profile?tab=${selectedTab}`);
                // res.redirect('/profile');

            } else {
                res.redirect('/paymentmethod');
            }
        } catch (error) {
            console.error('Error adding address:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};



//     const selectedBillingOption = req.body.billingOption;
//     console.log(req.body);
//     console.log('Selected Billing Option:', selectedBillingOption);
//  const address=req.query.addressIndex

// res.redirect('/cart')

const checkOut= async (req,res)=>{

    try {
        
        const addressIndex=req.body.addressIndex
        const selectedBillingOption = req.body.billingOption;
        // console.log(addressIndex);
        const userId = req.session.userid;
        const userAddr = await userdb.findById(userId);
    const addresses=userAddr.addresses[addressIndex]

        // Find the user's cart items
        const cart = await Cartdb.findOne({ user: userId }).populate({
            path: 'products.productId',
            model: 'Product', // Make sure it matches the model name for the Product
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
                reason: 'none', // You might need to modify this based on your requirements
                image: product.image,
            })),
            orderStatus: 'placed', // Assuming the order is initially placed
            paymentMode:selectedBillingOption , // Assuming paymentMode is passed in the request body
            total: req.body.total, // Assuming total is passed in the request body
            date: new Date(),
            address: addresses, // Assuming address is passed in the request body
        });

        // Save the order document
        const savedOrder = await order.save();

        // Clear the user's cart after successful checkout
        await Cartdb.findOneAndDelete({ user: savedOrder.user });

        // Send a response indicating success
        res.redirect('/cart')

        // res.status(200).json({ message: 'Order placed successfully', order: savedOrder });

       
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }




}

module.exports = {
    cart,
    updatecart,
    updateCartDetails,
    paymentmethod,
    addAddress,
    checkOut
};
