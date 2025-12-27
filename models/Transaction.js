const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {type: String, enum: ['income', 'expense'], required: true},
    amount: {type: Number, required: true, min:[0.01, 'Amount must be greater than 0'] },
    emoji: {type:String},
    category: {type: String, required: true},
    date: {type: Date, default: Date.now},
    note: {type: String, maxLength: [500, 'Note cannot exceed 500 characters' ]},
    receiptUrl: {type: String}
}, {
    timestamps: true
})

module.exports = mongoose.model("Transaction", TransactionSchema)