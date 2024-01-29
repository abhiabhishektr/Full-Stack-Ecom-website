// cartCountMiddleware.js

const cartdb = require('../model/cartmodel');

const cartCountMiddleware = async (req, res, next) => {
    try {
        if (req.session.userid) {
            const userCart = await cartdb.findOne({ user: req.session.userid });
            req.cartCount = userCart && userCart.products ? userCart.products.length : 0;
        } else {
            req.cartCount = 0;
        }
        next();
    } catch (error) {
        console.error("Error while fetching cart count", error);
        res.status(500).render("error", { error: "Internal Server Error" });
    }
};

module.exports = cartCountMiddleware;
