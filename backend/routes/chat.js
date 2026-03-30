const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const ChatMessage = require('../models/ChatMessage');
const { getCaseParticipantContext } = require('../utils/caseAccess');
const { serializeChatMessage } = require('../socket');

const router = express.Router();

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
