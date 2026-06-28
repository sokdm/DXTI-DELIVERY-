import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, AlertTriangle, CheckCircle } from 'lucide-react';

const MapTracker = ({ currentLocation, destination, origin, status, progress, stopReason }) => {
  const isStopped = status === 'stopped';
  const isDelivered = status === 'delivered';
  const isInTransit = status === 'in_transit';

  const hasValidCoords = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng);

  if (!hasValidCoords(currentLocation) || !hasValidCoords(destination)) {
    return (
      <div className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg border-t-4 border-dhl-yellow p-8 text-center">
        <MapPin className="w-12 h-12 text-dhl-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase mb-2">Location Data Unavailable</h3>
        <p className="text-dhl-gray-500">Map tracking requires valid GPS coordinates.</p>
      </div>
    );
  }

  const distance = useMemo(() => {
    if (!hasValidCoords(currentLocation) || !hasValidCoords(destination)) return null;
    const R = 6371;
    const dLat = (destination.lat - currentLocation.lat) * Math.PI / 180;
    const dLon = (destination.lng - currentLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }, [currentLocation, destination]);

  const centerLat = (currentLocation.lat + destination.lat) / 2;
  const centerLng = (currentLocation.lng + destination.lng) / 2;
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=4&size=800x400&markers=${currentLocation.lat},${currentLocation.lng},ol-marker-gold|${destination.lat},${destination.lng},ol-marker-red`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg overflow-hidden border-t-4 border-dhl-yellow"
    >
      <div className="p-4 bg-dhl-gray-50 dark:bg-dhl-gray-800 border-b border-dhl-gray-200 dark:border-dhl-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase flex items-center gap-2">
          <MapPin className="w-5 h-5 text-dhl-yellow" />
          Live Tracking Map
        </h3>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          {origin && origin.locationName && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-dhl-gray-600"></div>
              <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{origin.locationName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isStopped ? 'bg-dhl-red animate-pulse' : isDelivered ? 'bg-green-500' : 'bg-dhl-yellow animate-pulse'}`}></div>
            <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{currentLocation?.locationName || 'Current'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-dhl-red"></div>
            <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{destination?.locationName || 'Destination'}</span>
          </div>
        </div>
      </div>

      <div className="h-96 relative bg-dhl-gray-100 dark:bg-dhl-gray-800 overflow-hidden">
        <img src={staticMapUrl} alt="Route Map" className="w-full h-full object-cover" />
        
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-4 py-2 rounded-sm font-black text-sm shadow-lg border-2 uppercase tracking-wider ${
            status === 'stopped' ? 'bg-dhl-red text-white border-dhl-red-dark animate-pulse' :
            status === 'delivered' ? 'bg-green-500 text-white border-green-600' :
            status === 'in_transit' ? 'bg-dhl-yellow text-dhl-black border-dhl-yellow-dark' :
            status === 'arrived' ? 'bg-purple-500 text-white border-purple-600' :
            'bg-dhl-yellow text-dhl-black border-dhl-yellow-dark'
          }`}>
            {status === 'stopped' && <span className="mr-2">🛑</span>}
            {status === 'in_transit' && <span className="animate-pulse mr-2">●</span>}
            {status === 'delivered' && <span className="mr-2">✅</span>}
            {status?.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {isStopped && stopReason && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-dhl-red/95 backdrop-blur-sm text-white p-4 rounded-sm shadow-2xl border-2 border-dhl-red-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg uppercase tracking-wider">Delivery Stopped</p>
                  <p className="text-white/80">{stopReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isInTransit && !isStopped && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-white/95 dark:bg-dhl-gray-900/95 backdrop-blur-sm rounded-sm p-4 shadow-xl border border-dhl-gray-200 dark:border-dhl-gray-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-bold uppercase tracking-wider">Delivery Progress</span>
                <span className="font-black text-dhl-yellow text-lg">{Math.round((progress || 0) * 100)}%</span>
              </div>
              <div className="h-3 bg-dhl-gray-200 dark:bg-dhl-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-dhl-yellow to-dhl-red rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress || 0) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              {distance && <p className="text-xs text-dhl-gray-500 mt-2">Approx. {distance} km remaining</p>}
            </div>
          </div>
        )}

        {isDelivered && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-green-500/95 backdrop-blur-sm text-white p-4 rounded-sm shadow-xl border-2 border-green-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg uppercase tracking-wider">Package Delivered!</p>
                  <p className="text-white/80">Successfully delivered to destination</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-dhl-gray-50 dark:bg-dhl-gray-800/50 border-t border-dhl-gray-200 dark:border-dhl-gray-700 flex flex-wrap gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dhl-gray-600"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dhl-yellow"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Current Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dhl-red"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Destination</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MapTracker;
