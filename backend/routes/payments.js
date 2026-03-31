const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Case = require('../models/Case');
const Lawyer = require('../models/Lawyer');
const authMiddleware = require('../middleware/authMiddleware');
const { emitCaseUpdate } = require('../socket');

const router = express.Router();
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

const razorpay =
  razorpayKeyId && razorpayKeySecret
    ? new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      })
    : null;

function ensureRazorpayConfigured(res) {
  if (!razorpay) {
    res.status(500).json({ error: 'Razorpay is not configured on the server' });
    return false;
  }

  return true;
}

function normalizeMilestones(milestones) {
  if (!Array.isArray(milestones)) {
    return [];
  }

  return milestones
    .map((item) => ({
      title: String(item?.title || '').trim(),
      amount: Number(item?.amount) || 0,
      status: 'pending',
    }))
    .filter((item) => item.title && item.amount > 0);
}

router.get('/config', authMiddleware, (req, res) => {
  if (!ensureRazorpayConfigured(res)) {
    return;
  }

  res.json({
    keyId: razorpayKeyId,
    currency: 'INR',
  });
});

// Create Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only users can initiate payments' });
    }

    if (!ensureRazorpayConfigured(res)) {
      return;
    }

    const {
      caseId,
      lawyerId,
      amount,
      pricingType,
      milestones,
      paymentMethod,
    } = req.body;
    const clientId = req.user.id;

    if (!caseId || !lawyerId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [caseDoc, lawyer] = await Promise.all([
      Case.findById(caseId),
      Lawyer.findById(lawyerId),
    ]);

    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    if (caseDoc.userId.toString() !== clientId) {
      return res.status(403).json({ error: 'You can only pay for your own case' });
    }

    if (caseDoc.status !== 'open') {
      return res.status(400).json({ error: 'Payment can only be started for an open case' });
    }

    const normalizedAmount = Number(amount);
    const normalizedMilestones = pricingType === 'milestone' ? normalizeMilestones(milestones) : [];
    const payableAmount = pricingType === 'milestone'
      ? normalizedMilestones.reduce((sum, item) => sum + item.amount, 0)
      : normalizedAmount;

    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100),
      currency: 'INR',
      receipt: `case_${caseId}_${Date.now()}`.slice(0, 40),
      notes: {
        caseId: String(caseId),
        lawyerId: String(lawyerId),
        clientId: String(clientId),
      },
    });

    const payment = new Payment({
      caseId,
      clientId,
      lawyerId,
      amount: payableAmount,
      pricingType: pricingType || 'fixed',
      status: 'pending',
      milestones: normalizedMilestones,
      paymentMethod: paymentMethod || 'card',
      razorpayOrderId: order.id,
      currency: 'INR',
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment order created successfully',
      payment,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      lawyer: {
        name: lawyer.name,
        email: lawyer.email,
        contact: lawyer.phone,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Error creating payment' });
  }
});

router.post('/verify', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only users can verify payments' });
    }

    if (!ensureRazorpayConfigured(res)) {
      return;
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing Razorpay verification fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
      clientId: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment has already been processed' });
    }

    const [caseDoc, lawyer] = await Promise.all([
      Case.findById(payment.caseId).populate('userId', 'name email'),
      Lawyer.findById(payment.lawyerId),
    ]);

    if (!caseDoc || !lawyer) {
      return res.status(404).json({ error: 'Associated case or lawyer not found' });
    }

    if (caseDoc.status !== 'open') {
      return res.status(400).json({ error: 'This case is no longer available for assignment' });
    }

    payment.status = 'in-escrow';
    payment.transactionId = razorpayPaymentId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    await payment.save();

    caseDoc.assignedLawyer = lawyer._id;
    caseDoc.status = 'assigned';
    await caseDoc.save();

    lawyer.activeCases = [...new Set([...lawyer.activeCases.map(String), String(caseDoc._id)])];
    lawyer.casesTotal += 1;
    await lawyer.save();

    const populatedCase = await caseDoc.populate('assignedLawyer', 'name email phone location rating totalRatings specializations');
    emitCaseUpdate(populatedCase, { action: 'accepted' });

    res.json({
      message: 'Payment verified successfully',
      payment,
      case: populatedCase,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Error verifying payment' });
  }
});

// Get payment details
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId)
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email')
      .populate('caseId', 'title');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Error fetching payment' });
  }
});

// Get payments for case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const payments = await Payment.find({ caseId })
      .populate('clientId', 'name')
      .populate('lawyerId', 'name');

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Error fetching payments' });
  }
});

// Release payment from escrow
router.post('/:paymentId/release', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    payment.status = 'released';
    await payment.save();

    res.json({
      message: 'Payment released successfully',
      payment,
    });
  } catch (error) {
    console.error('Error releasing payment:', error);
    res.status(500).json({ error: 'Error releasing payment' });
  }
});

// Mark milestone complete
router.post('/:paymentId/milestone/:milestoneIndex/complete', authMiddleware, async (req, res) => {
  try {
    const { paymentId, milestoneIndex } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (milestoneIndex >= payment.milestones.length) {
      return res.status(400).json({ error: 'Invalid milestone index' });
    }

    payment.milestones[milestoneIndex].status = 'completed';
    payment.milestones[milestoneIndex].completedAt = new Date();

    const allCompleted = payment.milestones.every(m => m.status === 'completed');
    if (allCompleted) {
      payment.status = 'completed';
    }

    await payment.save();

    res.json({
      message: 'Milestone completed',
      payment,
    });
  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({ error: 'Error completing milestone' });
  }
});

// Get lawyer's average fees
router.get('/lawyer/:lawyerId/fees', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const payments = await Payment.find({
      lawyerId,
      status: { $in: ['released', 'completed'] },
    });

    if (payments.length === 0) {
      return res.json({
        averageFee: 0,
        minFee: 0,
        maxFee: 0,
        totalPayments: 0,
      });
    }

    const amounts = payments.map(p => p.amount);
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    const averageFee = totalAmount / payments.length;
    const minFee = Math.min(...amounts);
    const maxFee = Math.max(...amounts);

    res.json({
      averageFee: parseFloat(averageFee.toFixed(2)),
      minFee,
      maxFee,
      totalPayments: payments.length,
    });
  } catch (error) {
    console.error('Error fetching lawyer fees:', error);
    res.status(500).json({ error: 'Error fetching lawyer fees' });
  }
});

module.exports = router;
