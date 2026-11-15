const mongoose = require('mongoose');

const integrationClientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  environment: { type: String, enum: ['test', 'production'], required: true },
  keyPrefix: { type: String, required: true, unique: true, index: true },
  keyHash: { type: String, required: true, select: false },
  scopes: {
    type: [String],
    enum: ['shipments:read', 'shipments:write', 'receipts:read', 'tracking:read', 'tracking_events:write'],
    default: [],
  },
  revokedAt: { type: Date, default: null },
  lastUsedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IntegrationClient', integrationClientSchema);
