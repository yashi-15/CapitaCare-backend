const { json } = require("express");
const Transaction = require("../models/Transaction");

exports.fetchReports = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(404).json({ message: "User not found" });
    }

    try {
        const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });
        const incomes = transactions.filter((transac) => transac.type === "income");
        const expenses = transactions.filter((transac) => transac.type === "expense");

        const totalIncome = incomes.reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalExpense = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalBalance = totalIncome - totalExpense;

        const recentTransactions = transactions.slice(0, 5);
        const recentIncomes = incomes.slice(0, 5);
        const recentExpenses = expenses.slice(0, 5);

        const colors = ["#2848ff", "#36932e", "#FFBB28", "#9b2929", "#bc3385"];

        //recent transaction pie chart data
        const recentTransactionPieChartData = [];

        recentTransactions.forEach((transaction, index) => {
            const existingIndex = recentTransactionPieChartData.findIndex((item) => item.name.toLowerCase().trim() == transaction.category.toLowerCase().trim());

            if (existingIndex !== -1) {
                recentTransactionPieChartData[existingIndex].value += transaction.amount;
            } else {
                recentTransactionPieChartData.push({
                    name: transaction.category.trim(),
                    value: transaction.amount,
                    fill: colors[index % colors.length ],
                });
            }
        });

        //recent incomes pie chart data
        const recentIncomesPieChartData = [];

        recentIncomes.forEach((transaction, index) => {
            const existingIndex = recentIncomesPieChartData.findIndex((item) => item.name.toLowerCase().trim() == transaction.category.toLowerCase().trim());

            if (existingIndex !== -1) {
                recentIncomesPieChartData[existingIndex].value += transaction.amount;
            } else {
                recentIncomesPieChartData.push({
                    name: transaction.category.trim(),
                    value: transaction.amount,
                    fill: colors[index % colors.length ],
                });
            }
        });

        return res.json({ totalBalance, totalIncome, totalExpense, recentTransactions, recentIncomes, recentExpenses, recentTransactionPieChartData, recentIncomesPieChartData });
    } catch (err) {
        res.status(500).json({ message: "Error fetching data", error: err.message });
    }
};
