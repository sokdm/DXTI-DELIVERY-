import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  Stamp
} from 'lucide-react';
import { format } from 'date-fns';
import MapTracker from './MapTracker';

const TrackingResult = ({ packageData }) => {
  const [currentLocation, setCurrentLocation] = useState(packageData.currentLocation);

  // Update location every 30 seconds if in transit
  useEffect(() => {
    if (packageData.status === 'in_transit') {
      const interval = setInterval(() => {
        setCurrentLocation(prev => ({
          ...prev,
          lat: prev.lat + (packageData.destinationLocation.lat - prev.lat) * 0.001,
          lng: prev.lng + (packageData.destinationLocation.lng - prev.lng) * 0.001,
        }));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [packageData.status]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_transit':
        return <Truck className="w-6 h-6 text-blue-500" />;
      case 'stopped':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'arrived':
        return <CheckCircle className="w-6 h-6 text-purple-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      in_transit: 'In Transit',
      arrived: 'Arrived at Destination',
      delivered: 'Delivered',
      stopped: 'Delivery Stopped',
    };
    return texts[status] || status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Status Banner */}
      <div className={`glass-card p-6 border-l-4 ${
        packageData.status === 'stopped' ? 'border-red-500 bg-red-50/50' :
        packageData.status === 'delivered' ? 'border-green-500' :
        packageData.status === 'in_transit' ? 'border-blue-500' :
        packageData.status === 'arrived' ? 'border-purple-500' :
        'border-yellow-500'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {getStatusIcon(packageData.status)}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {getStatusText(packageData.status)}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Tracking Code: <span className="font-mono font-semibold">{packageData.trackingCode}</span>
              </p>
            </div>
          </div>
          
          {/* STOPPED Badge - Prominent */}
          {packageData.status === 'stopped' && (
            <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-xl p-4 max-w-md animate-pulse">
              <p className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2 text-lg">
                <AlertCircle className="w-6 h-6" />
                STOPPED
              </p>
              {packageData.stopReason && (
                <p className="text-red-600 dark:text-red-300 mt-2 font-medium">
                  Reason: {packageData.stopReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map with country borders and stop badge */}
      <MapTracker 
        currentLocation={currentLocation}
        destination={packageData.destinationLocation}
        status={packageData.status}
        progress={packageData.movementProgress}
        stopReason={packageData.stopReason}
      />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Package Image & Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Package Image */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-dxt-primary" />
                Package Image
              </h3>
            </div>
            <div className="p-4">
              <img
                src={packageData.packageImage}
                alt={packageData.packageName}
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Package Details */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-dxt-primary" />
              Package Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{packageData.packageName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Description</span>
                <span className="font-medium text-slate-900 dark:text-white text-right max-w-xs">
                  {packageData.packageDescription}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Weight</span>
                <span className="font-medium text-slate-900 dark:text-white">{packageData.packageWeight} kg</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Delivery Price</span>
                <span className="font-bold text-dxt-primary text-lg">
                  ${packageData.deliveryPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sender & Receiver Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Sender Details */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-dxt-secondary" />
              Sender Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{packageData.senderName}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{packageData.senderPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{packageData.senderEmail}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                <span>
                  {packageData.senderAddress}, {packageData.senderCity}, {packageData.senderCountry}
                </span>
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              Receiver Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{packageData.receiverName}</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs capitalize">
                  {packageData.receiverGender}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{packageData.receiverPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{packageData.receiverEmail}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                <span>
                  {packageData.receiverAddress}, {packageData.receiverCity}, {packageData.receiverCountry}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="glass-card p-6 bg-gradient-to-br from-dxt-primary/5 to-dxt-secondary/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-dxt-accent" />
              Receipt Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 border-dashed">
                <span className="text-slate-500 dark:text-slate-400">Receipt ID</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {packageData.receipt.receiptId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 border-dashed">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(new Date(packageData.receipt.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              <div className="mt-4 p-4 bg-dxt-primary/10 rounded-xl border-2 border-dxt-primary/30">
                <p className="text-center font-bold text-dxt-primary text-lg tracking-wider flex items-center justify-center gap-2">
                  <Stamp className="w-6 h-6" />
                  ✓ STAMPED BY DXT DELIVERY
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TrackingResult;
