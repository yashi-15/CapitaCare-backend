require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes")
const transactionRoutes = require("./routes/transactionRoutes")
const reportsRoutes = require("./routes/reportsRoutes")

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

connectDB();

app.use("/api/auth", authRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/dashboard", reportsRoutes)

app.get("/", (req, res) => {
  res.send("Capita Care Backend is running 🚀");
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
