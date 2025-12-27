const express = require('express')
const {protect} = require('../middleware/authMiddleware')
const {fetchReports} = require("../controllers/reportsController")

const router = express.Router()

router.get("/", protect, fetchReports)

module.exports = router