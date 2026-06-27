const Package = require('../models/Package');
const { cloudinary } = require('../config/cloudinary');
const { sendShipmentCreatedEmail, sendStatusUpdateEmail } = require('../utils/emailService');
const { generateReceiptHTML, generateReceiptPDF } = require('../utils/receiptService');

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
      // Clean up uploaded file if validation fails
      if (req.file.filename) {
        try { await cloudinary.uploader.destroy(req.file.filename); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid package weight',
      });
    }

    if (isNaN(deliveryPrice) || deliveryPrice < 0) {
      if (req.file.filename) {
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
      if (req.file.filename) {
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
    });

    // Send email to receiver (don't block on failure)
    try {
      await sendShipmentCreatedEmail(package);
      console.log('✅ Shipment creation email sent to', package.receiverEmail);
    } catch (emailErr) {
      console.error('❌ Failed to send email:', emailErr.message);
    }

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

    const updateData = { status, updatedAt: Date.now() };

    if (status === 'stopped') {
      updateData.stopReason = stopReason;
    } else if (status === 'in_transit') {
      updateData.movementProgress = 0;
      updateData.lastMovementUpdate = Date.now();
    } else if (status === 'delivered') {
      updateData.movementProgress = 1;
    }

    const package = await Package.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Send status update email if status changed
    if (oldStatus !== status) {
      try {
        await sendStatusUpdateEmail(package, oldStatus);
        console.log('✅ Status update email sent to', package.receiverEmail);
      } catch (emailErr) {
        console.error('❌ Failed to send status email:', emailErr.message);
      }
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

    const recentPackages = await Package.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('trackingCode packageName status createdAt');

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inTransit,
        arrived,
        delivered,
        stopped,
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

// NEW: Get receipt HTML for printing
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

// NEW: Download receipt PDF
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

// NEW: Update package location manually
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

    const package = await Package.findByIdAndUpdate(
      id,
      {
        'currentLocation.lat': parseFloat(lat),
        'currentLocation.lng': parseFloat(lng),
        'currentLocation.locationName': locationName || 'Manual Update',
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package location updated successfully',
      data: package,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message,
    });
  }
};
