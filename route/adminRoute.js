const express = require("express");
const router = express();
const bodyParser=require('body-parser')
const adminMid=require("../middleware/adminMid")
router.set("view engine", "ejs");
router.set("views", "views/admin");





const adminController = require("../controller/adminController");






router.get("/admin",adminMid.islogin, adminController.admin);
router.get('/adminsignout',adminController.adminsignout)


router.get("/allusers",adminMid.islogin, adminController.allusers);
// ----block and unblock-------
router.post("/userblock/:id", adminController.block);
router.post("/userunblock/:id", adminController.unblock);
// --------user delete
router.post("/userdelete/:id", adminController.userdelete);
// --------allproducts
router.get("/allproducts",adminMid.islogin, adminController.allproducts);
// --------newproducts
router.get("/newproducts",adminMid.islogin, adminController.newproducts);

// ======================category=====================
router.get("/category",adminMid.islogin, adminController.category);
router.post("/category", adminController.addcategory);
router.post("/Cblock/:id", adminController.Cblock);
router.post("/Cdelete/:id",adminController.deletecategory); 
router.post("/Cunblock/:id", adminController.Cunblock);
// router.post("/Cupdate/:id", adminController.Cupdate);
//====================Login======================

router.get("/adminlog",adminMid.islogout, adminController.adminlog);
router.post("/adminlogcheck", adminController.adminlogcheck);

// ============================
router.post("/newproducts", adminController.upload.array("images", 4), adminController.addproduct);

//=========== product==============
router.get("/editproduct/:id",adminMid.islogin, adminController.editproduct);
// router.post("/updateproduct/:id", adminController.updateproduct); 
router.post("/updateproduct/:id", adminController.upload.array("replaceImages", 4), adminController.updateproduct);
router.get('/deleteimage',adminController.deleteimage)
// , adminController.upload.array("images", 4)
router.post("/deleteproduct/:id",adminController.deleteproduct); 
router.get("/productunblock/:id",adminController.productunblock);
router.get("/blockproduct/:id",adminController.blockproduct);

// ==========Orders=========
router.get("/OrdersAdmin",adminController.OrdersAdmin);
router.put("/OrdersStatus/:id",adminController.OrdersStatus);

module.exports = router;



