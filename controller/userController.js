const user = require("../model/usermodel");
const ptd = require("../model/pdtmodel");
const catdb = require("../model/category");
const orderdb = require("../model/order");
const cartdb = require("../model/cartmodel");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const WalletModel = require("../model/wallet");

const home = async (req, res) => {
    try {
        let userId = req.session.userid;

        // Fetch products for the homepage
        let products = await ptd.find().limit(4);

        // Initialize cart count to 0
        let cartCount = 0;

        if (userId) {
            // If user is logged in, fetch the user's cart and count the total number of items
            const userCart = await cartdb.findOne({ user: userId });
            if (userCart && userCart.products) {
                cartCount = userCart.products.length;
            }
        }

        // Render the view with the products and cart count
        res.render("homepage", { products, cartCount });
    } catch (error) {
        console.error("Error while showing all products", error);
        // Handle the error accordingly, for example, redirect to an error page
        res.status(500).render("error", { error: "Internal Server Error" });
    }
};

// const forgotPasswordReset = async (req, res) => {
//     try {
//         // Replace '659640d89109598e3af4385d' with the actual ObjectId of the user document you want to update
//         const userId = '659640d89109598e3af4385d';
//         const foundUser = await user.findOne({ _id: userId });

//         if (!foundUser) {
//             console.log("User not found");
//             // Handle the case where the user is not found
//             return res.json({ success: false, message: "User not found." });
//         }

//         console.log("User found");
//         // Do something with the found user
// let tok="111871"
//         if (!foundUser.token) {
//             // Token field does not exist, update the document
//             const result = await user.updateOne(
//                 { _id: userId },
//                 { $set: { token: tok } }
//             );

//             if (result.nModified > 0) {
//                 console.log("Token added successfully.");
//                 return res.json({ success: true, message: "Token added successfully." });
//             } else {
//                 console.error("Error:");
//                 return res.json({ success: false, message: "Failed to add token." });
//             }
//         } else {
//             console.log("Token already exists.");
//             return res.json({ success: true, message: "Token already exists." });
//         }
//     } catch (error) {
//         console.error("An error occurred:", error);
//         return res.status(500).json({ success: false, message: "Internal server error." });
//     }
// };

const forgotPasswordReset = async (req, res) => {
    console.log("Hai i'm here");
    const nodemailer = require("nodemailer");
    const generateToken = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };
    generettedOtp = generateToken();
    try {
        const email = req.body.email;
        console.log(email);
        const users = await user.findOne({ email });

        if (!users) {
            return res.json({ success: false, message: "User does not exist." });
        }
        // if (!users.token) {
        // Token field does not exist, update the document
        const result = await user.updateOne({ email: email }, { $set: { token: generettedOtp } });

        console.log("hai this is generateToken ", generettedOtp);
        console.log(result);
        if (result.modifiedCount > 0) {
            console.log("Token added successfully.");

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "abhishekabtr@gmail.com",
                    pass: "ynvf qhpi ykrm nwdm",
                },
            });

            const mailOptions = {
                from: "abhishekabtr@gmail.com",
                to: email,
                subject: "Reset Password",
                text: `Click the link to reset your password: http://localhost:3000/resetPassword?name=${users.email}&token=${generettedOtp}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error:", error);
                    res.json({ success: false, message: "Failed to send email." });
                } else {
                    console.log("Email sent:", info.response);
                    res.json({ success: true, message: "Email sent successfully." });
                }
            });

            if (users) {
                return res.json({ success: false, message: "Reset Mail has Sent to Your email" });

                // return res.json({ success: true, message: "Token added successfully." });
            } else {
                console.error("Error:");
                return res.json({ success: false, message: "ERROR." });
            }
        }
        // } else {
        //     console.log("Token already exists.");
        //     // return res.json({ success: true, message: "Token already exists." });
        // }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const resetPasswordPost = async (req, res) => {
    try {
        let token = req.body.usertoken;
        let email = req.body.useremail;
        let newPassword = req.body.newPassword;

        // Hash the new password
        const hashedPassword = await crypting(newPassword);

        // Find the user with the provided email and matching token
        const users = await user.findOne({ email: email, token: token });

        if (!users) {
            console.log("user not found");
            return res.status(404).json({ success: false, message: "User not found or invalid token." });
        }

        // Update the user's password
        users.password = hashedPassword;
        if (users.token === token) {
            users.token = null;
        }

        // Reset the token to null (or remove the token field if not needed anymore)
        // users.addresses.forEach((address) => {

        // });

        // Save the updated user document
        await users.save();
        console.log("pass change done");
        return res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const resetPassword = async (req, res) => {
    let name = req.query.name;
    let emailcheck = await user.findOne({ email: name });
    let userName = emailcheck.name;
    res.render("resetPassword", { userName });
};

const forgotPassword = async (req, res) => {
    res.render("forgotPassword");
};

const login = (req, res) => {
    const loginMessage = req.query.loginMessage;

    // Render the login page with the loginMessage variable
    res.render("login", { loginMessage });
};

// Hash the password
const crypting = (password) => {
    return bcrypt.hash(password, 10);
};

// compairing the passwords after hashing

const comparePasswords = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

const signup = async (req, res) => {
    // console.log(req.body.email);

    const hashedPassword = await crypting(req.body.password);
    let emailcheck = await user.findOne({ email: req.body.email });

    // console.log(emailcheck.otp);
    if (emailcheck && emailcheck.otp == true) {
        res.render("login", { existerorr: "Same user Exist" });
    } else {
        let usernew = new user({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });
        usernew.save();

        res.render("otp1", { existerorr: "Click to Get OTP in mail", email: req.body.email });
    }
};
// emailcheck.email
const otp = async (req, res) => {
    res.render("otp1");
};

const otpvalidation = async (req, res) => {
    try {
        const mailid = req.body.email;
        // console.log("Here's the email: " + mailid);

        const fullotp = req.body.otp;

        // Assuming `generettedOtp` is defined somewhere in your code
        if (fullotp === generettedOtp) {
            res.status(200).json({ message: "Registration successful, login now" });

            // Update user document to set OTP to true
            await user.updateOne({ email: mailid }, { $set: { otp: true } });

            // Delete documents where otp is false
            const result = await user.deleteMany({ otp: false });
            console.log(`${result.deletedCount} documents deleted`);
        } else {
            res.status(400).json({ message: "Failed" });
        }

        // Use the values as needed
    } catch (error) {
        console.error("Error in otpvalidation:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

let generettedOtp;

// Handle the POST request to /sendotp
const sendotp = async (req, res) => {
    const { email } = await req.body;
    console.log(email);
    const nodemailer = require("nodemailer");

    // Function to generate a random 4-digit OTP
    const generateOTP = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "abhishekabtr@gmail.com",
            pass: "ynvf qhpi ykrm nwdm", // Replace with your actual generated App Password
        },
    });

    // Generate a random 4-digit OTP
    generettedOtp = generateOTP();
    console.log(generettedOtp);
    // Define the email options with HTML content

    const mailOptions = {
        from: "abhishekabtr@gmail.com",
        to: email,
        subject: "Welcome to Shoe Rack",
        html: `<p>Welcome to Shoe Rack, where every step is a stylish journey. Step in and discover the perfect pair for your unique style!</p><p style="font-size: larger; font-weight: bold; color: blue; ">Your OTP is: ${generettedOtp}</p>`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });

    res.json({ message: "OTP sent successfully" });
};

// const logincheck = async (req, res) => {
//     // console.log(req.body.email);
//     // console.log(req.body.password);

//     let usercheck = await user.findOne({ email: req.body.email });

//     if (
//         usercheck &&
//         (await comparePasswords(req.body.password, usercheck.password)) &&
//         usercheck.otp == true &&
//         usercheck.Status == true
//     ) {
//         req.session.user = req.body.email;
//         req.session.userid = usercheck._id;

//         res.redirect("/login");
//     } else {
//         if (usercheck.Status == false) {
//             res.render("login", { message: "User blocked" });
//         } else {
//             res.render("login", { message: "Invalid username or password" });
//         }
//     }
// };
const logincheck = async (req, res) => {
    try {
        let usercheck = await user.findOne({ email: req.body.email });

        if (
            usercheck &&
            (await comparePasswords(req.body.password, usercheck.password)) &&
            usercheck.otp == true &&
            usercheck.Status == true
        ) {
            req.session.user = req.body.email;
            req.session.userid = usercheck._id;

            res.redirect("/login");
        } else {
            if (usercheck && usercheck.Status == false) {
                res.render("login", { message: "User blocked" });
            } else {
                res.render("login", { message: "Invalid username or password" });
            }
        }
    } catch (error) {
        console.error("Error in logincheck:", error);
        res.render("login", { message: "An error occurred during login" });
    }
};

// userController

// const fullpdt = async (req, res) => {
//     try {
//         const MainCat = req.params.MainCat;

//         if (MainCat === "Men" || MainCat === "Women" || MainCat === "Kids") {
//             // Fetch products based on the specified gender category
//             const products = await ptd.find({
//                 gender: MainCat,
//                 status: "Active",
//                 productDeleted: { $ne: "deleted" },
//             });
//             let mainCatLower = MainCat.toLowerCase();
//             const categories = await catdb.find({ Name: mainCatLower });

//             // Extract unique subName values from the categories array
//             const uniqueSubNames = [...new Set(categories.map((category) => category.subName))];

//             const brands = await ptd
//                 .find({
//                     status: "Active",
//                     productDeleted: { $ne: "deleted" },
//                 })
//                 .distinct("manufacturer");

//             // Render the 'fullpdt' template and pass the filtered products as a variable
//             res.render("fullpdt", { products, uniqueSubNames, brands, cartCount: req.cartCount });
//         } else if (MainCat == 0) {
//             // Fetch categories with Status set to true
//             const activeCategories = await catdb.find({ Status: true });

//             // Extract category names from the active categories
//             const activeCategoryNames = activeCategories.map((category) => category.subName);

//             // Fetch all products that belong to the active categories
//             const products = await ptd.find({
//                 category: { $in: activeCategoryNames },
//                 status: "Active",
//                 productDeleted: { $ne: "deleted" },
//             });
//             const categories = await catdb.find();

//             // Extract unique subName values from the categories array
//             const uniqueSubNames = [...new Set(categories.map((category) => category.subName))];

//             const brands = await ptd
//                 .find({
//                     status: "Active",
//                     productDeleted: { $ne: "deleted" },
//                 })
//                 .distinct("manufacturer");

//             // Render the 'fullpdt' template and pass the filtered products as a variable
//             res.render("fullpdt", { products, uniqueSubNames, brands, cartCount: req.cartCount });
//         } //for sraching
//         else {
//             console.log(MainCat); // this is the search text
//             const regex = new RegExp(MainCat, "i");
//             const products = await ptd.find({
//                 $or: [
//                     { name: regex },
//                     { manufacturer: regex },
//                     // Add more fields if needed
//                 ],
//             });

//             // res.json(products);
//             console.log(products);

//             const categories = await catdb.find();

//             // Extract unique subName values from the categories array
//             const uniqueSubNames = [...new Set(categories.map((category) => category.subName))];
//             console.log("Rendering fullpdt page");
//             // Render the 'fullpdt' template and pass the filtered products as a variable

//             const brands = await ptd
//                 .find({
//                     status: "Active",
//                     productDeleted: { $ne: "deleted" },
//                 })
//                 .distinct("manufacturer");

//             res.render("fullpdt", { products, uniqueSubNames, brands, cartCount: req.cartCount });
//         }
//     } catch (error) {
//         console.error("Error fetching products:", error);
//         res.status(500).send("Internal Server Error");
//     }
// };

const fullpdt = async (req, res) => {
    try {
        const MainCat = req.params.MainCat;
        const page = parseInt(req.query.page) || 1; // Get the requested page from the query parameters
        const itemsPerPage = 12; // Adjust the number of items per page as needed

        let query = {
            status: "Active",
            productDeleted: { $ne: "deleted" },
        };

        const activeCategories = await catdb.find({ Status: true });
        const activeCategoryNames = activeCategories.map((category) => category.subName);
        query.category = { $in: activeCategoryNames };

        if (MainCat === "Men" || MainCat === "Women" || MainCat === "Kids") {
            // Fetch products based on the specified gender category
            query.gender = MainCat;
        } else if (MainCat == 0) {
            
            // Fetch products based on all active categories
        } else {
            console.log(MainCat);
            // Fetch products based on search text
            const regex = new RegExp(MainCat, "i");
            query.$or = [
                { name: regex },
                { manufacturer: regex },
                { category: regex },
                // Add more fields if needed
            ];
        }

        const totalProducts = await ptd.countDocuments(query);
        let totalProductsCount = totalProducts;

        const totalPages = Math.ceil(totalProducts / itemsPerPage);
        const skip = (page - 1) * itemsPerPage;

        const products = await ptd.find(query).skip(skip).limit(itemsPerPage);
        const sizes = await ptd.distinct("size", query);
        const uniqueSubNames =await ptd.distinct("category", query);
        const brands =await ptd.distinct("manufacturer", query);
        
        // const categories = await catdb.find();
        // const uniqueSubNames = [...new Set(categories.map((category) => category.subName))];

        // const brands = await ptd
        //     .find({
        //         status: "Active",
        //         productDeleted: { $ne: "deleted" },
        //     })
        //     .distinct("manufacturer");

        res.render("fullpdt", {
            products,
            uniqueSubNames,
            brands,
            cartCount: req.cartCount,
            totalPages,
            currentPage: page,
            MainCat,
            totalProductsCount,
            sizes,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Internal Server Error");
    }
};

// =====================product ====================

const product = async (req, res) => {
    const productId = req.params.id;

    try {
        const product = await ptd.findOne({ _id: productId });
        const products = await ptd.find().limit(4); // Use find() instead of findOne()

        const userId = req.session.userid;
        const cart = await cartdb.findOne({ user: userId });

        let isInCart = false;
        if (cart) {
            const cartProductIds = cart.products.map(product => product.productId.toString());
            isInCart = cartProductIds.includes(productId);
        }
console.log(isInCart);
        res.render("product", { product, products,isInCart, cartCount: req.cartCount });
    } catch (error) {
        console.error("Error finding product:", error);
    }
};

// =====================Profile ====================

const profile = async (req, res) => {
    // const fromprofile = await req.query.tab;

    const userId = await req.session.userid; // Corrected syntax
    const userdata = await user.findById(userId);
    const addresses = await userdata.addresses;
    const orders =
        (await orderdb
            .find({ user: userId }) // Find one order that matches the user ID
            .populate({
                // Populate the order with...
                path: "Products.products", // the products in the order
                model: "Product", // from the Product model
            })) || 0; // If the query doesn't return a result, return 0
    const walletData = await WalletModel.findOne({ userId }).limit(15);
    // console.log(walletData);
    const selectedTab = (await req.query.tab) || "defaultTab";

    res.render("profile", {
        addresses,
        orders,
        selectedTab,
        userId,
        userdata,
        walletData,
        cartCount: req.cartCount,
    });
};

// =====================delete Address ====================
const deleteAddress = async (req, res) => {
    try {
        const indexToDelete = req.params.id;
        const userId = await req.session.userid;
        // Step 1: Set the value at the specified index to null
        await user.findByIdAndUpdate(userId, { $set: { [`addresses.${indexToDelete}`]: null } });

        // Step 2: Remove null values from the array
        const userc = await user.findByIdAndUpdate(userId, { $pull: { addresses: null } }, { new: true });

        if (!userc) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({});
        // res.redirect("/profile?tab=address");
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const editAddress = async (req, res) => {
    const userId = req.session.userid; // Assuming you have the user's ID in the session

    try {
        // Fetch the user data from the database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Extract the address index from the request parameters
        const addressIndex = req.params.id;

        // Ensure the address index is valid
        if (addressIndex < 0 || addressIndex >= user.addresses.length) {
            return res.status(400).json({ error: "Invalid address index" });
        }

        // Get the existing address data
        const existingAddress = user.addresses[addressIndex];

        // Render a form with the existing address data for the user to edit
        res.render("editAddressForm", { existingAddress });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const orderStatusUpdation = async (req, res) => {
    const { id } = req.params;
    const { reason, productId } = req.body;

    try {
        const order = await orderdb.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        let changeStatus;
        // let  changeStatusforWallet, productAmount;

        const product = order.Products.find((prod) => prod._id.toString() === productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found in the order" });
        }

        if (product.orderStatus === "placed" || product.orderStatus === "shipped") {
            changeStatus = "Cancellation requested";
            changeStatusforWallet = "Cancellation requested";
        } else if (product.orderStatus === "delivered") {
            changeStatus = "Return requested";
            changeStatusforWallet = "Return requested";
        }

        try {
            const updatedUsers = await orderdb.updateOne(
                { _id: id, "Products._id": productId },
                {
                    $set: {
                        "Products.$.orderStatus": changeStatus,
                        "Products.$.reason": reason,
                    },
                }
            );
        } catch (error) {
            console.error(error);
            // Handle order status update error
        }

        res.json({ message: "Order status updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

const updateMobile = async (req, res) => {
    const userId = req.session.userid;
    const newMobile = req.body.newMobile;
    const newName = req.body.newName;

    try {
        let update = await user.updateOne({ _id: userId }, { $set: { phoneNo: newMobile, name: newName } }, { new: true });

        res.status(200).send("Mobile number updated successfully");
    } catch (err) {
        console.error("Error updating mobile number:", err);
        res.status(500).send("Error updating mobile number");
    }
};

const passwordChange = async (req, res) => {
    const userId = req.session.userid; // Assuming the user ID is stored in the session
    const passChange = req.body.passChange;

    if (!userId) {
        console.error("User ID not found in the session.");
        return res.status(500).send("User ID not found in the session.");
    }

    console.log("New Password:", passChange);

    try {
        const hashedPassword = await crypting(passChange);

        let update = await user.updateOne({ _id: userId }, { $set: { password: hashedPassword } });

        console.log("Update Result:", update);

        if (update.ok) {
            console.log("Password updated successfully");
            return res.status(200).send("Password updated successfully");
        } else {
            console.error("Failed to update password");
            return res.status(500).send("Failed to update password");
        }
    } catch (err) {
        console.error("Error updating password:", err);
        return res.status(500).send("Error updating password");
    }
};

const updateAddress = async (req, res) => {
    try {
        const userId = req.session.userid; // Assuming you're using sessions
        const addressId = req.params.id;
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

        const updatedUser = await user.findOneAndUpdate(
            { _id: userId, "addresses._id": addressId },
            {
                $set: {
                    "addresses.$.firstName": addressData.firstName,
                    "addresses.$.lastName": addressData.lastName,
                    "addresses.$.companyName": addressData.companyName,
                    "addresses.$.country": addressData.country,
                    "addresses.$.streetAddress1": addressData.streetAddress1,
                    "addresses.$.streetAddress2": addressData.streetAddress2,
                    "addresses.$.townCity": addressData.townCity,
                    "addresses.$.stateCounty": addressData.stateCounty,
                    "addresses.$.postcodeZIP": addressData.postcodeZIP,
                    "addresses.$.phone": addressData.phone,
                },
            },
            { new: true }
        );

        if (updatedUser) {
            res.redirect("/profile?tab=address");
            // res.json({});
        } else {
            res.status(404).json({ message: "Address not found or not updated" });
        }
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const orderDetails = async (req, res) => {
    try {
        // Assuming you want to find orders based on the orderId
        const orderId = req.params.orderId;
        // Find orders from the database using the orderId
        const orders = await orderdb.find({ _id: orderId });

        res.render("orderDetails", { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
};

// const cateFilter = async (req, res) => {
//     try {
//         // console.log("ii");
//         // Assuming the request body contains selected categories, sizes, and brands
//         const selectedCategories = req.body.selectedCategories || [];
//         const selectedSizes = req.body.selectedSizes || [];
//         const selectedBrands = req.body.selectedBrands || [];

//         const trimmedCategories = selectedCategories.map((category) => category.trim());
//         const trimmedSizes = selectedSizes.map((size) => size.trim());
//         const trimmedBrands = selectedBrands.map((brand) => brand.trim());
//         console.log(trimmedCategories);
//         console.log(trimmedSizes);
//         console.log(trimmedBrands);
//         // Define the base query
//         let query = {
//             status: "Active",
//             productDeleted: { $ne: "deleted" },
//         };


//         const activeCategories = await catdb.find({ Status: true });
//         const activeCategoryNames = activeCategories.map((category) => category.subName);
//         query.category = { $in: activeCategoryNames };



//         if (trimmedCategories.length > 0) {
//             query.category = { $in: trimmedCategories };
//         }

//         if (trimmedSizes.length > 0) {
//             query.size = { $in: trimmedSizes };
//         }

//         if (trimmedBrands.length > 0) {
//             query.manufacturer = { $in: trimmedBrands };
//         }

//         // Filter products based on the constructed query
//         const filteredProducts = await ptd.find(query);
//         console.log(filteredProducts);
//         // Send the filtered products as JSON response
//         res.json({ products: filteredProducts });
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };
const cateFilter = async (req, res) => {
    try {
        // Assuming the request body contains selected categories, sizes, and brands
        const selectedCategories = req.body.selectedCategories || [];
        const selectedSizes = req.body.selectedSizes || [];
        const selectedBrands = req.body.selectedBrands || [];

        // Trim the selected filters
        const trimmedCategories = selectedCategories.map((category) => category.trim());
        const trimmedSizes = selectedSizes.map((size) => size.trim());
        const trimmedBrands = selectedBrands.map((brand) => brand.trim());

        // Define the base query
        let query = {
            status: "Active",
            productDeleted: { $ne: "deleted" },
        };

        // Get the updated list of active categories
        const updatedCategories = await catdb.find({ Status: true });
        const updatedCategoryNames = updatedCategories.map((category) => category.subName);

        // Set the base query for category
        query.category = { $in: updatedCategoryNames };

        // Update the query dynamically based on selected filters
        if (trimmedCategories.length > 0) {
            query.category = { $in: trimmedCategories };
        } else {
            delete query.category;
        }

        if (trimmedSizes.length > 0) {
            query.size = { $in: trimmedSizes };
        } else {
            delete query.size;
        }

        if (trimmedBrands.length > 0) {
            query.manufacturer = { $in: trimmedBrands };
        } else {
            delete query.manufacturer;
        }

        // Fetch the updated list of available sizes and brands
        const updatedSizes = await ptd.distinct("size", query);

        const updatedBrands = await ptd
            .find({
                status: "Active",
                productDeleted: { $ne: "deleted" },
            })
            .distinct("manufacturer");

        // Filter products based on the constructed query
        const filteredProducts = await ptd.find(query);

        // Send the filtered products and updated filter options as JSON response
        res.json({
            products: filteredProducts,
            updatedCategories: updatedCategoryNames,
            updatedSizes,
            updatedBrands,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};






module.exports = {
    home,
    signup,
    otp,
    otpvalidation,
    sendotp,
    logincheck,
    login,
    product,
    fullpdt,
    //=========profile =========
    profile,
    deleteAddress,
    editAddress,
    orderStatusUpdation,
    updateMobile, // changing the name also
    passwordChange,
    updateAddress,
    forgotPassword,
    forgotPasswordReset,
    resetPassword,
    resetPasswordPost,
    orderDetails,
    cateFilter,
};

//<!-- <div><strong><%= product.products.name %> &nbsp;&nbsp;</strong></div> -->
