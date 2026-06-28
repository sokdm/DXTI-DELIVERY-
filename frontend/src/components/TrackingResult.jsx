import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, MapPin, Calendar, Clock, Truck, CheckCircle, 
  AlertTriangle, ChevronDown, ChevronUp, 
  Weight, Ruler, User, Mail, Box, Navigation, Send
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

const TrackingResult = ({ packageData }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const status = packageData.status || 'pending';
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const timeline = packageData.timeline || [];
  const currentLocation = packageData.currentLocation;
  const destination = packageData.destination;

  const progress = packageData.progress || config.progress;

  // Helper to safely get location name from either string or object
  const getLocationName = (loc) => {
    if (!loc) return null;
    if (typeof loc === 'string') return loc;
    if (loc.locationName) return loc.locationName;
    if (loc.name) return loc.name;
    if (loc.city) return `${loc.city}${loc.country ? ', ' + loc.country : ''}`;
    return null;
  };

  const originName = getLocationName(packageData.origin) || 'Origin';
  const destinationName = getLocationName(packageData.destination) || 'Destination';

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
                  <span className="px-3 py-1 bg-dhl-red text-white text-xs font-bold uppercase">
                    STOPPED
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black text-dhl-black dark:text-white uppercase">
                {packageData.trackingCode}
              </h2>
              <p className="text-dhl-gray-500 dark:text-dhl-gray-400 mt-1">
                {packageData.description || 'Package in transit'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-4xl font-black text-dhl-yellow">{Math.round(progress)}%</div>
              <div className="text-sm text-dhl-gray-500 uppercase tracking-wider">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-dhl-gray-200 dark:bg-dhl-gray-700 rounded-full overflow-hidden mb-6">
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
              <div className="w-10 h-10 bg-dhl-yellow flex items-center justify-center">
                <MapPin className="w-5 h-5 text-dhl-black" />
              </div>
              <div>
                <div className="text-xs text-dhl-gray-500 uppercase tracking-wider">From</div>
                <div className="font-bold text-dhl-black dark:text-white">{originName}</div>
              </div>
            </div>

            <div className="flex-1 mx-4 md:mx-8 relative">
              <div className="h-0.5 bg-dhl-gray-300 dark:bg-dhl-gray-600"></div>
              <motion.div
                className="absolute top-1/2 -translate-y-1/2"
                animate={{ left: `${progress}%` }}
                transition={{ duration: 1.5 }}
              >
                <Truck className="w-6 h-6 text-dhl-yellow -translate-x-1/2" />
              </motion.div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-xs text-dhl-gray-500 uppercase tracking-wider">To</div>
                <div className="font-bold text-dhl-black dark:text-white">{destinationName}</div>
              </div>
              <div className="w-10 h-10 bg-dhl-red flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
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
          origin={packageData.originLocation || packageData.origin}
          status={status}
          progress={progress / 100}
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
            <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase">Tracking History</h3>
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
                          <span className="font-bold text-dhl-black dark:text-white uppercase text-sm">
                            {event.status?.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-dhl-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-dhl-gray-600 dark:text-dhl-gray-300 text-sm">
                          {event.location} - {event.description}
                        </p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-8 text-dhl-gray-500">
                      No tracking history available yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Package Details */}
      <div className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-6 flex items-center justify-between hover:bg-dhl-gray-50 dark:hover:bg-dhl-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-dhl-yellow" />
            <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase">Package Details</h3>
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
              <div className="px-6 pb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                      <User className="w-5 h-5 text-dhl-yellow" />
                      <div>
                        <div className="text-xs text-dhl-gray-500 uppercase tracking-wider">Sender</div>
                        <div className="font-semibold text-dhl-black dark:text-white">{packageData.sender?.name || 'N/A'}</div>
                        <div className="text-sm text-dhl-gray-500">{packageData.sender?.phone || ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                      <User className="w-5 h-5 text-dhl-red" />
                      <div>
                        <div className="text-xs text-dhl-gray-500 uppercase tracking-wider">Recipient</div>
                        <div className="font-semibold text-dhl-black dark:text-white">{packageData.recipient?.name || 'N/A'}</div>
                        <div className="text-sm text-dhl-gray-500">{packageData.recipient?.phone || ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                      <Weight className="w-5 h-5 text-dhl-yellow" />
                      <div>
                        <div className="text-xs text-dhl-gray-500 uppercase tracking-wider">Weight</div>
                        <div className="font-semibold text-dhl-black dark:text-white">{packageData.weight || 'N/A'} kg</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-dhl-gray-50 dark:bg-dhl-gray-800 rounded-sm">
                      <Ruler className="w-5 h-5 text-dhl-red" />
                      <div>
                        <div className="text-xs text-dhl-gray-500 uppercase tracking-wider">Dimensions</div>
                        <div className="font-semibold text-dhl-black dark:text-white">{packageData.dimensions || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {packageData.estimatedDelivery && (
                  <div className="mt-4 p-4 bg-dhl-yellow/20 border-l-4 border-dhl-yellow rounded-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-dhl-yellow" />
                      <div>
                        <div className="text-xs text-dhl-gray-600 uppercase tracking-wider font-bold">Estimated Delivery</div>
                        <div className="font-black text-dhl-black dark:text-white text-lg">
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
                  <div className="mt-4 p-4 bg-dhl-red/20 border-l-4 border-dhl-red rounded-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-dhl-red" />
                      <div>
                        <div className="text-xs text-dhl-red uppercase tracking-wider font-bold">Delivery Stopped</div>
                        <div className="font-semibold text-dhl-red">{packageData.stopReason}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Support Banner - Telegram + Email */}
      <div className="bg-dhl-gray-900 rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dhl-yellow rounded-sm">
            <Mail className="w-6 h-6 text-dhl-black" />
          </div>
          <div>
            <div className="text-white font-bold">Need Help?</div>
            <div className="text-dhl-gray-400 text-sm">Contact our support team</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://t.me/Dhl5788"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            Telegram @Dhl5788
          </a>
          <a 
            href="mailto:dhld5736@gmail.com" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-dhl-yellow text-dhl-black font-bold uppercase tracking-wider rounded-sm hover:bg-dhl-yellow-light transition-colors"
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
