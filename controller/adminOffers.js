const Offer = require('../model/offerModal'); // Adjust the path accordingly
const Product = require('../model/pdtmodel');


const Offers = async (req, res) => {
    try {
        const allOffers = await Offer.find();

        res.render("Offer", { offers: allOffers });
    } catch (error) {
                console.error('Error fetching offers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const addOfferToDatabase = async (offerData) => {
    try {
        const newOffer = new Offer(offerData);
        await newOffer.save();
        console.log('Offer added to the database:', newOffer);
        return newOffer;
    } catch (error) {
        console.error('Error adding offer to the database:', error);
        throw error;
    }
};

const adminOffers = async (req, res) => {
    const offerData = req.body;

    try {
        const addedOffer = await addOfferToDatabase(offerData);
        // You can send a response to the client or perform additional actions here if needed
        res.status(200).json({ message: 'Offer added successfully', offer: addedOffer });
    } catch (error) {
        // Handle errors appropriately, e.g., send an error response to the client
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const OffersAdminManagement = async (req, res) => {
    try {
        let manage = req.params.manage;
        let offerId = req.query.offerId;


        const existingOffer = await Offer.findById(offerId);

        if (!existingOffer) {
            return res.status(404).json({ error: "Offer not found" });
        }

        if (manage === "update") {
            const updatedOfferData = req.body;

            // Update the existing offer with the new data
            existingOffer.name = updatedOfferData.name;
            existingOffer.discountPercentage = updatedOfferData.discountPercentage;
            existingOffer.startDate = updatedOfferData.startDate;
            existingOffer.endDate = updatedOfferData.endDate;

            // Save the updated offer to the database
            await existingOffer.save();

            // Optionally, you can send a success response
            return res.status(200).json({ message: "Offer updated successfully", updatedOffer: existingOffer });
        } else if (manage === "delete") {
            // Delete the existing offer from the database
            const result = await Offer.deleteOne({ _id: offerId });

            if (result.deletedCount > 0) {
                // Successfully deleted the offer
                return res.status(200).json({ message: "Offer deleted successfully" });
            } else {
                // Offer not found or not deleted
                return res.status(404).json({ error: "Offer not found or could not be deleted" });
            }
        } else if (manage === "activate") {
            existingOffer.offerActive = "Not";
            await existingOffer.save();

            return res.status(200).json({ message: "Offer deactivated successfully" });
        } else if (manage === "deactivate") {
            existingOffer.offerActive = "Active";

            // Save the updated offer to the database
            await existingOffer.save();

            // Optionally, you can send a success response
            return res.status(200).json({ message: "Offer activated successfully", updatedOffer: existingOffer });
        } else {
            return res.status(400).json({ error: "Invalid management action" });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



const applyoffer = async (req, res) => {
    const productId = req.params.id;
    const { discountPercentage } = req.body;

    try {
        // Retrieve the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
let temp=product.price
        // Calculate the discounted price
        const discountAmount = (discountPercentage / 100) * product.price;
        const discountedPrice = product.price - discountAmount;

        if (!product.singleOffer) {
            product.singleOffer = [];
        }


        // Update the product with the discounted price and offer details
        product.priceoffer = temp;
        product.price = discountedPrice; // Update the original price to the discounted price
        product.singleOffer.push({
            date: new Date(),
            discountPercentage,
            discountedAmount: discountAmount,
        });

        // Save the updated product
        await product.save();

        return res.status(200).json({ message: 'Offer applied successfully', product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const canceloffer = async (req, res) => {
    const productId = req.params.id;

    try {
        // Retrieve the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if there is any applied offer to cancel
        if (product.singleOffer && product.singleOffer.length > 0) {
            // Get the details of the last applied offer
            // const lastOffer = product.singleOffer.pop();

            // Revert the changes made by the applyoffer function
            product.price = product.priceoffer;
            product.priceoffer=null


            // Save the updated product
            await product.save();
            return res.status(200).json({ message: 'Offer canceled successfully', product });
            
        } else {
            return res.status(400).json({ message: 'No offer to cancel' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};





module.exports = {
    Offers,
    adminOffers,
    OffersAdminManagement,
    applyoffer,
    canceloffer
}
