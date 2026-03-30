const Case = require('../models/Case');

function toId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return null;
}

async function getCaseParticipantContext(caseId, user) {
  const caseDoc = await Case.findById(caseId)
    .populate('userId', 'name role')
    .populate('assignedLawyer', 'name role');

  if (!caseDoc) {
    return { error: 'Case not found', status: 404 };
  }

  const caseOwnerId = toId(caseDoc.userId?._id || caseDoc.userId);
  const assignedLawyerId = toId(caseDoc.assignedLawyer?._id || caseDoc.assignedLawyer);
  const requesterId = toId(user.id);

  const isOwner = user.role === 'user' && caseOwnerId === requesterId;
  const isAssignedLawyer = user.role === 'lawyer' && assignedLawyerId === requesterId;

  if (!isOwner && !isAssignedLawyer) {
    return { error: 'Access denied', status: 403 };
  }

  return {
    caseDoc,
    caseOwnerId,
    assignedLawyerId,
    counterpart: isOwner ? caseDoc.assignedLawyer : caseDoc.userId,
  };
}

module.exports = {
  getCaseParticipantContext,
  toId,
};
