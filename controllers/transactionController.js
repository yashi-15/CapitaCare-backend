const xlsx = require("xlsx");
const Transaction = require("../models/Transaction");
const {GoogleGenerativeAI} = require("@google/generative-ai");

const getTransactionsForThePeriod = async (userId, mon, yr, type) => {
    const currentDate = new Date();
    const month = mon || currentDate.getMonth() + 1;
    const year = yr || currentDate.getFullYear();

    if (month < 1 || month > 12) {
        return res.status(400).json({
            message: "Month must be between 1 and 12",
        });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const query = {
        user: userId,
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    }

    if(type && (type === 'income' || type=== 'expense') ){
        query.type = type
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    return transactions;
};

exports.fetchTransactions = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(404).json({ message: "User not found" });
    }

    try {
        const month = parseInt(req.query.month);
        const year = parseInt(req.query.year);
        const type = req.query.type;

        const transactions = await getTransactionsForThePeriod(userId, month, year, type);

        const total = transactions.length;

        //for chart data
        const getWeekNumber = (date) => {
            const dateNum = new Date(date).getDate();
            return Math.ceil(dateNum / 7);
        };

        const weeklyData = {
            week1: { income: 0, expense: 0 },
            week2: { income: 0, expense: 0 },
            week3: { income: 0, expense: 0 },
            week4: { income: 0, expense: 0 },
            week5: { income: 0, expense: 0 },
        };

        transactions.forEach((transaction) => {
            const weekNum = getWeekNumber(transaction.date);
            const weekName = `week${weekNum}`;
            if (weeklyData[weekName]) {
                weeklyData[weekName][transaction.type] += transaction.amount;
            }
        });

        const chartData = Object.keys(weeklyData).map((weekKey, index) => ({
            week: index + 1,
            weekLabel: `Week ${index + 1}`,
            income: weeklyData[weekKey].income,
            expense: weeklyData[weekKey].expense,
            net: weeklyData[weekKey].income - weeklyData[weekKey].expense,
        }));

        return res.json({
            data: transactions,
            chartData,
            month: month,
            year: year,
            totalItems: total,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching transactions", error: err.message });
    }
};
exports.addTransaction = async (req, res) => {
    const { type, amount, emoji, category, date, note, receiptUrl } = req.body;
    const userId = req.user.id;

    if (!type || !amount || !category) {
        return res.status(400).json({ message: "Type, Amount and Category fields are necessary" });
    }

    if (!["income", "expense"].includes(type)) {
        res.status(400).json({ message: "Type must be 'income' or 'expense'" });
    }

    if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (note && note.length > 500) {
        return res.status(400).json({ message: "Note cannot exceed 500 characters" });
    }

    try {
        const transaction = new Transaction({
            user: userId,
            type,
            amount,
            emoji,
            category,
            date: date ? new Date(date) : Date.now(),
            note,
            receiptUrl,
        });

        await transaction.save();

        res.status(200).json({
            transaction,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({
                message: "Validation error",
                error: err.message,
            });
        }
        res.status(500).json({
            message: "Error adding transaction",
            error: err.message,
        });
    }
};
exports.updateTransaction = async (req, res) => {
    const { type, amount, emoji, category, date, note, receiptUrl } = req.body;

    if (type && !["income", "expense"].includes(type)) {
        res.status(400).json({ message: "Type must be 'income' or 'expense'" });
    }

    if (amount && amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (note && note.length > 500) {
        return res.status(400).json({ message: "Note cannot exceed 500 characters" });
    }
    try {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { type, amount, emoji, category, date, note, receiptUrl },
            {
                new: true,
                runValidators: true,
            }
        );
        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found or unauthorized",
            });
        }

        res.json({ transaction });
    } catch (err) {
        res.status(500).json({ message: "Error updating transaction" });
    }
};
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found or unauthorized",
            });
        }
        res.json({ message: "Transaction deleted successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.downloadTransactionExcel = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(404).json({ message: "User not found" });
    }
    try {
        const month = parseInt(req.query.month);
        const year = parseInt(req.query.year);
        const type = req.query.type || "all";

        const transactions = await getTransactionsForThePeriod(userId, month, year);
        let jsonTransactions = [];
        if (type === "all") {
            jsonTransactions = transactions.map((item) => ({
                type: item.type,
                category: item.category,
                amount: item.amount,
                date: new Date(item.date).toISOString().split("T")[0],
            }));
        } else {
            jsonTransactions = transactions
                .filter((transaction) => transaction.type === type)
                .map((item) => ({
                    category: item.category,
                    amount: item.amount,
                    date: new Date(item.date).toISOString().split("T")[0],
                }));
        }
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(jsonTransactions);
        xlsx.utils.book_append_sheet(workbook, worksheet, "Transactions");
        xlsx.writeFile(workbook, `${type}_details_${month}_${year}.xlsx`);
        res.download(`${type}_details_${month}_${year}.xlsx`);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);        
        const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

        const base64String = req.file.buffer.toString("base64");

        const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64String,
                    mimeType: req.file.mimetype,
                },
            },
        ]);

        const response = await result.response;        
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        try {
            const data = JSON.parse(cleanedText);
            // Check if empty object (not a receipt)
            if (Object.keys(data).length === 0) {
                return res.status(400).json({
                    message: "Could not extract receipt information from image",
                });
            }
            return res.status(200).json({
                amount: parseFloat(data.amount),
                date: new Date(data.date),
                category: data.category,
            });
        } catch (parseError) {
            console.error("Error parsing JSON response", parseError);
            throw new Error("Invalid response format from gemini");
        }
    } catch (err) {        
        res.status(500).json({ message: "Internal server error" });
    }
};
