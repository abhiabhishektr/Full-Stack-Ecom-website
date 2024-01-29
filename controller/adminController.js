const user = require("../model/usermodel");
const newProduct = require("../model/pdtmodel");
const categorydb = require("../model/category");
const orderdb = require("../model/order");
const fs = require("fs");

const multer = require("multer");
const path = require("path");





const getNetIncomeData = async (req, res) => {
    console.log("hai thius ");
    try {
        const monthlySales = await orderdb.aggregate([
            {
                $group: {
                    _id: { $month: "$date" },
                    totalSales: { $sum: "$subtotal" }
                }
            }
        ]);

        // Extract sales data for each month
        const monthlySalesData = monthlySales.map(entry => ({
            month: entry._id,
            totalSales: entry.totalSales
        }));

        res.json({
            monthlySales: monthlySalesData
        });
    } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
const getPieDia= async (req, res) => {
    try {
        const onlinePaymentOrders = await orderdb.find({ paymentMode: "online" });
        const cashOnDeliveryOrders = await orderdb.find({ paymentMode: "COD" });

        const onlinePaymentCount = onlinePaymentOrders.length;
        const cashOnDeliveryCount = cashOnDeliveryOrders.length;

        const onlinePaymentAmount = onlinePaymentOrders.reduce((total, order) => total + order.subtotal, 0);
        const cashOnDeliveryAmount = cashOnDeliveryOrders.reduce((total, order) => total + order.subtotal, 0);

        res.json({
            onlinePaymentCount,
            cashOnDeliveryCount,
            onlinePaymentAmount,
            cashOnDeliveryAmount
        });
    } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const earningWave= async (req, res) => {
    try {
        // Fetch orders for the current month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const orders = await orderdb.find({
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        // Group earnings by day
        const dailyEarnings = [0, 0, 0, 0, 0, 0, 0]; // Initialize array for each day of the week

        orders.forEach(order => {
            const dayOfWeek = order.date.getDay(); // 0 (Sun) to 6 (Sat)
            dailyEarnings[dayOfWeek] += order.subtotal;
        });

        // Send the data to the client
        res.json({ dailyEarnings });
    } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


const orderStatus= async (req, res) => {
    
    try {
        // Fetch orders for the current month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const orders = await orderdb.find({
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        // Count the number of orders for each status
        const statusCounts = {
            placed: 0,
            shipped: 0,
            delivered: 0,
            requestReturn: 0,
            returned: 0,
            requestedCancellation: 0,
            cancelled: 0
        };

        orders.forEach(order => {
            statusCounts[order.orderStatus]++;
        });

        // Send the data to the client
        res.json(statusCounts);
    } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}




const admin = async (q, r) => {
    try {
        // Fetch data from MongoDB
        const onlinePaymentOrders = await orderdb.find({ paymentMode: "online" });
        const cashOnDeliveryOrders = await orderdb.find({ paymentMode: "COD" });

        // Calculate counts and amounts
        const onlinePaymentCount = onlinePaymentOrders.length;
        const onlinePaymentAmount = onlinePaymentOrders.reduce((total, order) => total + order.subtotal, 0);

        const cashOnDeliveryCount = cashOnDeliveryOrders.length;
        const cashOnDeliveryAmount = cashOnDeliveryOrders.reduce((total, order) => total + order.subtotal, 0);

        const totalusers = await user.countDocuments();

        const totalearnings = onlinePaymentAmount + cashOnDeliveryAmount;

        const TotalOrders = await orderdb.countDocuments();
        const undelivered = await orderdb.countDocuments({ orderStatus: "placed" });


        const recentOrders = await orderdb.find().sort({ date: -1 }).limit(3);


        const totalSalesData = {
            onlinePaymentCount,
            onlinePaymentAmount,
            cashOnDeliveryCount,
            cashOnDeliveryAmount,
            totalusers,
            // incUser,
            totalearnings,
            TotalOrders,
            undelivered,
            recentOrders
        };

        // Render the 'adminDash' view and pass dynamic data
        r.render("adminDash", totalSalesData);
    } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        r.status(500).send("Internal Server Error");
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, "..", "public", "uploads");

        // Create the 'public/uploads' directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Extract the file extension from the original file name
        const fileExtension = path.extname(file.originalname);

        // Generate a unique file name using the current timestamp
        const uniqueFileName = Date.now() + "-" + Math.round(Math.random() * 1000) + fileExtension;

        // Append the unique filename to the uploads directory
        cb(null, uniqueFileName);
    },
});

// Create the multer instance with the defined storage
const upload = multer({ storage: storage });

const adminsignout = (req, res) => {
    if (req.session.admin) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect("/admin"); // Redirect to login page or any other appropriate page
        });
    } else {
        res.redirect("/admin"); // If session doesn't exist, redirect to login page
    }
};

const allusers = async (req, res) => {
    try {
        const users = await user.find(); //users name is given by the programmer
        res.render("allusers", { users });
    } catch (error) {
        console.log("error while showing user", +error);
    }
};

const unblock = async (req, res) => {
    const id = await req.params.id;
    try {
        await user.findByIdAndUpdate({ _id: id }, { $set: { Status: true } });
        res.redirect("/allusers");
    } catch (error) {
        console.log("error while blocking", +error);
    }
};

const block = async (req, res) => {
    const id = await req.params.id;
    try {
        await user.findByIdAndUpdate({ _id: id }, { $set: { Status: false } });
        res.redirect("/allusers");
    } catch (error) {
        console.log("error while blocking", +error);
    }
};
const userdelete = async (req, res) => {
    const id = await req.params.id;
    try {
        await user.deleteOne({ _id: id });
        res.redirect("/allusers");
    } catch (error) {
        console.log("error while deleting", +error);
    }
};

const allproducts = async (req, res) => {
    try {
        // Assuming you fetch products with imageUrls from the database
        let product =await newProduct.find({ productDeleted: { $ne: 'deleted' } });


        // Render the view with the products
        res.render("allProducts", { product });
    } catch (error) {
        console.log("Error while showing all products", error);
        // Handle the error accordingly, for example, redirect to an error page
        res.status(500).render("error", { error: "Internal Server Error" });
    }
};

const newproducts = async (req, res) => {
    const Category = await categorydb.find();
    res.render("addProducts", { Category });
};

const category = async (req, res) => {
    const Category = await categorydb.find();
    res.render("addcategory", { Category });
};

const addcategory = async (req, res) => {
    try {
        const Category = await categorydb.find({ subName: req.body.subName });
        console.log(Category);
        if (Category.length > 0) {
            res.redirect("/category");
        } else {
            const Name = req.body.main;

            const subName = req.body.subName;

            const Description = req.body.Description;

            // Validate if Name and Description are provided
            if (!Name || !Description || !subName) {
                return res.status(400).send("Name and Description are required");
            }

            // Create a new category instance
            const newCategory = new categorydb({
                Name,
                subName,
                Description,
            });

            // Save the new category to the database
            await newCategory.save();

            // Redirect to the categories page or send a success message
            res.redirect("/category");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

// =======blocking=======
const Cblock = async (req, res) => {
    const id = await req.params.id;
    try {
        await categorydb.findByIdAndUpdate({ _id: id }, { $set: { Status: false } });
        res.redirect("/category");
    } catch (error) {
        console.log("error while blocking", +error);
    }
};

// =======Un blocking=======
const Cunblock = async (req, res) => {
    const id = await req.params.id;
    try {
        await categorydb.findByIdAndUpdate({ _id: id }, { $set: { Status: true } });
        res.redirect("/category");
    } catch (error) {
        console.log("error while blocking", +error);
    }
};
// ========Deleting=========
const deletecategory = async (req, res) => {
    const id = await req.params.id;
    console.log(id);
    try {
        // Assuming newProduct is your Mongoose model for MongoDB
        const result = await categorydb.deleteOne({ _id: id });

        // Check if the product was deleted successfully
        if (result.deletedCount > 0) {
            // res.status(200).json({ message: 'Product deleted successfully' });
            res.redirect("/category");
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// ========================cat update========

// const Cupdate = async (req, res) => {
//     try {
//         const id = req.params.id;

//         // Fetch the category from the database based on the id
//         const category = await categorydb.findById(id);

//         // Render the 'Cupdate' template with the fetched category data
//         res.render('addcategory');
//     } catch (error) {
//         console.error('Error fetching category:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };

const adminlog = (req, res) => {
    res.render("adminLog", { msg: "" });
};
const bcrypt = require("bcrypt");
const { log } = require("console");
const order = require("../model/order");

const comparePasswords = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

const adminlogcheck = async (req, res) => {
    let usercheck = await user.findOne({ email: req.body.Name });

    if (usercheck && (await comparePasswords(req.body.Password, usercheck.password)) && usercheck.is_admin == 1) {
        req.session.admin = req.body.Name;

        res.redirect("/admin");
    } else {
        res.render("adminlog", { msg: "Invalid username or password" });
    }
};

// =============================edit product=================

const editproduct = async (req, res) => {
    const id = req.params.id;
    const Category = await categorydb.find();
    // res.render("addProducts",{Category});
    try {
        // Assuming you fetch product details from the database using the id
        const product = await newProduct.findById(id);

        // Render the edit-product page with product details
        res.render("editproducts", { product, Category });
    } catch (error) {
        console.log("Error while fetching product details", error);
        // Handle the error accordingly, for example, redirect to an error page
        res.status(500).render("error", { error: "Internal Server Error" });
    }
};

const deleteproduct = async (req, res) => {
    const id = req.params.id;
    // console.log(id);
    try {
        // Assuming newProduct is your Mongoose model for MongoDB
        // const result = await newProduct.deleteOne({ _id: id });
        const result = await newProduct.updateOne(
            { _id: id },
            { $set: { productDeleted: "deleted" } }
        );
        console.log(result);
        // Check if the product was deleted successfully
        if (result.matchedCount > 0) {
            // res.status(200).json({ message: 'Product deleted successfully' });
            res.redirect("/allproducts");
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

//block product=====================================

const blockproduct = async (req, res) => {
    try {
        const id = req.params.id;
        const prod = await newProduct.findOne({ _id: id });

        if (prod) {
            await newProduct.updateOne({ _id: id }, { $set: { status: "Blocked" } });
            res.redirect("/allproducts");
        } else {
            res.redirect("/allproducts");
        }
    } catch (error) {
        res.status(400).send("Block product falied");
        console.log(error.message);
    }
};

// product unblock=============================================

const productunblock = async (req, res) => {
    try {
        const id = req.params.id;
        const prod = await newProduct.findOne({ _id: id });

        if (prod) {
            await newProduct.updateOne({ _id: id }, { $set: { status: "Active" } });
            res.redirect("/allproducts");
        } else {
            res.status(400).send("Unblock product falied");

            res.redirect("/allproducts");
        }
    } catch (error) {
        res.status(400).send("Unblock product falied");
        console.log(error.message);
    }
};

// ===================update=======
// const updateproduct = async (req, res) => {
//     const id = await req.params.id;
//     console.log(id);
//         // 658bd19d8f04d9e5910d3e72
//         // 658bd19d8f04d9e5910d3e72

//     // Access form data from req.body

//     const productName = req.body.name;
//     console.log(productName);
//     const productDescription = req.body.description;
//     const productPrice = req.body.price;
//     const productCategory = req.body.category;
//     const gender = req.body.gender;
//     const productManufacturer = req.body.manufacturer;
//     const stockQuantity = req.body.stockQuantity;
//     const imggg='1703661981535-529.jpeg'

//     // Get the array of file paths from multer
//     // const imageUrls = req.files.map((file) => file.filename);

//     try {
//         // Update the product based on the provided ID
//         const result = await newProduct.updateOne(
//             { _id: id },
//             {
//                 $set: {
//                     name: productName,
//                     description: productDescription,
//                     price: productPrice,
//                     category: productCategory,
//                     gender: gender,
//                     manufacturer: productManufacturer,
//                     stockQuantity: stockQuantity,

//                 },
//             }
//         );

//         console.log("loo here",+result);

//         if (result.nModified > 0) {
//             console.log("Product updated successfully");
//             res.redirect("/allproducts"); // Redirect to a page after successful update
//         } else {
//             console.error("No product updated. Product with the provided ID not found.");
//             res.status(404).send("Product not found");
//         }
//     } catch (error) {
//         console.error("Error updating product:", error);
//         res.status(500).send("Internal Server Error"); // Handle error response
//     }
// };

// const updateproduct = async (req, res) => {
//     const id = req.params.id;

//     const productName = req.body.name;
//     const productDescription = req.body.description;
//     const productPrice = req.body.price;
//     const productCategory = req.body.category;
//     const gender = req.body.gender;
//     const productManufacturer = req.body.manufacturer;
//     const stockQuantity = req.body.stockQuantity;
//     const imggg = '1703661981535-529.jpeg';

//     try {
//         // Update the product based on the provided ID
//         const result = await newProduct.updateOne(
//             { _id: id },
//             {
//                 $set: {
//                     name: productName,
//                     description: productDescription,
//                     price: productPrice,
//                     category: productCategory,
//                     gender: gender,
//                     manufacturer: productManufacturer,
//                     stockQuantity: stockQuantity,
//                 },
//                 $push: {
//                     imageUrls: imggg,
//                 },
//             }
//         );

//         console.log("Update result:", result.nModified );

//         if (result.modifiedCount  > 0) {
//             console.log("Product updated successfully");
//             res.redirect("/allproducts"); // Redirect to a page after successful update
//         } else {
//             console.error("No product updated. Product with the provided ID not found.");
//             res.status(404).send("Product not found");
//         }
//     } catch (error) {
//         console.error("Error updating product:", error);
//         res.status(500).send("Internal Server Error"); // Handle error response
//     }
// };
const updateproduct = async (req, res) => {
    const id = req.params.id;

    const productName = req.body.name;
    const productDescription = req.body.description;
    const productPrice = req.body.price;
    const productSize = req.body.size;
    const productCategory = req.body.category;
    const gender = req.body.gender;
    const productManufacturer = req.body.manufacturer;
    const stockQuantity = req.body.stockQuantity;
    // const imgg = "6789";
    const replacedImageUrls = req.files ? req.files.map((file) => file.filename) : [];

    const existingProduct = await newProduct.findOne({ _id: id });
    const existingImageUrls = existingProduct.imageUrls;
    const updatedImageUrls =
        replacedImageUrls.length > 0 ? [...existingImageUrls, ...replacedImageUrls] : existingImageUrls;
    try {
        // Update the product based on the provided ID
        const result = await newProduct.updateOne(
            { _id: id },
            {
                $set: {
                    name: productName,
                    description: productDescription,
                    price: productPrice,
                    category: productCategory,
                    size: productSize,
                    gender: gender,
                    manufacturer: productManufacturer,
                    stockQuantity: stockQuantity,
                    imageUrls: updatedImageUrls,
                },
                // $ push: {
                //     imageUrls: imgg,
                // },
            }
        );

        // console.log("Update result:", result.modifiedCount,result );

        if (result.matchedCount > 0) {
            console.log("Product updated successfully");
            res.redirect("/allproducts"); // Redirect to a page after successful update
        } else {
            console.error("No product updated. Product with the provided ID not found.");
            res.status(404).send("Product not found");
        }
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Internal Server Error"); // Handle error response
    }
};

// ...

// Add the upload middleware to your route handling
// const addproduct = (req, res) => {
//     // Access form data from req.body
//     const productName = req.body.name;
//     const productDescription = req.body.description;
//     const productPrice = req.body.price;
//     const productSize = req.body.size;
//     const productCategory = req.body.category;
//     // console.log(productCategory);
//     const gender = req.body.gender;
//     const productManufacturer = req.body.manufacturer;
//     const stockQuantity = req.body.stockQuantity;

//     // Get the array of file paths from multer
//     const imageUrls = req.files.map((file) => file.filename);

//     // Now you can use these variables to save data to the database or perform other actions
//     // For example, you can use your Product model to save the data to the database
//     const Product = new newProduct({
//         name: productName,
//         description: productDescription,
//         price: productPrice,
//         category: productCategory,
//         size:productSize,
//         gender: gender,
//         manufacturer: productManufacturer,
//         stockQuantity: stockQuantity,
//         imageUrls: imageUrls, // Update to use imageUrls instead of imageUrl
//     });

//     // Save the new product
//     Product.save()
//         .then((savedProduct) => {
//             console.log("Product added successfully:", savedProduct);
//             res.redirect("/allproducts"); // Redirect to a page after successful submission
//         })
//         .catch((error) => {
//             console.error("Error adding product:", error);
//             res.status(500).send("Internal Server Error"); // Handle error response
//         });

//     // Note: It's good practice to handle the rendering of views and responses in the appropriate blocks of your code.

// };

const addproduct = (req, res) => {
    const { name, description, price, size, category, gender, manufacturer, stockQuantity } = req.body;

    const imageUrls = req.files.map((file) => file.filename);

    const newProducts = new newProduct({
        name,
        description,
        price,
        category,
        size,
        gender,
        manufacturer,
        stockQuantity,
        imageUrls,
    });

    newProducts
        .save()
        .then((savedProduct) => {
            console.log("Product added successfully:", savedProduct);
            res.redirect("/allproducts");
        })
        .catch((error) => {
            console.error("Error adding product:", error);
            res.status(500).send("Internal Server Error");
        });
};

const OrdersAdmin = async (req, res) => {
    try {
        // Find all orders
        // const orders = await orderdb.find();
        const orders = await orderdb.find().populate({
            path: "Products.products",
            model: "Product", // Make sure it matches the model name for the Product
        });

        // Render the EJS file and pass the orders data
        res.render("OrdersAdmin", { orders });
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).send("Internal server error");
    }
};

const OrdersStatus = async (req, res) => {
    // console.log( req.params.id);
    // console.log( selectedStatus);
    try {
        const orderId = req.params.id; // Extract orderId from the request parameters
        const { orderStatus } = req.body; // Extract updated orderStatus from the request body

        console.log(`Received orderStatus for order ${orderId}: ${orderStatus}`);

        // Update the order status in the database
        const updatedOrder = await orderdb.findByIdAndUpdate(orderId, { orderStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(updatedOrder); // Return the updated order
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
const deleteimage = async (req, res) => {
    try {
        const index = req.query.index;

        // Assuming you have a product object with an 'image' property
        const product = await newProduct.findOne({ _id: req.query.id });

        // Check if the product is found
        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Check if the index is valid
        if (index >= 0 && index < product.imageUrls.length) {
            // Get the filename of the image at the specified index
            const filenameToDelete = product.imageUrls[index];

            // Construct the file path
            const filePath = path.join(__dirname, "../public/uploads", filenameToDelete);

            // Delete the file
            fs.unlinkSync(filePath);

            // Update the database to remove the image reference
            await newProduct.findByIdAndUpdate(product._id, { $pull: { imageUrls: filenameToDelete } });

            // Send a success JSON responser
            res.redirect(`/editproduct/${req.query.id}`);
            //res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            // Send an error JSON response if the index is out of bounds
            res.status(400).json({ error: "Invalid index" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getNetIncomeData,
    getPieDia,
    earningWave,
    orderStatus,
    admin,
    allusers,
    unblock,
    block,
    userdelete,
    allproducts,
    newproducts,
    category,
    addproduct,
    upload,
    adminlog,
    editproduct,
    addcategory,
    Cblock,
    Cunblock,
    // Cupdate,
    deletecategory,
    adminlogcheck,
    updateproduct,
    deleteproduct,
    productunblock,
    blockproduct,
    adminsignout,
    // ====Orders===
    OrdersAdmin,
    OrdersStatus,
    deleteimage,
};
