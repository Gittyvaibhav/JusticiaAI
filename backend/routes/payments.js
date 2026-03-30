const express = require('express');
const Payment = require('../models/Payment');
const Case = require('../models/Case');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create payment/booking for lawyer
router.post('/create', authMiddleware, async (req, res) => {
  try {
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

    const payment = new Payment({
      caseId,
      clientId,
      lawyerId,
      amount,
      pricingType: pricingType || 'fixed',
      status: 'in-escrow',
      milestones: milestones || [],
      paymentMethod: paymentMethod || 'card',
    });

    await payment.save();

    // Update case
    await Case.findByIdAndUpdate(caseId, {
      assignedLawyer: lawyerId,
      status: 'assigned',
    });

    res.status(201).json({
      message: 'Payment created successfully',
      payment,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Error creating payment' });
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
