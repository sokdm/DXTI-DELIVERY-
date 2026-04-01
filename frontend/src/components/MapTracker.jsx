import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, GeoJSON } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon with animation
const createTruckIcon = (isStopped) => {
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="
      background: ${isStopped ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0ea5e9, #6366f1)'};
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px ${isStopped ? 'rgba(239, 68, 68, 0.5)' : 'rgba(14, 165, 233, 0.5)'};
      border: 3px solid white;
      animation: ${isStopped ? 'none' : 'pulse 2s infinite'};
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
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

// Map controller component
const MapController = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

// Simple country boundaries GeoJSON (major countries only for performance)
const countryBoundaries = {
  "type": "FeatureCollection",
  "features": [
    // United States
    {"type":"Feature","properties":{"name":"United States"},"geometry":{"type":"Polygon","coordinates":[[[-125,25],[-125,49],[-66,49],[-66,25],[-125,25]]]}},
    // Mexico
    {"type":"Feature","properties":{"name":"Mexico"},"geometry":{"type":"Polygon","coordinates":[[[-117,14],[-117,32],[-86,32],[-86,14],[-117,14]]]}},
    // Canada
    {"type":"Feature","properties":{"name":"Canada"},"geometry":{"type":"Polygon","coordinates":[[[-140,48],[-140,70],[-52,70],[-52,48],[-140,48]]]}},
    // Brazil
    {"type":"Feature","properties":{"name":"Brazil"},"geometry":{"type":"Polygon","coordinates":[[[-74,-34],[-74,5],[-34,5],[-34,-34],[-74,-34]]]}},
    // United Kingdom
    {"type":"Feature","properties":{"name":"United Kingdom"},"geometry":{"type":"Polygon","coordinates":[[[-8,50],[2,50],[2,59],[-8,59],[-8,50]]]}},
    // France
    {"type":"Feature","properties":{"name":"France"},"geometry":{"type":"Polygon","coordinates":[[[-5,42],[8,42],[8,51],[-5,51],[-5,42]]]}},
    // Germany
    {"type":"Feature","properties":{"name":"Germany"},"geometry":{"type":"Polygon","coordinates":[[[6,47],[15,47],[15,55],[6,55],[6,47]]]}},
    // Nigeria
    {"type":"Feature","properties":{"name":"Nigeria"},"geometry":{"type":"Polygon","coordinates":[[[3,4],[14,4],[14,14],[3,14],[3,4]]]}},
    // South Africa
    {"type":"Feature","properties":{"name":"South Africa"},"geometry":{"type":"Polygon","coordinates":[[[16,-35],[33,-35],[33,-22],[16,-22],[16,-35]]]}},
    // India
    {"type":"Feature","properties":{"name":"India"},"geometry":{"type":"Polygon","coordinates":[[[68,8],[97,8],[97,37],[68,37],[68,8]]]}},
    // China
    {"type":"Feature","properties":{"name":"China"},"geometry":{"type":"Polygon","coordinates":[[[73,18],[135,18],[135,54],[73,54],[73,18]]]}},
    // Russia
    {"type":"Feature","properties":{"name":"Russia"},"geometry":{"type":"Polygon","coordinates":[[[27,41],[180,41],[180,82],[27,82],[27,41]]]}},
    // Australia
    {"type":"Feature","properties":{"name":"Australia"},"geometry":{"type":"Polygon","coordinates":[[[113,-44],[154,-44],[154,-10],[113,-10],[113,-44]]]}},
    // Japan
    {"type":"Feature","properties":{"name":"Japan"},"geometry":{"type":"Polygon","coordinates":[[[129,31],[146,31],[146,46],[129,46],[129,31]]]}},
    // Egypt
    {"type":"Feature","properties":{"name":"Egypt"},"geometry":{"type":"Polygon","coordinates":[[[25,22],[35,22],[35,32],[25,32],[25,22]]]}},
  ]
};

const MapTracker = ({ currentLocation, destination, status, progress, stopReason }) => {
  const [mapCenter, setMapCenter] = useState([
    currentLocation?.lat || 0,
    currentLocation?.lng || 0
  ]);

  // Update center when location changes
  useEffect(() => {
    setMapCenter([currentLocation?.lat || 0, currentLocation?.lng || 0]);
  }, [currentLocation]);

  // Calculate bounds for map view
  const bounds = useMemo(() => {
    if (currentLocation && destination) {
      return [
        [Math.min(currentLocation.lat, destination.lat), Math.min(currentLocation.lng, destination.lng)],
        [Math.max(currentLocation.lat, destination.lat), Math.max(currentLocation.lng, destination.lng)]
      ];
    }
    return null;
  }, [currentLocation, destination]);

  // Path points
  const pathPoints = useMemo(() => {
    if (currentLocation && destination) {
      return [
        [currentLocation.lat, currentLocation.lng],
        [destination.lat, destination.lng],
      ];
    }
    return [];
  }, [currentLocation, destination]);

  // Country style
  const countryStyle = {
    fillColor: '#e2e8f0',
    weight: 2,
    opacity: 0.6,
    color: '#64748b',
    fillOpacity: 0.2,
    dashArray: '3',
  };

  const isStopped = status === 'stopped';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-dxt-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.894-.447L15 7m0 13V7" />
          </svg>
          Live Tracking Map
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isStopped ? 'bg-red-500' : 'bg-dxt-primary animate-pulse'}`}></div>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {currentLocation?.locationName}
            </span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {destination?.locationName}
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-96 relative">
        <MapContainer
          center={mapCenter}
          zoom={4}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: '#f1f5f9' }}
        >
          <MapController bounds={bounds} />
          
          {/* Better tile layer with labels */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Country boundaries */}
          <GeoJSON 
            data={countryBoundaries} 
            style={countryStyle}
            interactive={false}
          />

          {/* Path line with gradient effect */}
          <Polyline
            positions={pathPoints}
            color={isStopped ? '#ef4444' : '#0ea5e9'}
            weight={4}
            opacity={0.8}
            dashArray={isStopped ? '10, 10' : null}
            lineCap="round"
            lineJoin="round"
          />

          {/* Current location marker (Truck) */}
          <Marker
            position={[currentLocation?.lat || 0, currentLocation?.lng || 0]}
            icon={createTruckIcon(isStopped)}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <p className="font-bold text-slate-900 text-lg mb-1">
                  {isStopped ? '🛑 DELIVERY STOPPED' : '🚚 Current Location'}
                </p>
                <p className="text-slate-600 mb-2">{currentLocation?.locationName}</p>
                {isStopped && stopReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                    <p className="text-red-700 text-sm font-semibold">Stop Reason:</p>
                    <p className="text-red-600 text-sm">{stopReason}</p>
                  </div>
                )}
                {status === 'in_transit' && !isStopped && (
                  <p className="text-dxt-primary text-sm font-medium mt-2">
                    Moving to destination... ({Math.round(progress * 100)}%)
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Destination marker */}
          <Marker
            position={[destination?.lat || 0, destination?.lng || 0]}
            icon={createDestinationIcon()}
          >
            <Popup>
              <div className="p-3">
                <p className="font-bold text-slate-900 text-lg mb-1">📍 Destination</p>
                <p className="text-slate-600">{destination?.locationName}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {destination?.lat?.toFixed(4)}, {destination?.lng?.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Status Badge - Shows STOPPED clearly */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg border-2 ${
            status === 'stopped' 
              ? 'bg-red-500 text-white border-red-600 animate-pulse' 
              : status === 'delivered' 
              ? 'bg-green-500 text-white border-green-600'
              : status === 'in_transit' 
              ? 'bg-blue-500 text-white border-blue-600'
              : status === 'arrived'
              ? 'bg-purple-500 text-white border-purple-600'
              : 'bg-yellow-500 text-white border-yellow-600'
          }`}>
            {status === 'stopped' && <span className="mr-2">🛑</span>}
            {status === 'in_transit' && <span className="animate-pulse mr-2">●</span>}
            {status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Stop Reason Banner - Only shows when stopped */}
        {isStopped && stopReason && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-red-500/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border-2 border-red-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg">DELIVERY STOPPED</p>
                  <p className="text-red-100">{stopReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress overlay - Only shows when in transit */}
        {status === 'in_transit' && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Delivery Progress</span>
                <span className="font-bold text-dxt-primary text-lg">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-dxt-primary to-dxt-secondary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Updates every 5 minutes</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dxt-primary"></div>
          <span className="text-slate-600 dark:text-slate-400">Current Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Stopped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-dxt-primary"></div>
          <span className="text-slate-600 dark:text-slate-400">Route</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MapTracker;
