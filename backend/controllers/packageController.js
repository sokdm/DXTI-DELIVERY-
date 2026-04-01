const Package = require('../models/Package');
const { cloudinary } = require('../config/cloudinary');

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
    
    const package = await Package.create({
      packageName: data.packageName,
      packageDescription: data.packageDescription,
      packageWeight: parseFloat(data.packageWeight),
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
      deliveryPrice: parseFloat(data.deliveryPrice),
      currentLocation: JSON.parse(data.currentLocation),
      destinationLocation: JSON.parse(data.destinationLocation),
      status: 'pending',
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
    
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
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

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found',
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
