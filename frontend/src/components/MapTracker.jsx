import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Safe location name helper
const getLocationName = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'string') return loc;
  if (loc.locationName) return loc.locationName;
  if (loc.name) return loc.name;
  if (loc.city) return `${loc.city}${loc.country ? ', ' + loc.country : ''}`;
  return null;
};

// Safe coordinate helper
const getCoords = (loc) => {
  if (!loc) return null;
  return {
    lat: typeof loc.lat === 'number' ? loc.lat : loc.latitude,
    lng: typeof loc.lng === 'number' ? loc.lng : loc.longitude,
  };
};

// Calculate distance between two points in km
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Estimate delivery time based on distance (avg 60km/h for air freight)
const estimateDeliveryTime = (distanceKm) => {
  const hours = distanceKm / 60;
  if (hours < 1) return 'Less than 1 hour';
  if (hours < 24) return `${Math.ceil(hours)} hours`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
};

// Custom plane icon with animation
const createPlaneIcon = (isStopped, isArrived) => {
  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="
      background: ${isStopped ? 'linear-gradient(135deg, #D40511, #a0040d)' : isArrived ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)'};
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px ${isStopped ? 'rgba(212, 5, 17, 0.5)' : isArrived ? 'rgba(16, 185, 129, 0.5)' : 'rgba(14, 165, 233, 0.5)'};
      border: 3px solid white;
      animation: ${isStopped ? 'none' : 'pulse 2s infinite'};
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12h20"/>
        <path d="M13 2L11 12l2 10"/>
        <path d="M17 8l-6 4 6 4"/>
        <path d="M7 8l6 4-6 4"/>
      </svg>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Custom destination icon
const createDestinationIcon = () => {
  return L.divIcon({
    className: 'custom-destination-icon',
    html: `<div style="
      background: linear-gradient(135deg, #10b981, #059669);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
      border: 3px solid white;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Custom stop icon (red X)
const createStopIcon = () => {
  return L.divIcon({
    className: 'custom-stop-icon',
    html: `<div style="
      background: linear-gradient(135deg, #D40511, #a0040d);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(212, 5, 17, 0.5);
      border: 3px solid white;
      animation: shake 0.5s infinite;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Map controller - auto zoom to fit bounds
const MapController = ({ bounds, currentCoords, status, destCoords, stopCoords, isPending }) => {
  const map = useMap();
  const hasFitted = useRef(false);
  
  useEffect(() => {
    if (bounds && !hasFitted.current) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
      hasFitted.current = true;
    } else if (currentCoords && !hasFitted.current) {
      map.setView([currentCoords.lat, currentCoords.lng], 5);
      hasFitted.current = true;
    }
  }, [bounds, currentCoords, map]);

  // Pan to destination when arrived/delivered (but don't zoom in)
  useEffect(() => {
    if ((status === 'arrived' || status === 'delivered') && destCoords) {
      map.panTo([destCoords.lat, destCoords.lng], { animate: true, duration: 1.5 });
    }
  }, [status, destCoords, map]);

  // Pan to stop location when stopped (but don't zoom in)
  useEffect(() => {
    if (status === 'stopped' && stopCoords) {
      map.panTo([stopCoords.lat, stopCoords.lng], { animate: true, duration: 1.5 });
    }
  }, [status, stopCoords, map]);

  return null;
};

const MapTracker = ({ currentLocation, destination, origin, status, progress, stopReason }) => {
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [animatedPosition, setAnimatedPosition] = useState(null);
  const [autoMovingPosition, setAutoMovingPosition] = useState(null);
  const [showArrivedPopup, setShowArrivedPopup] = useState(false);
  const [showStoppedPopup, setShowStoppedPopup] = useState(false);
  const [showCountryInfo, setShowCountryInfo] = useState(false);
  const animationRef = useRef(null);
  const autoMoveRef = useRef(null);

  const currentCoords = getCoords(currentLocation);
  const destCoords = getCoords(destination);
  const originCoords = getCoords(origin);

  const currentName = getLocationName(currentLocation) || 'Current';
  const destName = getLocationName(destination) || 'Destination';
  const originName = getLocationName(origin) || 'Origin';

  // Calculate distance and estimated time
  const distanceKm = useMemo(() => {
    if (currentCoords && destCoords) {
      return calculateDistance(currentCoords.lat, currentCoords.lng, destCoords.lat, destCoords.lng);
    }
    return 0;
  }, [currentCoords, destCoords]);

  const estimatedTime = useMemo(() => estimateDeliveryTime(distanceKm), [distanceKm]);

  const isPending = status === 'pending';
  const isStopped = status === 'stopped';
  const isDelivered = status === 'delivered';
  const isInTransit = status === 'in_transit';
  const isArrived = status === 'arrived';

  // Auto-move plane when in_transit (simulate movement)
  useEffect(() => {
    if (status === 'in_transit' && currentCoords && destCoords) {
      const startLat = currentCoords.lat;
      const startLng = currentCoords.lng;
      const endLat = destCoords.lat;
      const endLng = destCoords.lng;
      const totalDuration = 30000; // 30 seconds to reach destination for demo
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / totalDuration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        
        const lat = startLat + (endLat - startLat) * ease;
        const lng = startLng + (endLng - startLng) * ease;
        
        setAutoMovingPosition([lat, lng]);

        if (t < 1) {
          autoMoveRef.current = requestAnimationFrame(animate);
        }
      };

      autoMoveRef.current = requestAnimationFrame(animate);
    } else {
      setAutoMovingPosition(null);
      if (autoMoveRef.current) {
        cancelAnimationFrame(autoMoveRef.current);
      }
    }

    return () => {
      if (autoMoveRef.current) {
        cancelAnimationFrame(autoMoveRef.current);
      }
    };
  }, [status, currentCoords, destCoords]);

  // When status is arrived/delivered, animate plane to destination
  useEffect(() => {
    if ((status === 'arrived' || status === 'delivered') && currentCoords && destCoords) {
      const startLat = currentCoords.lat;
      const startLng = currentCoords.lng;
      const endLat = destCoords.lat;
      const endLng = destCoords.lng;
      const duration = 1500; // 1.5 seconds
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        
        const lat = startLat + (endLat - startLat) * ease;
        const lng = startLng + (endLng - startLng) * ease;
        
        setAnimatedPosition([lat, lng]);

        if (t < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      // Show arrived popup after animation
      if (status === 'arrived') {
        const timer = setTimeout(() => setShowArrivedPopup(true), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      setAnimatedPosition(null);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, currentCoords, destCoords]);

  // Show stopped popup when status is stopped
  useEffect(() => {
    if (status === 'stopped') {
      setShowStoppedPopup(true);
    } else {
      setShowStoppedPopup(false);
    }
  }, [status]);

  // Show country info when arrived
  useEffect(() => {
    if (status === 'arrived' || status === 'delivered') {
      setShowCountryInfo(true);
    } else {
      setShowCountryInfo(false);
    }
  }, [status]);

  // Determine plane position: auto-moving > animated > current (for pending, stay at origin/current)
  const planePosition = useMemo(() => {
    if (autoMovingPosition) return autoMovingPosition;
    if (animatedPosition) return animatedPosition;
    if (isArrived || isDelivered) {
      if (destCoords) return [destCoords.lat, destCoords.lng];
    }
    if (currentCoords) return [currentCoords.lat, currentCoords.lng];
    return [0, 0];
  }, [autoMovingPosition, animatedPosition, isArrived, isDelivered, currentCoords, destCoords]);

  // Calculate bounds for map view
  const bounds = useMemo(() => {
    if (currentCoords && destCoords) {
      return [
        [Math.min(currentCoords.lat, destCoords.lat) - 2, Math.min(currentCoords.lng, destCoords.lng) - 2],
        [Math.max(currentCoords.lat, destCoords.lat) + 2, Math.max(currentCoords.lng, destCoords.lng) + 2]
      ];
    }
    return null;
  }, [currentCoords, destCoords]);

  // Path points - only show route line when in_transit or stopped, NOT when arrived/delivered/pending
  const pathPoints = useMemo(() => {
    if (isArrived || isDelivered || isPending) return [];
    if (planePosition && destCoords) {
      return [
        planePosition,
        [destCoords.lat, destCoords.lng],
      ];
    }
    return [];
  }, [planePosition, destCoords, isArrived, isDelivered, isPending]);

  // Get country and city from location name
  const getCountryFromLocation = (locName) => {
    if (!locName) return '';
    const parts = locName.split(',');
    return parts[parts.length - 1]?.trim() || '';
  };

  const getCityFromLocation = (locName) => {
    if (!locName) return '';
    const parts = locName.split(',');
    return parts[0]?.trim() || '';
  };

  const destCountry = getCountryFromLocation(destName);
  const destCity = getCityFromLocation(destName);

  // Calculate display progress
  const displayProgress = useMemo(() => {
    if (isArrived || isDelivered) return 1; // 100% complete when arrived/delivered
    return progress || 0;
  }, [isArrived, isDelivered, progress]);

  if (!currentCoords || !destCoords) {
    return (
      <div className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg border-t-4 border-dhl-yellow p-8 text-center">
        <svg className="w-12 h-12 text-dhl-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase mb-2">Location Data Unavailable</h3>
        <p className="text-dhl-gray-500">Map tracking requires valid GPS coordinates.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-dhl-gray-900 rounded-sm shadow-lg overflow-hidden border-t-4 border-dhl-yellow"
    >
      <div className="p-4 bg-dhl-gray-50 dark:bg-dhl-gray-800 border-b border-dhl-gray-200 dark:border-dhl-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-black text-dhl-black dark:text-white uppercase flex items-center gap-2">
          <svg className="w-5 h-5 text-dhl-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.894-.447L15 7m0 13V7" />
          </svg>
          Live Tracking Map
        </h3>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          {origin && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-dhl-gray-600"></div>
              <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{originName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isStopped ? 'bg-dhl-red animate-pulse' : isArrived || isDelivered ? 'bg-green-500' : 'bg-dhl-yellow animate-pulse'}`}></div>
            <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">
              {isArrived || isDelivered ? destName : currentName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-dhl-red"></div>
            <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{destName}</span>
          </div>
        </div>
      </div>
      {/* ETA Banner when in transit */}
      {isInTransit && (
        <div className="px-4 py-2 bg-dhl-yellow/10 border-b border-dhl-yellow/30 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-dhl-yellow" />
          <span className="text-sm font-bold text-dhl-black dark:text-white">
            Estimated arrival: <span className="text-dhl-yellow">{estimatedTime}</span> 
            <span className="text-dhl-gray-500 ml-2">({Math.round(distanceKm)} km remaining)</span>
          </span>
        </div>
      )}

      <div className="h-[500px] relative bg-dhl-gray-100 dark:bg-dhl-gray-800 overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={2}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: '#e5e7eb' }}
        >
          <MapController 
            bounds={bounds} 
            currentCoords={currentCoords} 
            status={status} 
            destCoords={destCoords}
            stopCoords={isStopped ? currentCoords : null}
            isPending={isPending}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route line - only show when in_transit or stopped */}
          {pathPoints.length > 0 && (
            <Polyline
              positions={pathPoints}
              color={isStopped ? '#D40511' : '#0ea5e9'}
              weight={5}
              opacity={0.9}
              dashArray={isStopped ? '10, 10' : null}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Plane marker */}
          <Marker
            position={planePosition}
            icon={createPlaneIcon(isStopped, isArrived || isDelivered)}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <p className="font-bold text-dhl-black text-lg mb-1">
                  {isStopped ? '🛑 DELIVERY STOPPED' : isArrived ? '📦 ARRIVED AT DESTINATION' : isDelivered ? '✅ DELIVERED' : '✈️ Current Location'}
                </p>
                <p className="text-dhl-gray-600 mb-2">
                  {isArrived || isDelivered ? destName : currentName}
                </p>
                {isInTransit && (
                  <div className="bg-dhl-yellow/10 rounded-sm p-2 mt-2">
                    <p className="text-dhl-yellow text-sm font-bold">⏱️ ETA: {estimatedTime}</p>
                    <p className="text-dhl-gray-500 text-xs">{Math.round(distanceKm)} km to destination</p>
                  </div>
                )}
                {isStopped && stopReason && (
                  <div className="bg-dhl-red/10 border border-dhl-red rounded-sm p-2 mt-2">
                    <p className="text-dhl-red text-sm font-semibold">Stop Reason:</p>
                    <p className="text-dhl-red text-sm">{stopReason}</p>
                  </div>
                )}
                {(isArrived || isDelivered) && (
                  <p className="text-green-600 text-sm font-bold mt-2">
                    {isArrived ? 'Package has arrived at destination!' : 'Package successfully delivered!'}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Stop location marker (when stopped) */}
          {isStopped && currentCoords && (
            <Marker
              position={[currentCoords.lat, currentCoords.lng]}
              icon={createStopIcon()}
            >
              <Popup autoPan={true} openOn={true}>
                <div className="p-3 min-w-[220px]">
                  <p className="font-bold text-dhl-red text-lg mb-1">🛑 DELIVERY STOPPED</p>
                  <p className="text-dhl-gray-600 mb-2">{currentName}</p>
                  <div className="bg-dhl-red/10 border border-dhl-red rounded-sm p-2">
                    <p className="text-dhl-red text-sm font-semibold">Stop Reason:</p>
                    <p className="text-dhl-red text-sm font-bold">{stopReason || 'Unknown reason'}</p>
                  </div>
                  <p className="text-xs text-dhl-gray-400 mt-2">
                    Stopped at: {currentCoords.lat?.toFixed(4)}, {currentCoords.lng?.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination marker - always show country and city in popup */}
          <Marker
            position={[destCoords.lat, destCoords.lng]}
            icon={createDestinationIcon()}
          >
            <Popup>
              <div className="p-3">
                <p className="font-bold text-dhl-black text-lg mb-1">📍 Destination</p>
                <p className="text-dhl-gray-600 font-semibold">{destName}</p>
                {destCountry && (
                  <p className="text-sm text-dhl-gray-500 mt-1">🌍 Country: {destCountry}</p>
                )}
                {destCity && (
                  <p className="text-sm text-dhl-gray-500">🏙️ City: {destCity}</p>
                )}
                <p className="text-xs text-dhl-gray-400 mt-2">
                  {destCoords.lat?.toFixed(4)}, {destCoords.lng?.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className={`px-4 py-2 rounded-sm font-black text-sm shadow-lg border-2 uppercase tracking-wider ${
            status === 'stopped' ? 'bg-dhl-red text-white border-dhl-red-dark animate-pulse' :
            status === 'delivered' ? 'bg-green-500 text-white border-green-600' :
            status === 'in_transit' ? 'bg-dhl-yellow text-dhl-black border-dhl-yellow-dark' :
            status === 'arrived' ? 'bg-green-500 text-white border-green-600 animate-pulse' :
            'bg-dhl-yellow text-dhl-black border-dhl-yellow-dark'
          }`}>
            {status === 'stopped' && <span className="mr-2">🛑</span>}
            {status === 'in_transit' && <span className="animate-pulse mr-2">●</span>}
            {status === 'arrived' && <span className="mr-2">📦</span>}
            {status === 'delivered' && <span className="mr-2">✅</span>}
            {status?.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Stopped Popup Overlay */}
        <AnimatePresence>
          {isStopped && showStoppedPopup && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-4 left-4 right-4 z-[1000]"
            >
              <div className="bg-dhl-red/95 backdrop-blur-sm text-white p-4 rounded-sm shadow-2xl border-2 border-dhl-red-dark">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg uppercase tracking-wider">DELIVERY STOPPED</p>
                    <p className="text-white/80 font-semibold">{stopReason || 'Unknown reason'}</p>
                    <p className="text-white/60 text-xs mt-1">
                      Location: {currentName} ({currentCoords.lat?.toFixed(4)}, {currentCoords.lng?.toFixed(4)})
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowStoppedPopup(false)}
                    className="p-2 bg-white/20 rounded-sm hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress overlay */}
        {isInTransit && !isStopped && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-white/95 dark:bg-dhl-gray-900/95 backdrop-blur-sm rounded-sm p-4 shadow-xl border border-dhl-gray-200 dark:border-dhl-gray-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-bold uppercase tracking-wider">Delivery Progress</span>
                <span className="font-black text-dhl-yellow text-lg">{Math.round(displayProgress * 100)}%</span>
              </div>
              <div className="h-3 bg-dhl-gray-200 dark:bg-dhl-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-dhl-yellow to-dhl-red rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${displayProgress * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-xs text-dhl-gray-500">Updates every 5 minutes</p>
                <p className="text-xs text-dhl-yellow font-bold">⏱️ {estimatedTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Arrived overlay with country info */}
        <AnimatePresence>
          {isArrived && showArrivedPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-16 left-4 right-4 z-[1000]"
            >
              <div className="bg-green-500/95 backdrop-blur-sm text-white p-4 rounded-sm shadow-xl border-2 border-green-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg uppercase tracking-wider">📦 Package Arrived!</p>
                    <p className="text-white/80 font-semibold">Your package has reached {destName}</p>
                    {showCountryInfo && destCountry && (
                      <p className="text-white/90 text-sm font-bold mt-1">
                        🌍 Country: {destCountry}
                      </p>
                    )}
                    <p className="text-white/60 text-xs mt-1">
                      {destCoords.lat?.toFixed(4)}, {destCoords.lng?.toFixed(4)}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowArrivedPopup(false)}
                    className="p-2 bg-white/20 rounded-sm hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivered overlay */}
        {isDelivered && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-green-500/95 backdrop-blur-sm text-white p-4 rounded-sm shadow-xl border-2 border-green-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg uppercase tracking-wider">✅ Package Delivered!</p>
                  <p className="text-white/80">Successfully delivered to {destName}</p>
                  {showCountryInfo && destCountry && (
                    <p className="text-white/90 text-sm font-bold mt-1">
                      🌍 Country: {destCountry}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 bg-dhl-gray-50 dark:bg-dhl-gray-800/50 border-t border-dhl-gray-200 dark:border-dhl-gray-700 flex flex-wrap gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dhl-gray-600"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isArrived || isDelivered ? 'bg-green-500' : 'bg-dhl-yellow'}`}></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">
            {isArrived || isDelivered ? 'Arrived' : 'Current Location'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dhl-red"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-dhl-yellow"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Route</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MapTracker;
