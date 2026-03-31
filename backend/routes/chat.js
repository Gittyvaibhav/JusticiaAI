const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const ChatMessage = require('../models/ChatMessage');
const Case = require('../models/Case');
const { getCaseParticipantContext } = require('../utils/caseAccess');
const { serializeChatMessage } = require('../socket');

const router = express.Router();

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const caseQuery = req.user.role === 'lawyer'
      ? { assignedLawyer: req.user.id }
      : { userId: req.user.id, assignedLawyer: { $ne: null } };

    const cases = await Case.find(caseQuery)
      .sort({ updatedAt: -1 })
      .select('title status updatedAt userId assignedLawyer')
      .populate('userId', 'name role')
      .populate('assignedLawyer', 'name role')
      .lean();

    if (!cases.length) {
      return res.status(200).json({ conversations: [] });
    }

    const caseIds = cases.map((item) => item._id);
    const latestMessages = await ChatMessage.find({ caseId: { $in: caseIds } })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name role')
      .lean();

    const latestByCaseId = new Map();
    latestMessages.forEach((message) => {
      const key = String(message.caseId);

      if (!latestByCaseId.has(key)) {
        latestByCaseId.set(key, serializeChatMessage(message));
      }
    });

    const conversations = cases.map((caseDoc) => {
      const caseId = String(caseDoc._id);
      const counterpart = req.user.role === 'lawyer' ? caseDoc.userId : caseDoc.assignedLawyer;

      return {
        caseId,
        title: caseDoc.title,
        status: caseDoc.status,
        updatedAt: caseDoc.updatedAt,
        counterpart: counterpart
          ? {
              _id: String(counterpart._id),
              name: counterpart.name,
              role: counterpart.role,
            }
          : null,
        lastMessage: latestByCaseId.get(caseId) || null,
      };
    });

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

router.get('/cases/:caseId/messages', authMiddleware, async (req, res) => {
  try {
    const context = await getCaseParticipantContext(req.params.caseId, req.user);

    if (context.error) {
      return res.status(context.status).json({ message: context.error });
    }

    const messages = await ChatMessage.find({ caseId: req.params.caseId })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('senderId', 'name role');

    return res.status(200).json({
      messages: messages.map(serializeChatMessage),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
});

module.exports = router;
