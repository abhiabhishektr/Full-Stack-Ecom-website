const express=require('express')
const router= express()
const userController =require("../controller/userController")
const cartController =require("../controller/cartController")
const userMid=require("../middleware/usermid")
const session = require('express-session');

router.set("view engine","ejs")
router.set('views','views/user')


router.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
  }));




router.get('/',userController.home)


router.get('/login',userMid.islogout,userMid.isblock,userController.login)

router.post('/signup',userController.signup)


router.get('/otp',userController.otp)


router.post('/otpvalidation',userController.otpvalidation)


router.post('/sendotp',userController.sendotp)


router.get('/trial',userController.trial)
// ===============================product=====================
router.get('/fullpdt',userController.fullpdt)


router.post('/loginSubmit',userController.logincheck)

// =====================product=============
router.get('/product/:id',userController.product)

//=====================================================
// ======================  CART   ==================
//===================================================
router.get('/cart',cartController.cart)
router.get('/updatecart/:id',cartController.updatecart)
router.post('/updatequantity',cartController.updateCartDetails)
router.get('/paymentmethod',cartController.paymentmethod)
router.post('/addAddress/:id',cartController.addAddress)
router.post('/checkOut',cartController.checkOut)
//=====================================================
// ======================  PROFILE   ==================
//===================================================
router.get('/profile',userController.profile)
router.get('/editAddress',userController.editAddress)
router.post('/deleteAddress/:id',userController.deleteAddress)








  




module.exports=router