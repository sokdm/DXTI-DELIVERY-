const crypto = require('crypto');
const WebhookEndpoint = require('../models/WebhookEndpoint');
const WebhookDelivery = require('../models/WebhookDelivery');

const eventTypeForStatus = (status) => ({
  shipped: 'shipment.dispatched',
  in_transit: 'shipment.in_transit',
  delivered: 'shipment.delivered',
  cancelled: 'shipment.cancelled',
}[status] || 'shipment.updated');

const createShipmentEvent = async (pkg, eventType, session) => {
  if (!pkg.integration?.environment) return;
  const endpointQuery = WebhookEndpoint.find({
    environment: pkg.integration.environment,
    enabled: true,
    revokedAt: null,
    events: eventType,
  });
  if (session) endpointQuery.session(session);
  const endpoints = await endpointQuery;

  if (!endpoints.length) return;
  const eventId = `evt_${crypto.randomUUID()}`;
  const payload = {
    id: eventId,
    type: eventType,
    createdAt: new Date().toISOString(),
    data: {
      trackingNumber: pkg.trackingCode,
      externalOrderId: pkg.integration.externalOrderId,
      shipmentReference: pkg.integration.shipmentReference || null,
      status: pkg.status,
      receiptReference: pkg.receipt?.receiptId || null,
      trackingUrl: `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/track/${encodeURIComponent(pkg.trackingCode)}`,
      currentLocation: pkg.currentLocation,
      receiver: {
        name: pkg.receiverName,
        email: pkg.receiverEmail,
        phone: pkg.receiverPhone,
        address: pkg.receiverAddress,
        city: pkg.receiverCity,
        country: pkg.receiverCountry,
      },
      trackingHistory: pkg.statusHistory || [],
      updatedAt: pkg.updatedAt || new Date(),
    },
  };

  await WebhookDelivery.create(endpoints.map((endpoint) => ({
    eventId,
    eventType,
    endpointId: endpoint._id,
    payload,
  })), { session });
};

module.exports = { createShipmentEvent, eventTypeForStatus };
