const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatMessage = require('./models/ChatMessage');
const { getCaseParticipantContext, toId } = require('./utils/caseAccess');

let io;

function userRoom(role, id) {
  return `user:${role}:${id}`;
}

function roleRoom(role) {
  return `role:${role}`;
}

function caseRoom(caseId) {
  return `case:${caseId}`;
}

function serializeChatMessage(messageDoc) {
  return {
    _id: toId(messageDoc._id),
    caseId: toId(messageDoc.caseId),
    senderId: toId(messageDoc.senderId?._id || messageDoc.senderId),
    senderRole: messageDoc.senderRole,
    senderName: messageDoc.senderId?.name || 'Unknown',
    message: messageDoc.message,
    createdAt: messageDoc.createdAt,
    updatedAt: messageDoc.updatedAt,
  };
}

function getIo() {
  return io;
}

function emitCaseUpdate(caseDoc, extra = {}) {
  if (!io || !caseDoc) {
    return;
  }

  const ownerId = toId(caseDoc.userId?._id || caseDoc.userId);
  const lawyerId = toId(caseDoc.assignedLawyer?._id || caseDoc.assignedLawyer);
  const payload = {
    caseId: toId(caseDoc._id),
    title: caseDoc.title,
    status: caseDoc.status,
    outcome: caseDoc.outcome,
    assignedLawyerId: lawyerId,
    updatedAt: caseDoc.updatedAt || new Date(),
    ...extra,
  };

  io.to(caseRoom(payload.caseId)).emit('case:updated', payload);

  if (ownerId) {
    io.to(userRoom('user', ownerId)).emit('case:updated', payload);
  }

  if (lawyerId) {
    io.to(userRoom('lawyer', lawyerId)).emit('case:updated', payload);
  }
}

function emitCaseAvailable(caseDoc, extra = {}) {
  if (!io || !caseDoc) {
    return;
  }

  io.to(roleRoom('lawyer')).emit('case:available', {
    caseId: toId(caseDoc._id),
    title: caseDoc.title,
    caseType: caseDoc.caseType,
    urgency: caseDoc.urgency,
    location: caseDoc.location,
    createdAt: caseDoc.createdAt || new Date(),
    ...extra,
  });
}

function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };

      return next();
    } catch (error) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user.role, socket.user.id));
    socket.join(roleRoom(socket.user.role));

    socket.on('chat:join', async ({ caseId }) => {
      if (!caseId) {
        socket.emit('chat:error', { message: 'Case ID is required' });
        return;
      }

      try {
        const context = await getCaseParticipantContext(caseId, socket.user);

        if (context.error) {
          socket.emit('chat:error', { message: context.error });
          return;
        }

        socket.join(caseRoom(caseId));
        socket.emit('chat:joined', { caseId });
      } catch (error) {
        socket.emit('chat:error', { message: 'Failed to join chat room' });
      }
    });

    socket.on('chat:leave', ({ caseId }) => {
      if (caseId) {
        socket.leave(caseRoom(caseId));
      }
    });

    socket.on('chat:send', async ({ caseId, message }, callback) => {
      const trimmedMessage = typeof message === 'string' ? message.trim() : '';

      if (!caseId || !trimmedMessage) {
        if (callback) {
          callback({ ok: false, message: 'Case ID and message are required' });
        }
        return;
      }

      try {
        const context = await getCaseParticipantContext(caseId, socket.user);

        if (context.error) {
          if (callback) {
            callback({ ok: false, message: context.error });
          }
          return;
        }

        const chatMessage = await ChatMessage.create({
          caseId,
          senderId: socket.user.id,
          senderModel: socket.user.role === 'lawyer' ? 'Lawyer' : 'User',
          senderRole: socket.user.role,
          message: trimmedMessage,
        });

        const populatedMessage = await chatMessage.populate('senderId', 'name role');
        const payload = serializeChatMessage(populatedMessage);

        io.to(caseRoom(caseId)).emit('chat:message', payload);

        if (callback) {
          callback({ ok: true, message: payload });
        }
      } catch (error) {
        if (callback) {
          callback({ ok: false, message: 'Failed to send message' });
        }
      }
    });
  });

  return io;
}

module.exports = {
  initSocketServer,
  getIo,
  emitCaseUpdate,
  serializeChatMessage,
  userRoom,
  roleRoom,
  caseRoom,
  emitCaseAvailable,
};
