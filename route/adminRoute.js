const express = require("express");
const router = express();
const bodyParser=require('body-parser')
const adminMid=require("../middleware/adminMid")
router.set("view engine", "ejs");
router.set("views", "views/admin");

const adminController = require("../controller/adminController");
const userAdsBanner =require('../controller/userAdsBanner')


router.get('/adminDash/netIncome', adminController.getNetIncomeData);
router.get('/adminDash/pie', adminController.getPieDia);
router.get('/adminDash/earningWave', adminController.earningWave);
router.get('/adminDash/orderStatus', adminController.orderStatus);

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



//========Sales Reports ========
router.get("/salesReports",userAdsBanner.salesReport);

router.post('/generate_report',userAdsBanner.generateSalesReport);

//========banner and Advertisement ========



router.get("/bannersAdmin",userAdsBanner.bannersAdmin);

router.get("/CouponsAdmin",userAdsBanner.CouponsAdmin);

router.get("/CouponsAdmin",userAdsBanner.CouponsAdminPost);




// router.get('/error', (req, res) => {
//     res.render("404");
//   });
//   router.get('*', (req, res) => {
//     res.redirect('/error');
//   });
  




module.exports = router;



{/* <script>
    window.onbeforeunload = function() {
        // Redirect to another page
        window.location.href = '';
        return false; // This is needed for some older browsers
    };
</script> */}