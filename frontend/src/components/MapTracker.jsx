import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const getLocationName = (location, fallback) => {
  if (!location) return fallback;
  if (typeof location === 'string') return location;
  return location.locationName || location.name || location.city || fallback;
};

const getCoordinates = (location) => {
  if (!location || typeof location !== 'object') return null;
  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
};

const MapBounds = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 2) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 7 });
    } else if (points.length === 1) {
      map.setView(points[0], 5);
    }
  }, [map, points]);

  return null;
};

const MapTracker = ({ currentLocation, destination }) => {
  const currentPoint = getCoordinates(currentLocation);
  const destinationPoint = getCoordinates(destination);
  const points = [currentPoint, destinationPoint].filter(Boolean);

  if (!points.length) {
    return (
      <section className="rounded-2xl border border-dhl-gray-200 bg-white p-6 dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-dhl-red dark:bg-teal-400/10 dark:text-teal-300"><MapPin className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-dhl-black dark:text-white">Map location not available</h2>
            <p className="mt-1 text-sm leading-6 text-dhl-gray-500 dark:text-dhl-gray-400">Location coordinates have not been recorded for this shipment.</p>
          </div>
        </div>
      </section>
    );
  }

  const center = currentPoint || destinationPoint;

  return (
    <section className="overflow-hidden rounded-2xl border border-dhl-gray-200 bg-white dark:border-dhl-gray-700 dark:bg-dhl-gray-800">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-dhl-black dark:text-white"><MapPin className="h-4 w-4 text-dhl-red" /> Recorded shipment locations</div>
          <p className="mt-1 text-xs leading-5 text-dhl-gray-500 dark:text-dhl-gray-400">The connecting line is for reference only; it does not represent a live route.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {currentPoint && <span className="inline-flex items-center gap-1.5 text-dhl-gray-600 dark:text-dhl-gray-300"><span className="h-2 w-2 rounded-full bg-teal-600" /> {getLocationName(currentLocation, 'Current location')}</span>}
          {destinationPoint && <span className="inline-flex items-center gap-1.5 text-dhl-gray-600 dark:text-dhl-gray-300"><span className="h-2 w-2 rounded-full bg-dhl-yellow" /> {getLocationName(destination, 'Destination')}</span>}
        </div>
      </div>
      <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-[280px] w-full sm:h-[360px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds points={points} />
        {currentPoint && destinationPoint && <Polyline positions={[currentPoint, destinationPoint]} pathOptions={{ color: '#087F8C', weight: 3, opacity: .7, dashArray: '7 9' }} />}
        {currentPoint && (
          <CircleMarker center={currentPoint} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#087F8C', fillOpacity: 1 }}>
            <Popup>{getLocationName(currentLocation, 'Recorded current location')}</Popup>
          </CircleMarker>
        )}
        {destinationPoint && (
          <CircleMarker center={destinationPoint} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#D6A85C', fillOpacity: 1 }}>
            <Popup>{getLocationName(destination, 'Destination')}</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </section>
  );
};

export default MapTracker;
