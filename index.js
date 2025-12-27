const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const reportsRoutes = require("./routes/reportsRoutes");

const app = express();

app.use(express.json());

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = ["https://capita-care-frontend.vercel.app", "http://localhost:5173"];

        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", reportsRoutes);

app.get("/", (req, res) => {
    res.send("Capita Care Backend is running 🚀");
});

module.exports = app;
