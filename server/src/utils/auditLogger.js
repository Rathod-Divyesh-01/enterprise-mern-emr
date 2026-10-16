const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, entity, entityId = null, details = {} }) => {
  try {
    await AuditLog.create({
      userId: user.id || user._id,
      role: user.role,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      details,
    });
  } catch (error) {
    console.error('Audit log creation failure:', error.message);
  }
};

module.exports = logAudit;