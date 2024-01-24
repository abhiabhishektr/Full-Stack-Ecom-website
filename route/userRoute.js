const express=require('express')
const router= express()
const userController =require("../controller/userController")
const cartController =require("../controller/cartController")
const checkOutPage=require("../controller/checkOutPage")
const userMid=require("../middleware/usermid")
const session = require('express-session');

router.set("view engine","ejs")
router.set('views','views/user')


router.use(session({
    secret: 'your-secret-key',//env
    resave: false,
    saveUninitialized: true
  }));




router.get('/',userController.home)


router.get('/login',userMid.islogout,userMid.isblock,userController.login)
router.get('/forgotPassword',userController.forgotPassword)
router.post('/forgotPassword',userController.forgotPasswordReset)
router.get('/resetPassword',userController.resetPassword)
router.post('/resetPassword',userController.resetPasswordPost)

router.post('/signup',userController.signup)


router.get('/otp',userController.otp)


router.post('/otpvalidation',userController.otpvalidation)


router.post('/sendotp',userController.sendotp)

// router.get('/trial', (req, res) => {
//   res.render("404");
// });


// ===============================product=====================
router.get('/fullpdt/:MainCat',userController.fullpdt)

router.post('/loginSubmit',userController.logincheck)

// =====================product=============
router.get('/product/:id',userController.product)

//=====================================================
// ======================  CART   ==================
//===================================================
router.get('/cart',userMid.islogin,cartController.cart)
router.put('/updatecart/:id',cartController.updatecart)
router.post('/updatequantity',cartController.updateCartDetails)
router.get('/paymentmethod',cartController.paymentmethod)
router.post('/addAddress/:id',cartController.addAddress)
// router.post('/checkOut',cartController.checkOut)
router.put('/cart/:productId',cartController.cartItemRemove)
//=====================================================
// ======================  CHECK OUT  ==================
//===================================================
router.post('/checkOut/:paymentOption',checkOutPage.checkOut)
//=====================================================
// ======================  PROFILE   ==================
//===================================================
router.get('/profile',userMid.islogin,userController.profile)
router.get('/editAddress',userController.editAddress)
router.post('/deleteAddress/:id',userController.deleteAddress)



router.put('/orderStatusUpdation/:id',userController.orderStatusUpdation)

router.patch('/updateMobile',userController.updateMobile)
router.patch('/passwordChange',userController.passwordChange)
router.post('/updateAddress/:id',userController.updateAddress)
router.get('/orderDetails/:orderId',userController.orderDetails)

  

router.get('/error', (req, res) => {
  res.render("404");
});
router.get('*', (req, res) => {
  res.redirect('/error');
});


module.exports=router