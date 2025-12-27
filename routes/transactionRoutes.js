const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { fetchTransactions, addTransaction, updateTransaction, deleteTransaction, downloadTransactionExcel, scanReceipt } = require("../controllers/transactionController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if(file.mimetype.startsWith('image/')){
            cb(null, true)
        } else{
            cb(new Error("Only image files are allowed"), false)
        }
    }
})

router.get("/", protect, fetchTransactions);
router.post("/", protect, addTransaction);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);
router.get("/downloadexcel", protect, downloadTransactionExcel);
router.post("/scanreceipt", protect, upload.single('receipt'), scanReceipt);

module.exports = router