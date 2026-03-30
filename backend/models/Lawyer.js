const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const allowedSpecializations = [
  'criminal',
  'civil',
  'property',
  'family',
  'corporate',
  'labor',
  'tax',
  'consumer',
];

const lawyerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['lawyer'],
    default: 'lawyer',
  },
  barCouncilId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  specializations: [
    {
      type: String,
      enum: allowedSpecializations,
    },
  ],
  experience: {
    type: Number,
    default: 0,
    min: 0,
  },
  casesTotal: {
    type: Number,
    default: 0,
    min: 0,
  },
  casesWon: {
    type: Number,
    default: 0,
    min: 0,
  },
  casesLost: {
    type: Number,
    default: 0,
    min: 0,
  },
  winRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0,
  },
  bio: {
    type: String,
    trim: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  pricingType: {
    type: String,
    enum: ['hourly', 'fixed', 'both'],
    default: 'fixed',
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageFixedFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  feesByPracticeArea: [
    {
      area: String,
      fee: Number,
    },
  ],
  badges: [
    {
      type: String,
      enum: ['verified', 'bar-certified', 'top-rated', 'affordable', 'responsive'],
    },
  ],
  responseTime: {
    type: String,
    default: '24-48 hours',
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  languages: [String],
  activeCases: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

lawyerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

lawyerSchema.pre('save', function calculateWinRate(next) {
  this.winRate = this.casesTotal > 0 ? (this.casesWon / this.casesTotal) * 100 : 0;
  next();
});

lawyerSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

lawyerSchema.statics.allowedSpecializations = allowedSpecializations;

module.exports = mongoose.model('Lawyer', lawyerSchema);
