const user = require("../model/usermodel");
const ptd = require("../model/pdtmodel");
const catdb =require("../model/category");
const orderdb=require("../model/order")
const bcrypt = require("bcrypt");

const home =async (req, res) => {

    try {
        // Assuming you fetch products with imageUrls from the database
        let products = await ptd.find().limit(4);

        // Render the view with the products
        res.render("homepage", { products });
    } catch (error) {
        console.log("Error while showing all products", error);
        // Handle the error accordingly, for example, redirect to an error page
        res.status(500).render("error", { error: "Internal Server Error" });
    }



};
const login = (req, res) => {

    const loginMessage = req.query.loginMessage ;

    // Render the login page with the loginMessage variable
    res.render('login', { loginMessage });
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
    if (emailcheck && emailcheck.otp==true) {
        res.render("login", { existerorr: "Same user Exist" });
    } else {
        let usernew = new user({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });
        usernew.save();

        res.render("otp1", { existerorr: "Click to Get OTP in mail", email: req.body.email});
    }
};
// emailcheck.email





const otp = async (req, res) => {
    res.render("otp1");
};


const otpvalidation = async (req, res) => {
    const mailid = req.body.email;
    console.log('here the mail '+mailid);
    const otpValue1 = req.body.otpInput1;
    const otpValue2 = req.body.otpInput2;
    const otpValue3 = req.body.otpInput3;
    const otpValue4 = req.body.otpInput4;

    const fullotp = otpValue1 + otpValue2 + otpValue3 + otpValue4;
    // console.log(fullotp);
    // console.log(typeof(fullotp));
    if (fullotp == generettedOtp) {
        res.render("login", { existerorr: "Registration succesful login now" });

        await user.updateOne({ email: mailid }, { $set: { otp: true } });

        const result = await user.deleteMany({ otp: false });
        console.log(`${result.deletedCount} documents deleted`);
        
        
        // console.log(mailid);
    } else {
        res.render("otp1", { existerorr: "Failed" });
    }
    // Use the values as needed
    console.log("OTP Values:", otpValue1, otpValue2, otpValue3, otpValue4);
};

let generettedOtp;

// Handle the POST request to /sendotp
const sendotp = async (req, res) => {
  const { email } = await req.body
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

const logincheck = async (req, res) => {
// console.log(req.body.email);
// console.log(req.body.password);



    let usercheck = await user.findOne({ email: req.body.email });

    if (usercheck && (await comparePasswords(req.body.password, usercheck.password))  && usercheck.otp == true && usercheck.Status == true  ) {
        req.session.user=req.body.email
        req.session.userid=usercheck._id
     

        res.redirect("/login");
    } else {
        if (usercheck.Status == false) {
            res.render("login", { message: "User blocked" });
        }
        else{
        res.render("login", { message: "Invalid username or password" });
            }
    }
}




// userController

const fullpdt = async (req, res) => {
    try {
        // Fetch categories with Status set to true
        const activeCategories = await catdb.find({ Status: true });

        // Extract category names from the active categories
        const activeCategoryNames = activeCategories.map(category => category.subName);

        // Fetch products that belong to the active categories
        const products = await ptd.find({ category: { $in: activeCategoryNames } });

        // Render the 'fullpdt' template and pass the filtered products as a variable
        res.render("fullpdt", { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
};





// =====================product ====================

const product = async (req, res) => {
    const productId = req.params.id;

    try {
        const product = await ptd.findOne({ _id: productId });
        const products = await ptd.find().limit(4);  // Use find() instead of findOne()

        res.render("product", { product, products });
    } catch (error) {
        console.error('Error finding product:', error);
    }
};


// =====================Profile ====================

const profile=async(req,res)=>{
    // const fromprofile = await req.query.tab;

    const userId = await req.session.userid;  // Corrected syntax
    const userdata = await user.findById(userId);
    const addresses= await userdata.addresses
    const orders = await orderdb.find().populate({
        path: "Products.products",
        model: "Product", // Make sure it matches the model name for the Product
});

const selectedTab = await req.query.tab || 'defaultTab';

    res.render("profile",{addresses,orders,selectedTab,userId});


}

// =====================delete Address ====================
const deleteAddress = async (req, res) => {
    
    try {
        const indexToDelete = req.params.id;
        const userId = await req.session.userid;
        // Step 1: Set the value at the specified index to null
        await user.findByIdAndUpdate(
            userId,
            { $set: { [`addresses.${indexToDelete}`]: null } }
        );

        // Step 2: Remove null values from the array
        const userc = await user.findByIdAndUpdate(
            userId,
            { $pull: { addresses: null } },
            { new: true }
        );

        if (!userc) {
            console.log("fuc");
            return res.status(404).json({ error: 'User not found' });
        } 
        
        console.log('Before redirect');
        res.redirect('/profile?tab=address');
        console.log('After redirect');
        
            
        
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};





const editAddress = async (req, res) => {
    const userId = req.session.userid; // Assuming you have the user's ID in the session
  
    try {
      // Fetch the user data from the database
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Extract the address index from the request parameters
      const addressIndex = req.params.id;
  
      // Ensure the address index is valid
      if (addressIndex < 0 || addressIndex >= user.addresses.length) {
        return res.status(400).json({ error: 'Invalid address index' });
      }
  
      // Get the existing address data
      const existingAddress = user.addresses[addressIndex];
  
      // Render a form with the existing address data for the user to edit
      res.render('editAddressForm', { existingAddress });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };






const trial = (req, res) => {
    res.render("profile");
};

module.exports = {
    home,
    signup,
    trial,
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
    editAddress
};
