const mongoose = require('mongoose');

const integrationAuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  actorEmail: { type: String },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true },
  resourceId: { type: String },
  resourceName: { type: String },
  environment: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('IntegrationAuditLog', integrationAuditLogSchema);
