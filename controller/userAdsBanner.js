const fs = require("fs");
const pdf = require("html-pdf"); // You may need to install this package
const Order = require("../model/order");

const generateSalesReport = async (req, res) => {
    console.log("Start Date from Request:", req.body["start-date"]);
    console.log("End Date from Request:", req.body["end-date"]);

    try {
        const startDate = req.body["start-date"];
        const endDate = req.body["end-date"];
        // Validate dates
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Convert dates to JavaScript Date objects with time included
        const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
        const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

        // Use aggregation to fetch orders within the specified date range
        const orders = await Order.aggregate([
            {
                $match: {
                    date: { $gte: startDateTime, $lte: endDateTime },
                },
            },
            // Add more aggregation stages if needed
        ]);

        console.log("Orders Count:", orders.length);
// console.log(orders,startDate,endDate);
        // Send the response with the orders, start date, and end date
        return res.status(200).json({
            orders: orders,
            startDate: startDate,
            endDate: endDate,
        });
    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" });
    }
};


// Helper function to check if a date is valid
const isValidDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    const isDate = dateRegex.test(dateString);

    // console.log("isDate:", isDate);

    return isDate;
};










const salesReport = async (req, res) => {
    res.render("salesReport");
};

const bannersAdmin = async (req, res) => {
    res.render("banner");
};

module.exports = {
    bannersAdmin,
    salesReport,
    generateSalesReport,
};








{/* <script>
    document.getElementById('generateReportBtn').addEventListener('click', async () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        try {
            const response = await fetch('/generate_report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 'start-date': startDate, 'end-date': endDate }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }else{
                console.log("jjjj")
            }

            const data = await response.json();
            document.getElementById('reportContent').textContent = data.salesReport;
            document.getElementById('reportPreview').style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
        }
    });

    document.getElementById('downloadReportBtn').addEventListener('click', async () => {
        // You can add logic here to trigger the download
        // For example, you can use Blob to create a downloadable file
        const content = document.getElementById('reportContent').textContent;
        const blob = new Blob([content], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'sales_report.pdf';
        link.click();
    });
</script> */}