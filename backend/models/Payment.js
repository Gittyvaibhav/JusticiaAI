const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  pricingType: {
    type: String,
    enum: ['hourly', 'fixed', 'milestone'],
    default: 'fixed',
  },
  status: {
    type: String,
    enum: ['pending', 'in-escrow', 'released', 'returned', 'completed'],
    default: 'pending',
  },
  milestones: [
    {
      title: String,
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
      },
      completedAt: Date,
    },
  ],
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ['card', 'bank', 'upi', 'wallet'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
