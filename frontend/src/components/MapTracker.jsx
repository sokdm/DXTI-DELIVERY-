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

// Custom truck icon with animation
const createTruckIcon = (isStopped) => {
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="
      background: ${isStopped ? 'linear-gradient(135deg, #D40511, #a0040d)' : 'linear-gradient(135deg, #FFCC00, #e6b800)'};
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px ${isStopped ? 'rgba(212, 5, 17, 0.5)' : 'rgba(255, 204, 0, 0.5)'};
      border: 3px solid white;
      animation: ${isStopped ? 'none' : 'pulse 2s infinite'};
    ">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${isStopped ? 'white' : '#333333'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
      background: linear-gradient(135deg, #D40511, #a0040d);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(212, 5, 17, 0.5);
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

// Simple country boundaries GeoJSON
const countryBoundaries = {
  "type": "FeatureCollection",
  "features": [
    {"type":"Feature","properties":{"name":"United States"},"geometry":{"type":"Polygon","coordinates":[[[-125,25],[-125,49],[-66,49],[-66,25],[-125,25]]]}},
    {"type":"Feature","properties":{"name":"Mexico"},"geometry":{"type":"Polygon","coordinates":[[[-117,14],[-117,32],[-86,32],[-86,14],[-117,14]]]}},
    {"type":"Feature","properties":{"name":"Canada"},"geometry":{"type":"Polygon","coordinates":[[[-140,48],[-140,70],[-52,70],[-52,48],[-140,48]]]}},
    {"type":"Feature","properties":{"name":"Brazil"},"geometry":{"type":"Polygon","coordinates":[[[-74,-34],[-74,5],[-34,5],[-34,-34],[-74,-34]]]}},
    {"type":"Feature","properties":{"name":"United Kingdom"},"geometry":{"type":"Polygon","coordinates":[[[-8,50],[2,50],[2,59],[-8,59],[-8,50]]]}},
    {"type":"Feature","properties":{"name":"France"},"geometry":{"type":"Polygon","coordinates":[[[-5,42],[8,42],[8,51],[-5,51],[-5,42]]]}},
    {"type":"Feature","properties":{"name":"Germany"},"geometry":{"type":"Polygon","coordinates":[[[6,47],[15,47],[15,55],[6,55],[6,47]]]}},
    {"type":"Feature","properties":{"name":"Nigeria"},"geometry":{"type":"Polygon","coordinates":[[[3,4],[14,4],[14,14],[3,14],[3,4]]]}},
    {"type":"Feature","properties":{"name":"South Africa"},"geometry":{"type":"Polygon","coordinates":[[[16,-35],[33,-35],[33,-22],[16,-22],[16,-35]]]}},
    {"type":"Feature","properties":{"name":"India"},"geometry":{"type":"Polygon","coordinates":[[[68,8],[97,8],[97,37],[68,37],[68,8]]]}},
    {"type":"Feature","properties":{"name":"China"},"geometry":{"type":"Polygon","coordinates":[[[73,18],[135,18],[135,54],[73,54],[73,18]]]}},
    {"type":"Feature","properties":{"name":"Russia"},"geometry":{"type":"Polygon","coordinates":[[[27,41],[180,41],[180,82],[27,82],[27,41]]]}},
    {"type":"Feature","properties":{"name":"Australia"},"geometry":{"type":"Polygon","coordinates":[[[113,-44],[154,-44],[154,-10],[113,-10],[113,-44]]]}},
    {"type":"Feature","properties":{"name":"Japan"},"geometry":{"type":"Polygon","coordinates":[[[129,31],[146,31],[146,46],[129,46],[129,31]]]}},
    {"type":"Feature","properties":{"name":"Egypt"},"geometry":{"type":"Polygon","coordinates":[[[25,22],[35,22],[35,32],[25,32],[25,22]]]}},
  ]
};

const MapTracker = ({ currentLocation, destination, origin, status, progress, stopReason }) => {
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const currentCoords = getCoords(currentLocation);
  const destCoords = getCoords(destination);
  const originCoords = getCoords(origin);

  const currentName = getLocationName(currentLocation) || 'Current';
  const destName = getLocationName(destination) || 'Destination';
  const originName = getLocationName(origin) || 'Origin';

  // Update center when location changes
  useEffect(() => {
    if (currentCoords) {
      setMapCenter([currentCoords.lat, currentCoords.lng]);
    }
  }, [currentLocation]);

  // Calculate bounds for map view
  const bounds = useMemo(() => {
    if (currentCoords && destCoords) {
      return [
        [Math.min(currentCoords.lat, destCoords.lat), Math.min(currentCoords.lng, destCoords.lng)],
        [Math.max(currentCoords.lat, destCoords.lat), Math.max(currentCoords.lng, destCoords.lng)]
      ];
    }
    return null;
  }, [currentCoords, destCoords]);

  // Path points
  const pathPoints = useMemo(() => {
    if (currentCoords && destCoords) {
      return [
        [currentCoords.lat, currentCoords.lng],
        [destCoords.lat, destCoords.lng],
      ];
    }
    return [];
  }, [currentCoords, destCoords]);

  // Country style
  const countryStyle = {
    fillColor: '#E8E8E8',
    weight: 2,
    opacity: 0.6,
    color: '#999999',
    fillOpacity: 0.2,
    dashArray: '3',
  };

  const isStopped = status === 'stopped';
  const isDelivered = status === 'delivered';
  const isInTransit = status === 'in_transit';

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
            <div className={`w-3 h-3 rounded-full ${isStopped ? 'bg-dhl-red animate-pulse' : 'bg-dhl-yellow animate-pulse'}`}></div>
            <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{currentName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-dhl-red"></div>
            <span className="text-dhl-gray-600 dark:text-dhl-gray-300 font-medium">{destName}</span>
          </div>
        </div>
      </div>

      <div className="h-96 relative bg-dhl-gray-100 dark:bg-dhl-gray-800 overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={4}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ background: '#F5F5F5' }}
        >
          <MapController bounds={bounds} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <GeoJSON
            data={countryBoundaries}
            style={countryStyle}
            interactive={false}
          />

          <Polyline
            positions={pathPoints}
            color={isStopped ? '#D40511' : '#FFCC00'}
            weight={4}
            opacity={0.8}
            dashArray={isStopped ? '10, 10' : null}
            lineCap="round"
            lineJoin="round"
          />

          <Marker
            position={[currentCoords.lat, currentCoords.lng]}
            icon={createTruckIcon(isStopped)}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <p className="font-bold text-dhl-black text-lg mb-1">
                  {isStopped ? '🛑 DELIVERY STOPPED' : '🚚 Current Location'}
                </p>
                <p className="text-dhl-gray-600 mb-2">{currentName}</p>
                {isStopped && stopReason && (
                  <div className="bg-dhl-red/10 border border-dhl-red rounded-sm p-2 mt-2">
                    <p className="text-dhl-red text-sm font-semibold">Stop Reason:</p>
                    <p className="text-dhl-red text-sm">{stopReason}</p>
                  </div>
                )}
                {isInTransit && !isStopped && (
                  <p className="text-dhl-yellow text-sm font-medium mt-2">
                    Moving to destination... ({Math.round((progress || 0) * 100)}%)
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          <Marker
            position={[destCoords.lat, destCoords.lng]}
            icon={createDestinationIcon()}
          >
            <Popup>
              <div className="p-3">
                <p className="font-bold text-dhl-black text-lg mb-1">📍 Destination</p>
                <p className="text-dhl-gray-600">{destName}</p>
                <p className="text-xs text-dhl-gray-400 mt-1">
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
            status === 'arrived' ? 'bg-purple-500 text-white border-purple-600' :
            'bg-dhl-yellow text-dhl-black border-dhl-yellow-dark'
          }`}>
            {status === 'stopped' && <span className="mr-2">🛑</span>}
            {status === 'in_transit' && <span className="animate-pulse mr-2">●</span>}
            {status === 'delivered' && <span className="mr-2">✅</span>}
            {status?.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Stop Reason Banner */}
        {isStopped && stopReason && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-dhl-red/95 backdrop-blur-sm text-white p-4 rounded-sm shadow-2xl border-2 border-dhl-red-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg uppercase tracking-wider">DELIVERY STOPPED</p>
                  <p className="text-white/80">{stopReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress overlay */}
        {isInTransit && !isStopped && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
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
              <p className="text-xs text-dhl-gray-500 mt-2">Updates every 5 minutes</p>
            </div>
          </div>
        )}

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
                <div>
                  <p className="font-bold text-lg uppercase tracking-wider">Package Delivered!</p>
                  <p className="text-white/80">Successfully delivered to destination</p>
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
          <div className="w-3 h-3 rounded-full bg-dhl-yellow"></div>
          <span className="text-dhl-gray-600 dark:text-dhl-gray-400 font-medium">Current Location</span>
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
