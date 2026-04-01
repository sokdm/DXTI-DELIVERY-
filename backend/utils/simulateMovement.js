// Simulate package movement between two points
const simulateMovement = (current, destination, progress = 0) => {
  const lat = current.lat + (destination.lat - current.lat) * progress;
  const lng = current.lng + (destination.lng - current.lng) * progress;
  
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
    progress: Math.min(progress, 1),
  };
};

// Calculate distance between two coordinates in km
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = {
  simulateMovement,
  calculateDistance,
};
