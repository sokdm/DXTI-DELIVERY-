const mongoose = require('mongoose');

const generateTrackingCode = () => {
  const prefix = 'DXT';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
};

const generateReceiptId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
};

const packageSchema = new mongoose.Schema({
  trackingCode: {
    type: String,
    unique: true,
  },
  packageName: { type: String, required: true },
  packageDescription: { type: String, required: true },
  packageWeight: { type: Number, required: true },
  packageImage: { type: String, required: true },
  packageImagePublicId: { type: String },
  senderName: { type: String, required: true },
  senderPhone: { type: String, required: true },
  senderEmail: { type: String, required: true },
  senderAddress: { type: String, required: true },
  senderCountry: { type: String, required: true },
  senderCity: { type: String, required: true },
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  receiverAddress: { type: String, required: true },
  receiverCountry: { type: String, required: true },
  receiverCity: { type: String, required: true },
  receiverGender: { type: String, enum: ['male', 'female', 'other'], required: true },
  deliveryPrice: { type: Number, required: true },
  currentLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    locationName: { type: String, required: true },
  },
  destinationLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    locationName: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'arrived', 'delivered', 'stopped'],
    default: 'pending',
  },
  stopReason: { type: String },
  movementProgress: { type: Number, default: 0, min: 0, max: 1 },
  lastMovementUpdate: { type: Date, default: Date.now },
  receipt: {
    receiptId: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    stamped: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

packageSchema.pre('save', async function(next) {
  if (this.isNew) {
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const code = generateTrackingCode();
      const existing = await this.constructor.findOne({ trackingCode: code });
      if (!existing) {
        this.trackingCode = code;
        isUnique = true;
      }
      attempts++;
    }
    this.receipt.receiptId = generateReceiptId();
  }
  this.updatedAt = Date.now();
  next();
});

// UPDATED: Move every 5 minutes instead of 10
packageSchema.methods.updateMovement = function() {
  if (this.status === 'in_transit' && this.movementProgress < 1) {
    const now = new Date();
    const lastUpdate = this.lastMovementUpdate;
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    
    // Move 2% every 5 minutes (faster than before)
    if (diffMinutes >= 5) {
      this.movementProgress = Math.min(this.movementProgress + 0.02, 1);
      this.lastMovementUpdate = now;
      
      const lat = this.currentLocation.lat + 
        (this.destinationLocation.lat - this.currentLocation.lat) * 0.02;
      const lng = this.currentLocation.lng + 
        (this.destinationLocation.lng - this.currentLocation.lng) * 0.02;
      
      this.currentLocation.lat = parseFloat(lat.toFixed(6));
      this.currentLocation.lng = parseFloat(lng.toFixed(6));
      
      if (this.movementProgress >= 1) {
        this.status = 'arrived';
      }
      
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('Package', packageSchema);
