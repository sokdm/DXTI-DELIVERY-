const mongoose = require('mongoose');

const integrationSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'primary' },
  company: {
    name: { type: String, default: '' },
    contactName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IntegrationSettings', integrationSettingsSchema);
