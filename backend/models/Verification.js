const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true,
    unique: true,
  },
  barCouncilVerified: {
    type: Boolean,
    default: false,
  },
  barCouncilVerificationDate: Date,
  experienceVerified: {
    type: Boolean,
    default: false,
  },
  successRateVerified: {
    type: Boolean,
    default: false,
  },
  badges: [
    {
      type: String,
      enum: ['verified', 'bar-certified', 'top-rated', 'affordable', 'responsive'],
    },
  ],
  verificationLevel: {
    type: String,
    enum: ['none', 'basic', 'verified', 'premium'],
    default: 'none',
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

module.exports = mongoose.model('Verification', verificationSchema);
