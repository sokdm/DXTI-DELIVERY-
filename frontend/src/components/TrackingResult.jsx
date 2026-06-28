import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, MapPin, Calendar, Clock, Truck, CheckCircle, 
  AlertTriangle, ChevronDown, ChevronUp, 
  Weight, DollarSign, User, Mail, Box, Navigation, Send
} from 'lucide-react';
import MapTracker from './MapTracker';

const statusConfig = {
  pending: {
    color: 'bg-dhl-yellow text-dhl-black',
    icon: Box,
    label: 'PENDING',
    progress: 10,
  },
  in_transit: {
    color: 'bg-blue-500 text-white',
    icon: Truck,
    label: 'IN TRANSIT',
    progress: 50,
  },
  arrived: {
    color: 'bg-purple-500 text-white',
    icon: MapPin,
    label: 'ARRIVED',
    progress: 75,
  },
  delivered: {
    color: 'bg-green-500 text-white',
    icon: CheckCircle,
    label: 'DELIVERED',
    progress: 100,
  },
  stopped: {
    color: 'bg-dhl-red text-white',
    icon: AlertTriangle,
    label: 'STOPPED',
    progress: 0,
  },
};

// Safe location name helper
const getLocationName = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'string') return loc;
  if (loc.locationName) return loc.locationName;
  if (loc.name) return loc.name;
  if (loc.city) return `${loc.city}${loc.country ? ', ' + loc.country : ''}`;
  return null;
};

// Format address cleanly
const formatAddress = (address, city, country) => {
  const parts = [];
  if (address && address.trim()) parts.push(address.trim());
  if (city && city.trim()) parts.push(city.trim());
  if (country && country.trim()) parts.push(country.trim());
  return parts.join(', ');
};

const TrackingResult = ({ packageData }) => {
  const [showDetails, setShowDetails] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const status = packageData.status || 'pending';
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Backend field names
  const sender = {
    name: packageData.senderName,
    phone: packageData.senderPhone,
    email: packageData.senderEmail,
    address: packageData.senderAddress,
    city: packageData.senderCity,
    country: packageData.senderCountry,
  };

  const receiver = {
    name: packageData.receiverName,
    phone: packageData.receiverPhone,
    email: packageData.receiverEmail,
    address: packageData.receiverAddress,
    city: packageData.receiverCity,
    country: packageData.receiverCountry,
    gender: packageData.receiverGender,
  };

  const weight = packageData.packageWeight;
  const price = packageData.deliveryPrice;
  const description = packageData.packageDescription;
  const packageName = packageData.packageName;
  const packageImage = packageData.packageImage;

  const currentLocation = packageData.currentLocation;
  const destination = packageData.destinationLocation;

  const progress = (packageData.movementProgress !== undefined ? packageData.movementProgress * 100 : config.progress);

  const originName = getLocationName(currentLocation) || 'Origin';
  const destName = getLocationName(destination) || 'Destination';

  const senderAddress = formatAddress(sender.address, sender.city, sender.country);
  const receiverAddress = formatAddress(receiver.address, receiver.city, receiver.country);

  const timeline = packageData.statusHistory || packageData.timeline || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Status Header */}
      <div className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg border-t-4 border-dhl-yellow overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-4 py-1.5 text-sm font-black uppercase tracking-wider ${config.color}`}>
                  <StatusIcon className="w-4 h-4 inline mr-2" />
                  {config.label}
                </span>
                {packageData.stopReason && (
                  <span className="px-3 py-1 bg-dhl-red text-white text-xs font-black uppercase">
                    STOPPED
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black text-dhl-black dark:text-white uppercase tracking-tight">
                {packageData.trackingCode}
              </h2>
              <p className="text-dhl-gray-500 dark:text-dhl-gray-400 mt-1 font-semibold">
                {description || 'Package in transit'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-5xl font-black text-dhl-yellow">{Math.round(progress)}%</div>
              <div className="text-sm text-dhl-gray-500 uppercase tracking-wider font-bold">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-dhl-gray-200 dark:bg-dhl-gray-700 rounded-full overflow-hidden mb-6">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-dhl-yellow to-dhl-red"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>

          {/* Route Info */}
          <div className="flex items-center justify-between bg-dhl-gray-50 dark:bg-dhl-gray-800 p-4 rounded-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-dhl-yellow flex items-center justify-center rounded-sm">
                <MapPin className="w-6 h-6 text-dhl-black" />
              </div>
              <div>
                <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold">From</div>
                <div className="font-black text-dhl-black dark:text-white text-lg">{originName}</div>
              </div>
            </div>

            <div className="flex-1 mx-4 md:mx-8 relative">
              <div className="h-1 bg-dhl-gray-300 dark:bg-dhl-gray-600 rounded-full"></div>
              <motion.div
                className="absolute top-1/2 -translate-y-1/2"
                animate={{ left: `${progress}%` }}
                transition={{ duration: 1.5 }}
              >
                <Truck className="w-8 h-8 text-dhl-yellow -translate-x-1/2" />
              </motion.div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold">To</div>
                <div className="font-black text-dhl-black dark:text-white text-lg">{destName}</div>
              </div>
              <div className="w-12 h-12 bg-dhl-red flex items-center justify-center rounded-sm">
                <Navigation className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      {currentLocation && destination && (
        <MapTracker 
          currentLocation={currentLocation}
          destination={destination}
          origin={currentLocation}
          status={status}
          progress={packageData.movementProgress || 0}
          stopReason={packageData.stopReason}
        />
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-6 flex items-center justify-between hover:bg-dhl-gray-50 dark:hover:bg-dhl-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-dhl-yellow" />
            <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase tracking-wide">Tracking History</h3>
          </div>
          {showHistory ? <ChevronUp className="w-5 h-5 text-dhl-gray-400" /> : <ChevronDown className="w-5 h-5 text-dhl-gray-400" />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dhl-gray-200 dark:bg-dhl-gray-700"></div>
                  
                  {timeline.length > 0 ? timeline.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex items-start gap-4 mb-6 last:mb-0"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        index === 0 ? 'bg-dhl-yellow text-dhl-black' : 'bg-dhl-gray-200 dark:bg-dhl-gray-700 text-dhl-gray-500'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 bg-dhl-gray-50 dark:bg-dhl-gray-800 p-4 rounded-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-dhl-black dark:text-white uppercase text-sm tracking-wide">
                            {event.status?.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-dhl-gray-500 font-bold">
                            {new Date(event.timestamp || event.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-dhl-gray-600 dark:text-dhl-gray-300 text-sm font-semibold">
                          {event.location || event.description}
                        </p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-8 text-dhl-gray-500 font-bold">
                      No tracking history available yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Package Details - Dynamic Theme */}
      <div className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg overflow-hidden border border-dhl-gray-200 dark:border-dhl-gray-700">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-6 flex items-center justify-between hover:bg-dhl-gray-50 dark:hover:bg-dhl-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-dhl-yellow" />
            <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase tracking-wide">Package Details</h3>
          </div>
          {showDetails ? <ChevronUp className="w-5 h-5 text-dhl-gray-400" /> : <ChevronDown className="w-5 h-5 text-dhl-gray-400" />}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-4">
                
                {/* Package Name + Image - BIGGER */}
                <div className="p-5 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm border-l-4 border-dhl-yellow">
                  <div className="flex items-center gap-5">
                    {packageImage && (
                      <div className="flex-shrink-0">
                        <img 
                          src={packageImage} 
                          alt={packageName || 'Package'} 
                          className="w-28 h-28 object-cover rounded-sm shadow-md"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold mb-1">Package</div>
                      <div className="font-black text-dhl-black dark:text-white text-2xl tracking-tight">{packageName || 'Parcel'}</div>
                      {description && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-semibold mt-1">{description}</div>}
                    </div>
                  </div>
                </div>

                {/* Sender */}
                <div className="p-5 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-dhl-yellow/20 dark:bg-dhl-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-dhl-yellow" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold mb-1">Sender</div>
                      <div className="font-black text-dhl-black dark:text-white text-xl tracking-tight">{sender.name || 'N/A'}</div>
                      {sender.phone && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-bold mt-1">{sender.phone}</div>}
                      {sender.email && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-semibold">{sender.email}</div>}
                      {senderAddress && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-semibold mt-2">{senderAddress}</div>}
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <div className="p-5 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-dhl-red/20 dark:bg-dhl-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-dhl-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold mb-1">Recipient</div>
                      <div className="font-black text-dhl-black dark:text-white text-xl tracking-tight">{receiver.name || 'N/A'}</div>
                      {receiver.phone && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-bold mt-1">{receiver.phone}</div>}
                      {receiver.email && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-semibold">{receiver.email}</div>}
                      {receiverAddress && <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-semibold mt-2">{receiverAddress}</div>}
                    </div>
                  </div>
                </div>

                {/* Weight & Price Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dhl-yellow/20 dark:bg-dhl-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Weight className="w-6 h-6 text-dhl-yellow" />
                      </div>
                      <div>
                        <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold">Weight</div>
                        <div className="font-black text-dhl-black dark:text-white text-xl tracking-tight">{weight !== undefined ? weight + ' kg' : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dhl-red/20 dark:bg-dhl-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-dhl-red" />
                      </div>
                      <div>
                        <div className="text-xs text-dhl-gray-500 uppercase tracking-wider font-bold">Delivery Price</div>
                        <div className="font-black text-dhl-black dark:text-white text-xl tracking-tight">{price !== undefined ? '$' + parseFloat(price).toFixed(2) : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {packageData.estimatedDelivery && (
                  <div className="p-4 bg-dhl-yellow/10 dark:bg-dhl-yellow/5 border-l-4 border-dhl-yellow rounded-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-dhl-yellow" />
                      <div>
                        <div className="text-xs text-dhl-gray-600 dark:text-dhl-gray-400 uppercase tracking-wider font-bold">Estimated Delivery</div>
                        <div className="font-black text-dhl-black dark:text-white text-lg tracking-tight">
                          {new Date(packageData.estimatedDelivery).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {packageData.stopReason && (
                  <div className="p-4 bg-dhl-red/10 dark:bg-dhl-red/5 border-l-4 border-dhl-red rounded-sm">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-dhl-red" />
                      <div>
                        <div className="text-xs text-dhl-red uppercase tracking-wider font-bold">Delivery Stopped</div>
                        <div className="font-black text-dhl-red">{packageData.stopReason}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Support Banner - Dynamic Theme */}
      <div className="bg-dhl-gray-100 dark:bg-dhl-gray-900 rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-dhl-gray-200 dark:border-dhl-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dhl-yellow rounded-sm">
            <Mail className="w-6 h-6 text-dhl-black" />
          </div>
          <div>
            <div className="text-dhl-black dark:text-white font-black text-lg">Need Help?</div>
            <div className="text-dhl-gray-500 dark:text-dhl-gray-400 text-sm font-semibold">Contact our support team</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://t.me/Dhl5788"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-black uppercase tracking-wider rounded-sm hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            Telegram @Dhl5788
          </a>
          <a 
            href="mailto:dhld5736@gmail.com" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-dhl-yellow text-dhl-black font-black uppercase tracking-wider rounded-sm hover:bg-dhl-yellow-light transition-colors"
          >
            <Mail className="w-4 h-4" />
            dhld5736@gmail.com
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackingResult;
