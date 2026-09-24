const Package = require('../models/Package');
const { cloudinary } = require('../config/cloudinary');
const {
  sendShipmentCreatedEmail,
  sendStatusUpdateEmail,
  sendCustomPackageEmail,
  sendEmail,
  isValidEmail,
} = require('../utils/emailService');
const { generateReceiptHTML, generateReceiptPDF } = require('../utils/receiptService');

const receiptEmailCooldowns = new Map();
const RECEIPT_EMAIL_COOLDOWN_MS = 60 * 1000;

exports.createPackage = async (req, res) => {
  try {
    console.log('📦 Creating package...');
    console.log('File:', req.file ? 'YES' : 'NO');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a package image',
      });
    }

    const data = req.body;

    // Safely parse numbers
    const packageWeight = parseFloat(data.packageWeight);
    const deliveryPrice = parseFloat(data.deliveryPrice);

    if (isNaN(packageWeight) || packageWeight <= 0) {
      if (req.file && req.file.filename) {
        try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid package weight',
      });
    }

    if (isNaN(deliveryPrice) || deliveryPrice < 0) {
      if (req.file && req.file.filename) {
        try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid delivery price',
      });
    }

    let currentLocation, destinationLocation;
    try {
      currentLocation = JSON.parse(data.currentLocation);
      destinationLocation = JSON.parse(data.destinationLocation);
    } catch (e) {
      if (req.file && req.file.filename) {
        try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid location data format',
      });
    }

    const package = await Package.create({
      packageName: data.packageName,
      packageDescription: data.packageDescription,
      packageWeight: packageWeight,
      packageImage: req.file.path,
      packageImagePublicId: req.file.filename,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      senderEmail: data.senderEmail,
      senderAddress: data.senderAddress,
      senderCountry: data.senderCountry,
      senderCity: data.senderCity,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
      receiverEmail: data.receiverEmail,
      receiverAddress: data.receiverAddress,
      receiverCountry: data.receiverCountry,
      receiverCity: data.receiverCity,
      receiverGender: data.receiverGender,
      deliveryPrice: deliveryPrice,
      currentLocation: currentLocation,
      destinationLocation: destinationLocation,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        location: currentLocation.locationName,
        description: 'Package created',
        timestamp: new Date(),
      }],
      emailStatus: 'pending',
    });

    // Send email with tracking
    console.log('📧 About to send shipment creation email...');
    sendShipmentCreatedEmail(package)
      .then(() => {
        console.log('✅ Shipment creation email sent to', package.receiverEmail);
        // Update email status in background
        Package.findByIdAndUpdate(package._id, {
          emailSent: true,
          emailStatus: 'sent',
          emailSentAt: new Date(),
          emailError: null,
        }).catch(err => console.error('Failed to update email status:', err));
      })
      .catch(emailErr => {
        console.error('❌ Failed to send email:', emailErr.message);
        console.error('Full error:', emailErr.response?.data || 'No response data');
        // Update failure status in background
        Package.findByIdAndUpdate(package._id, {
          emailSent: false,
          emailStatus: 'failed',
          emailError: emailErr.message,
        }).catch(err => console.error('Failed to update email failure status:', err));
      });

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: {
        trackingCode: package.trackingCode,
        receipt: package.receipt,
      },
    });
  } catch (error) {
    console.error('❌ Error creating package:', error);

    // Clean up Cloudinary image on error
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('Cleaned up Cloudinary image after error');
      } catch (e) {
        console.error('Failed to delete image:', e);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error creating package: ' + error.message,
    });
  }
};

exports.getAllPackages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const packages = await Package.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Package.countDocuments(query);

    res.status(200).json({
      success: true,
      count: packages.length,
      total: count,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching packages',
      error: error.message,
    });
  }
};

exports.getPackageByTrackingCode = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const package = await Package.findOne({ trackingCode });

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found with this tracking code',
      });
    }

    if (package.status === 'in_transit') {
      package.updateMovement();
      await package.save();
    }

    res.status(200).json({
      success: true,
      data: package,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching package',
      error: error.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, stopReason } = req.body;

    const validStatuses = ['pending', 'in_transit', 'arrived', 'delivered', 'stopped'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    if (status === 'stopped' && !stopReason) {
      return res.status(400).json({
        success: false,
        message: 'Stop reason is required when stopping a package',
      });
    }

    const existingPackage = await Package.findById(id);
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    const oldStatus = existingPackage.status;

    const updateData = {
      $set: {
        status,
        updatedAt: Date.now(),
      },
      $push: {
        statusHistory: {
          status,
          location: existingPackage.currentLocation?.locationName,
          description: status === 'stopped' ? stopReason : `Status updated to ${status.replace('_', ' ')}`,
          timestamp: new Date(),
        },
      },
    };

    if (status === 'stopped') {
      updateData.$set.stopReason = stopReason;
    } else if (status === 'in_transit') {
      updateData.$set.movementProgress = 0;
      updateData.$set.lastMovementUpdate = Date.now();
    } else if (status === 'arrived') {
      updateData.$set.movementProgress = 1;
      updateData.$set.currentLocation = {
        lat: existingPackage.destinationLocation.lat,
        lng: existingPackage.destinationLocation.lng,
        locationName: existingPackage.destinationLocation.locationName,
        ...(existingPackage.currentLocation?.image ? { image: existingPackage.currentLocation.image } : {}),
        ...(existingPackage.currentLocation?.imagePublicId ? { imagePublicId: existingPackage.currentLocation.imagePublicId } : {}),
      };
      updateData.$push.statusHistory.location = existingPackage.destinationLocation.locationName;
    } else if (status === 'delivered') {
      updateData.$set.movementProgress = 1;
      updateData.$set.currentLocation = {
        lat: existingPackage.destinationLocation.lat,
        lng: existingPackage.destinationLocation.lng,
        locationName: existingPackage.destinationLocation.locationName,
        ...(existingPackage.currentLocation?.image ? { image: existingPackage.currentLocation.image } : {}),
        ...(existingPackage.currentLocation?.imagePublicId ? { imagePublicId: existingPackage.currentLocation.imagePublicId } : {}),
      };
      updateData.$push.statusHistory.location = existingPackage.destinationLocation.locationName;
    }

    const package = await Package.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Send status update email with tracking
    if (oldStatus !== status) {
      console.log('📧 About to send status update email...');
      sendStatusUpdateEmail(package, oldStatus)
        .then(() => {
          console.log('✅ Status update email sent to', package.receiverEmail);
        })
        .catch(emailErr => {
          console.error('❌ Failed to send status email:', emailErr.message);
          console.error('Full error:', emailErr.response?.data || 'No response data');
        });
    }

    res.status(200).json({
      success: true,
      message: `Package status updated to ${status}`,
      data: package,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message,
    });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    if (package.packageImagePublicId) {
      await cloudinary.uploader.destroy(package.packageImagePublicId);
    }

    await package.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting package',
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Package.countDocuments();
    const pending = await Package.countDocuments({ status: 'pending' });
    const inTransit = await Package.countDocuments({ status: 'in_transit' });
    const arrived = await Package.countDocuments({ status: 'arrived' });
    const delivered = await Package.countDocuments({ status: 'delivered' });
    const stopped = await Package.countDocuments({ status: 'stopped' });

    // Calculate total revenue
    const revenueAgg = await Package.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$deliveryPrice' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Calculate success rate
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    const recentPackages = await Package.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inTransit,
        arrived,
        delivered,
        stopped,
        totalRevenue,
        revenueGrowth: '12',
        successRate,
        onTimeRate: '88',
        satisfaction: '4.8',
        recentPackages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message,
    });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    const html = generateReceiptHTML(package);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating receipt',
      error: error.message,
    });
  }
};

exports.downloadReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    const pdfBuffer = await generateReceiptPDF(package);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DXTI-Receipt-${package.trackingCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message,
    });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, locationName } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const existingPackage = await Package.findById(id);
    if (!existingPackage) {
      if (req.file?.filename) {
        try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
      }
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    const setData = {
      'currentLocation.lat': parseFloat(lat),
      'currentLocation.lng': parseFloat(lng),
      'currentLocation.locationName': locationName || 'Manual Update',
      updatedAt: Date.now(),
    };

    if (req.file) {
      setData['currentLocation.image'] = req.file.path;
      setData['currentLocation.imagePublicId'] = req.file.filename;
    }

    const package = await Package.findByIdAndUpdate(
      id,
      {
        $set: setData,
        $push: {
          statusHistory: {
            status: 'location_updated',
            location: locationName || 'Manual Update',
            description: req.file ? 'Current location updated with photo' : 'Current location updated',
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (req.file && existingPackage.currentLocation?.imagePublicId) {
      try { await cloudinary.uploader.destroy(existingPackage.currentLocation.imagePublicId); } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: 'Package location updated successfully',
      data: package,
    });
  } catch (error) {
    if (req.file?.filename) {
      try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message,
    });
  }
};

// ─── Resend Email ───────────────────────────────────────────────────────────

exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const packageImageFile = req.files?.packageImage?.[0];
    const locationImageFile = req.files?.locationImage?.[0];
    const pkg = await Package.findById(id);

    if (!pkg) {
      for (const file of [packageImageFile, locationImageFile].filter(Boolean)) {
        try { await cloudinary.uploader.destroy(file.filename); } catch (e) {}
      }
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const editableTextFields = [
      'packageName',
      'packageDescription',
      'senderName',
      'senderPhone',
      'senderEmail',
      'senderAddress',
      'senderCountry',
      'senderCity',
      'receiverName',
      'receiverPhone',
      'receiverEmail',
      'receiverAddress',
      'receiverCountry',
      'receiverCity',
      'receiverGender',
      'stopReason',
    ];

    editableTextFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field) && req.body[field] !== '') {
        pkg[field] = String(req.body[field]).trim();
      }
    });

    if (req.body.trackingCode && req.body.trackingCode !== pkg.trackingCode) {
      const nextCode = String(req.body.trackingCode).trim().toUpperCase();
      const existing = await Package.findOne({ trackingCode: nextCode, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Tracking code is already in use' });
      }
      pkg.trackingCode = nextCode;
    }

    if (req.body.packageWeight !== undefined && req.body.packageWeight !== '') {
      const weight = parseFloat(req.body.packageWeight);
      if (Number.isNaN(weight) || weight <= 0) {
        return res.status(400).json({ success: false, message: 'Please enter a valid package weight' });
      }
      pkg.packageWeight = weight;
    }

    if (req.body.deliveryPrice !== undefined && req.body.deliveryPrice !== '') {
      const price = parseFloat(req.body.deliveryPrice);
      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({ success: false, message: 'Please enter a valid delivery price' });
      }
      pkg.deliveryPrice = price;
    }

    if (req.body.status !== undefined && req.body.status !== '') {
      const validStatuses = ['pending', 'in_transit', 'arrived', 'delivered', 'stopped'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      pkg.status = req.body.status;
      if (pkg.status === 'delivered') pkg.movementProgress = 1;
      if (pkg.status === 'in_transit' && !pkg.movementProgress) {
        pkg.movementProgress = 0;
        pkg.lastMovementUpdate = new Date();
      }
    }

    ['currentLocation', 'destinationLocation'].forEach((field) => {
      if (req.body[field]) {
        const value = typeof req.body[field] === 'string' ? JSON.parse(req.body[field]) : req.body[field];
        if (!Number.isFinite(Number(value.lat)) || !Number.isFinite(Number(value.lng))) {
          throw new Error(`Invalid ${field} coordinates`);
        }
        pkg[field] = {
          lat: Number(value.lat),
          lng: Number(value.lng),
          locationName: String(value.locationName || 'Updated location').trim(),
          ...(pkg[field]?.image ? { image: pkg[field].image } : {}),
          ...(pkg[field]?.imagePublicId ? { imagePublicId: pkg[field].imagePublicId } : {}),
        };
      }
    });

    if (packageImageFile) {
      const oldPublicId = pkg.packageImagePublicId;
      pkg.packageImage = packageImageFile.path;
      pkg.packageImagePublicId = packageImageFile.filename;
      if (oldPublicId) {
        try { await cloudinary.uploader.destroy(oldPublicId); } catch (e) {}
      }
    }

    if (locationImageFile) {
      const oldLocationPublicId = pkg.currentLocation?.imagePublicId;
      pkg.currentLocation.image = locationImageFile.path;
      pkg.currentLocation.imagePublicId = locationImageFile.filename;
      if (oldLocationPublicId) {
        try { await cloudinary.uploader.destroy(oldLocationPublicId); } catch (e) {}
      }
    }

    await pkg.save();
    res.json({ success: true, message: 'Package updated successfully', data: pkg });
  } catch (error) {
    for (const file of [req.files?.packageImage?.[0], req.files?.locationImage?.[0]].filter(Boolean)) {
      try { await cloudinary.uploader.destroy(file.filename); } catch (e) {}
    }
    console.error('Package update error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating package' });
  }
};

exports.sendReceiptEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const lastSentAt = receiptEmailCooldowns.get(id) || 0;
    const waitMs = RECEIPT_EMAIL_COOLDOWN_MS - (Date.now() - lastSentAt);

    if (waitMs > 0) {
      return res.status(429).json({
        success: false,
        message: `Receipt email already requested. Please wait ${Math.ceil(waitMs / 1000)} seconds before trying again.`,
      });
    }

    receiptEmailCooldowns.set(id, Date.now());

    const package = await Package.findById(id);

    if (!package) {
      receiptEmailCooldowns.delete(id);
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    if (!isValidEmail(package.receiverEmail)) {
      receiptEmailCooldowns.delete(id);
      return res.status(400).json({
        success: false,
        message: 'Receiver email is invalid',
      });
    }

    const pdfBuffer = await generateReceiptPDF(package);
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;">
        <div style="background:#FFCC00;padding:18px 22px;border-top:6px solid #D40511;">
          <strong style="font-size:24px;color:#D40511;letter-spacing:4px;">DHL</strong>
        </div>
        <div style="padding:22px;border:1px solid #e5e7eb;border-top:0;">
          <h2 style="margin:0 0 10px;color:#111827;">Shipment receipt attached</h2>
          <p>Hello ${package.receiverName || 'there'},</p>
          <p>Your DHL-styled shipment receipt for tracking number <strong>${package.trackingCode}</strong> is attached as a PDF.</p>
          <p style="margin-top:18px;">Support: <a href="mailto:dhld5736@gmail.com">dhld5736@gmail.com</a></p>
        </div>
      </div>
    `;

    await sendEmail(package.receiverEmail, `Shipment receipt - ${package.trackingCode}`, html, {
      attachments: [{
        filename: `DHL-Receipt-${package.trackingCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    res.json({
      success: true,
      message: `Receipt sent successfully to ${package.receiverEmail}`,
    });
  } catch (error) {
    console.error('Send receipt email error:', error);
    receiptEmailCooldowns.delete(req.params.id);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send receipt email',
    });
  }
};

exports.sendCustomEmail = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!isValidEmail(pkg.receiverEmail)) {
      return res.status(400).json({ success: false, message: 'Receiver email is invalid' });
    }
    if (subject.length < 3 || subject.length > 140) {
      return res.status(400).json({ success: false, message: 'Subject must be between 3 and 140 characters' });
    }
    if (message.length < 5 || message.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message must be between 5 and 4000 characters' });
    }

    await sendCustomPackageEmail(pkg, subject, message);

    res.json({ success: true, message: `Email sent successfully to ${pkg.receiverEmail}` });
  } catch (error) {
    console.error('Custom email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send custom email' });
  }
};

exports.resendEmail = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    if (!pkg.receiverEmail) {
      return res.status(400).json({ success: false, message: 'No receiver email found for this package' });
    }

    await sendShipmentCreatedEmail(pkg);

    pkg.emailSent = true;
    pkg.emailStatus = 'sent';
    pkg.emailSentAt = new Date();
    pkg.emailError = null;
    await pkg.save();

    res.json({
      success: true,
      message: `Email resent successfully to ${pkg.receiverEmail}`
    });
  } catch (error) {
    console.error('Resend email error:', error);

    try {
      const pkg = await Package.findById(req.params.id);
      if (pkg) {
        pkg.emailSent = false;
        pkg.emailStatus = 'failed';
        pkg.emailError = error.message;
        await pkg.save();
      }
    } catch (updateErr) {
      console.error('Failed to update email status:', updateErr);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to resend email. Check SMTP configuration.'
    });
  }
};
