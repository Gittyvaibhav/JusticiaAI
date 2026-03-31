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
  aiProceduralChecklist: String,
  aiDocumentsNeeded: String,
  aiLikelyForum: String,
  aiExpectedTimeline: String,
  aiKeyRisks: String,
  aiCaseStrength: String,
  aiLawyerTypeNeeded: String,
  aiLawyerFitRationale: String,
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
  outcomeDescription: String,
  outcomeDate: Date,
  lawyerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  lawyerReview: String,
  budget: {
    type: Number,
    min: 0,
  },
  matchingScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  caseTimeline: {
    startDate: {
      type: Date,
      default: Date.now,
    },
    estimatedEndDate: Date,
    actualEndDate: Date,
  },
}, {
  timestamps: true,
});

caseSchema.statics.allowedCaseTypes = allowedCaseTypes;

module.exports = mongoose.model('Case', caseSchema);
