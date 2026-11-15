const crypto = require('crypto');
const mongoose = require('mongoose');
const Package = require('../models/Package');
const IntegrationSettings = require('../models/IntegrationSettings');
const WebhookEndpoint = require('../models/WebhookEndpoint');
const { verifyPaymentAuthorization } = require('../utils/paymentAuthorization');
const { createShipmentEvent, eventTypeForStatus } = require('../utils/integrationEvents');
const { generateReceiptPDF } = require('../utils/receiptService');
const { sendShipmentCreatedEmail, sendStatusUpdateEmail } = require('../utils/emailService');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanString = (value) => typeof value === 'string' ? value.trim() : '';
const maxLength = (value, limit) => cleanString(value).length <= limit;
const invalid = (res, fields) => res.status(400).json({
  success: false,
  code: 'VALIDATION_ERROR',
  message: 'One or more request fields are invalid',
  fields,
});

const validateShipmentBody = (body) => {
  const fields = {};
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (input !== body) fields.body = 'Request body must be a JSON object';
  const allowedFields = ['externalOrderId', 'customer', 'sender', 'delivery', 'productDescription', 'shipmentReference', 'paymentVerificationReference'];
  for (const field of Object.keys(input)) {
    if (!allowedFields.includes(field)) fields[field] = 'Unknown request field';
  }
  const required = ['externalOrderId', 'productDescription', 'paymentVerificationReference'];
  required.forEach((field) => {
    if (!cleanString(input[field])) fields[field] = 'This field is required';
    else if (!maxLength(input[field], 500)) fields[field] = 'Must be 500 characters or fewer';
  });
  if (!input.customer || typeof input.customer !== 'object' || Array.isArray(input.customer)) {
    fields.customer = 'Customer details are required';
  } else {
    for (const field of Object.keys(input.customer)) {
      if (!['name', 'email', 'phone'].includes(field)) fields[`customer.${field}`] = 'Unknown customer field';
    }
    for (const field of ['name', 'email', 'phone']) {
      if (!cleanString(input.customer[field])) fields[`customer.${field}`] = 'This field is required';
      else if (!maxLength(input.customer[field], 200)) fields[`customer.${field}`] = 'Must be 200 characters or fewer';
    }
    if (input.customer.email && !emailPattern.test(cleanString(input.customer.email))) {
      fields['customer.email'] = 'Must be a valid email address';
    }
    if (input.customer.phone && !/^[+\d][\d\s().-]{5,24}$/.test(cleanString(input.customer.phone))) {
      fields['customer.phone'] = 'Must be a valid phone number';
    }
  }
  if (!input.delivery || typeof input.delivery !== 'object' || Array.isArray(input.delivery)) {
    fields.delivery = 'Delivery details are required';
  } else {
    for (const field of Object.keys(input.delivery)) {
      if (!['country', 'city', 'address'].includes(field)) fields[`delivery.${field}`] = 'Unknown delivery field';
    }
    for (const field of ['country', 'city', 'address']) {
      if (!cleanString(input.delivery[field])) fields[`delivery.${field}`] = 'This field is required';
      else if (!maxLength(input.delivery[field], field === 'address' ? 500 : 120)) fields[`delivery.${field}`] = 'Field is too long';
    }
  }
  if (input.shipmentReference !== undefined && (typeof input.shipmentReference !== 'string' || !maxLength(input.shipmentReference, 120))) {
    fields.shipmentReference = 'Must be 120 characters or fewer';
  }
  if (input.sender !== undefined) {
    if (!input.sender || typeof input.sender !== 'object' || Array.isArray(input.sender)) {
      fields.sender = 'Must be an object';
    } else {
      for (const [field, value] of Object.entries(input.sender)) {
        if (!['companyName', 'contactName', 'email', 'phone', 'address', 'city', 'country'].includes(field)) {
          fields[`sender.${field}`] = 'Unknown sender field';
        } else if (typeof value !== 'string' || value.length > 200) {
          fields[`sender.${field}`] = 'Must be a string of 200 characters or fewer';
        }
      }
      if (input.sender.email && !emailPattern.test(cleanString(input.sender.email))) fields['sender.email'] = 'Must be a valid email address';
      if (input.sender.phone && !/^[+\d][\d\s().-]{5,24}$/.test(cleanString(input.sender.phone))) fields['sender.phone'] = 'Must be a valid phone number';
    }
  }
  return fields;
};

const packageResponse = (pkg) => ({
  trackingNumber: pkg.trackingCode,
  receiptReference: pkg.receipt?.receiptId,
  trackingUrl: `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/track/${encodeURIComponent(pkg.trackingCode)}`,
  externalOrderId: pkg.integration?.externalOrderId,
  status: pkg.status,
  createdAt: pkg.createdAt,
});

exports.createShipment = async (req, res, next) => {
  const fields = validateShipmentBody(req.body);
  if (!req.get('Idempotency-Key') || !/^[A-Za-z0-9._:-]{8,128}$/.test(req.get('Idempotency-Key'))) {
    fields.idempotencyKey = 'Idempotency-Key header is required and must be 8-128 safe characters';
  }
  if (Object.keys(fields).length) return invalid(res, fields);

  const externalOrderId = cleanString(req.body.externalOrderId);
  const idempotencyKey = req.get('Idempotency-Key');
  const requestHash = crypto.createHash('sha256').update(JSON.stringify({
    externalOrderId,
    customer: {
      name: cleanString(req.body.customer.name),
      email: cleanString(req.body.customer.email).toLowerCase(),
      phone: cleanString(req.body.customer.phone),
    },
    delivery: {
      country: cleanString(req.body.delivery.country),
      city: cleanString(req.body.delivery.city),
      address: cleanString(req.body.delivery.address),
    },
    productDescription: cleanString(req.body.productDescription),
    shipmentReference: cleanString(req.body.shipmentReference),
    paymentVerificationReference: cleanString(req.body.paymentVerificationReference),
  })).digest('hex');
  const existing = await Package.findOne({
    'integration.clientId': req.integrationClient._id,
    'integration.idempotencyKey': idempotencyKey,
  }).select('+integration');
  if (existing) {
    if (existing.integration.externalOrderId !== externalOrderId || existing.integration.requestHash !== requestHash) {
      return res.status(409).json({ success: false, code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency key was already used with a different request' });
    }
    return res.status(200).json({ success: true, idempotentReplay: true, data: packageResponse(existing) });
  }
  const duplicateOrder = await Package.findOne({
    'integration.clientId': req.integrationClient._id,
    'integration.externalOrderId': externalOrderId,
  }).select('+integration');
  if (duplicateOrder) {
    return res.status(409).json({ success: false, code: 'DUPLICATE_ORDER', message: 'This external order already has a shipment' });
  }

  const settings = await IntegrationSettings.findOne({ key: 'primary' });
  const company = settings?.company;
  if (!company?.name || !company.email || !company.phone || !company.address || !company.city || !company.country) {
    return res.status(503).json({
      success: false,
      code: 'COMPANY_PROFILE_INCOMPLETE',
      message: 'The administrator must complete the logistics company profile before API shipment creation is enabled',
    });
  }

  const session = await mongoose.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      await verifyPaymentAuthorization({
        externalOrderId,
        paymentReference: cleanString(req.body.paymentVerificationReference),
        environment: req.integrationClient.environment,
        headers: req.headers,
        session,
      });

      const delivery = req.body.delivery;
      const customer = req.body.customer;
      const destinationName = `${cleanString(delivery.city)}, ${cleanString(delivery.country)}`;
      const [pkg] = await Package.create([{
        packageName: cleanString(req.body.productDescription).slice(0, 120),
        packageDescription: cleanString(req.body.productDescription),
        packageWeight: 0.1,
        packageImage: '',
        senderName: company.name,
        senderPhone: company.phone,
        senderEmail: company.email,
        senderAddress: company.address,
        senderCountry: company.country,
        senderCity: company.city,
        receiverName: cleanString(customer.name),
        receiverPhone: cleanString(customer.phone),
        receiverEmail: cleanString(customer.email).toLowerCase(),
        receiverAddress: cleanString(delivery.address),
        receiverCountry: cleanString(delivery.country),
        receiverCity: cleanString(delivery.city),
        receiverGender: 'other',
        deliveryPrice: 0,
        deliveryCurrency: 'USD',
        deliveryCurrencySymbol: '$',
        deliveryCurrencyCountry: 'United States',
        currentLocation: { lat: 0, lng: 0, locationName: `${company.city}, ${company.country}` },
        destinationLocation: { lat: 0, lng: 0, locationName: destinationName },
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          location: `${company.city}, ${company.country}`,
          description: 'Shipment created from authorized Credixa order',
          timestamp: new Date(),
        }],
        emailStatus: 'pending',
        integration: {
          clientId: req.integrationClient._id,
          environment: req.integrationClient.environment,
          externalOrderId,
          idempotencyKey,
          requestHash,
          shipmentReference: cleanString(req.body.shipmentReference),
          paymentVerificationReference: cleanString(req.body.paymentVerificationReference),
        },
      }], { session });
      await createShipmentEvent(pkg, 'shipment.created', session);
      created = pkg;
    });
  } catch (error) {
    if (error.code === 11000) {
      const replay = await Package.findOne({
        'integration.clientId': req.integrationClient._id,
        'integration.idempotencyKey': idempotencyKey,
      }).select('+integration');
      if (replay && replay.integration.externalOrderId === externalOrderId &&
          replay.integration.requestHash === requestHash) {
        return res.status(200).json({ success: true, idempotentReplay: true, data: packageResponse(replay) });
      }
      return res.status(409).json({ success: false, code: 'DUPLICATE_ORDER', message: 'Order or idempotency key already has a shipment' });
    }
    return next(error);
  } finally {
    await session.endSession();
  }

  sendShipmentCreatedEmail(created)
    .then(() => Package.updateOne({ _id: created._id }, { $set: { emailSent: true, emailStatus: 'sent', emailSentAt: new Date(), emailError: null } }))
    .catch((error) => Package.updateOne({ _id: created._id }, { $set: { emailSent: false, emailStatus: 'failed', emailError: String(error.message).slice(0, 500) } })
      .then(() => console.error('Integration shipment email failed:', error.message)));

  return res.status(201).json({ success: true, data: packageResponse(created) });
};

exports.getShipment = async (req, res) => {
  const query = { trackingCode: cleanString(req.params.trackingNumber).toUpperCase() };
  if (req.query.externalOrderId) {
    query['integration.externalOrderId'] = cleanString(req.query.externalOrderId);
  }
  const pkg = await Package.findOne(query).select('+integration');
  if (!pkg || pkg.integration?.clientId?.toString() !== req.integrationClient._id.toString() ||
      pkg.integration?.environment !== req.integrationClient.environment) {
    return res.status(404).json({ success: false, code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' });
  }
  return res.json({
    success: true,
    data: {
      ...packageResponse(pkg),
      description: pkg.packageDescription,
      receiver: {
        name: pkg.receiverName,
        email: pkg.receiverEmail,
        phone: pkg.receiverPhone,
        address: pkg.receiverAddress,
        city: pkg.receiverCity,
        country: pkg.receiverCountry,
      },
      currentLocation: pkg.currentLocation,
      trackingHistory: pkg.statusHistory,
      updatedAt: pkg.updatedAt,
    },
  });
};

exports.getShipmentByOrder = async (req, res) => {
  const pkg = await Package.findOne({
    'integration.clientId': req.integrationClient._id,
    'integration.environment': req.integrationClient.environment,
    'integration.externalOrderId': cleanString(req.params.externalOrderId),
  }).select('+integration');
  if (!pkg) return res.status(404).json({ success: false, code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' });
  return res.json({ success: true, data: packageResponse(pkg) });
};

exports.listShipments = async (req, res) => {
  const page = Math.max(1, Math.min(1000, Number.parseInt(req.query.page, 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 20));
  const query = {
    'integration.clientId': req.integrationClient._id,
    'integration.environment': req.integrationClient.environment,
  };
  if (req.query.externalOrderId) query['integration.externalOrderId'] = cleanString(req.query.externalOrderId);
  if (req.query.status) query.status = cleanString(req.query.status);
  const [packages, total] = await Promise.all([
    Package.find(query).select('+integration').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Package.countDocuments(query),
  ]);
  return res.json({ success: true, data: packages.map(packageResponse), pagination: { page, limit, total } });
};

exports.getReceipt = async (req, res) => {
  const pkg = await Package.findOne({ trackingCode: cleanString(req.params.trackingNumber).toUpperCase() }).select('+integration');
  if (!pkg || pkg.integration?.clientId?.toString() !== req.integrationClient._id.toString() ||
      pkg.integration?.environment !== req.integrationClient.environment) {
    return res.status(404).json({ success: false, code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' });
  }
  const pdf = await generateReceiptPDF(pkg);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="receipt-${pkg.trackingCode}.pdf"`);
  return res.send(pdf);
};

exports.updateShipmentStatus = async (req, res, next) => {
  const status = cleanString(req.body.status);
  const allowedStatuses = ['pending', 'shipped', 'in_transit', 'arrived', 'delivered', 'stopped', 'cancelled'];
  if (!allowedStatuses.includes(status)) return invalid(res, { status: `Must be one of: ${allowedStatuses.join(', ')}` });
  const session = await mongoose.startSession();
  let pkg;
  let oldStatus;
  try {
    await session.withTransaction(async () => {
      pkg = await Package.findOne({
        trackingCode: cleanString(req.params.trackingNumber).toUpperCase(),
        'integration.clientId': req.integrationClient._id,
        'integration.environment': req.integrationClient.environment,
      }).select('+integration').session(session);
      if (!pkg) return;
      oldStatus = pkg.status;
      pkg.status = status;
      if (status === 'arrived' || status === 'delivered') {
        pkg.currentLocation = pkg.destinationLocation;
        pkg.movementProgress = 1;
      }
      if (status === 'shipped' || status === 'in_transit') {
        pkg.movementProgress = 0;
        pkg.lastMovementUpdate = new Date();
      }
      pkg.statusHistory.push({
        status,
        location: cleanString(req.body.location) || pkg.currentLocation.locationName,
        description: cleanString(req.body.description) || `Status updated to ${status.replace(/_/g, ' ')}`,
        timestamp: new Date(),
      });
      await pkg.save({ session });
      await createShipmentEvent(pkg, status === oldStatus ? 'shipment.updated' : eventTypeForStatus(status), session);
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
  if (!pkg) return res.status(404).json({ success: false, code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' });
  if (oldStatus !== status) {
    sendStatusUpdateEmail(pkg, oldStatus).catch((error) => console.error('Integration status email failed:', error.message));
  }
  return res.json({ success: true, data: { trackingNumber: pkg.trackingCode, status: pkg.status } });
};

exports.addTrackingEvent = async (req, res, next) => {
  const { status, location, description } = req.body || {};
  if (!cleanString(status) || !cleanString(location) || !cleanString(description) ||
      !maxLength(status, 40) || !maxLength(location, 200) || !maxLength(description, 1000)) {
    return invalid(res, { event: 'status, location, and description are required and have length limits' });
  }
  const session = await mongoose.startSession();
  let pkg;
  try {
    await session.withTransaction(async () => {
      pkg = await Package.findOne({
        trackingCode: cleanString(req.params.trackingNumber).toUpperCase(),
        'integration.clientId': req.integrationClient._id,
        'integration.environment': req.integrationClient.environment,
      }).select('+integration').session(session);
      if (!pkg) return;
      pkg.statusHistory.push({ status: cleanString(status), location: cleanString(location), description: cleanString(description), timestamp: new Date() });
      await pkg.save({ session });
      await createShipmentEvent(pkg, 'shipment.updated', session);
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
  if (!pkg) return res.status(404).json({ success: false, code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' });
  return res.status(201).json({ success: true, data: { trackingNumber: pkg.trackingCode, event: pkg.statusHistory[pkg.statusHistory.length - 1] } });
};

exports.getDocumentation = (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const docsPath = path.join(__dirname, '..', '..', 'docs', 'API-INTEGRATION.md');
  if (!fs.existsSync(docsPath)) return res.status(404).json({ success: false, message: 'Integration documentation is unavailable' });
  res.type('text/markdown').send(fs.readFileSync(docsPath, 'utf8'));
};
