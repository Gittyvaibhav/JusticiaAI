const mongoose = require('mongoose');

const allowedCaseTypes = [
  'criminal',
  'civil',
  'property',
  'family',
  'corporate',
  'labor',
  'tax',
  'consumer',
];

const caseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  caseType: {
    type: String,
    required: true,
    enum: allowedCaseTypes,
  },
  location: {
    type: String,
    trim: true,
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  aiAdvice: String,
  aiCaseSummary: String,
  aiRelevantLaws: String,
  aiNextSteps: String,
  aiCaseStrength: String,
  aiLawyerTypeNeeded: String,
  assignedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  documents: [
    {
      type: String,
      trim: true,
    },
  ],
  outcome: {
    type: String,
    enum: ['won', 'lost', 'settled', 'pending'],
    default: 'pending',
  },
  lawyerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  lawyerReview: String,
}, {
  timestamps: true,
});

caseSchema.statics.allowedCaseTypes = allowedCaseTypes;

module.exports = mongoose.model('Case', caseSchema);
