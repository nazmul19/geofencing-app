import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import AddressSearch from './components/AddressSearch';
import { getDistance } from './utils/geoUtils';
import { Locate, MapPin, Navigation } from 'lucide-react';
import './index.css';

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [geofenceRadius, setGeofenceRadius] = useState(100); // meters
  const [status, setStatus] = useState('unknown'); // 'inside', 'outside', 'unknown'
  const [distance, setDistance] = useState(null);
  const [centerMapTrigger, setCenterMapTrigger] = useState(null);

  // Track User Location
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Calculate Geofence Status
  useEffect(() => {
    if (userLocation && geofenceCenter) {
      const dist = getDistance(
        userLocation.lat, userLocation.lng,
        geofenceCenter.lat, geofenceCenter.lng
      );
      setDistance(Math.round(dist));

      if (dist <= geofenceRadius) {
        setStatus('inside');
      } else {
        setStatus('outside');
      }
    } else {
      setStatus('unknown');
      setDistance(null);
    }
  }, [userLocation, geofenceCenter, geofenceRadius]);

  const handleMapClick = (latlng) => {
    setGeofenceCenter(latlng);
  };

  const handleRecenter = () => {
    if (userLocation) {
      setCenterMapTrigger(Date.now());
    } else {
      alert("Waiting for location...");
    }
  };

  const handleAddressSelect = (location) => {
    setGeofenceCenter(location);
  };

  return (
    <div className="app-container" style={{ width: '100%', height: '100%' }}>

      {/* Top Bar */}
      <div className="top-bar">
        GeoFence Explorer
      </div>

      <AddressSearch onLocationSelect={handleAddressSelect} />

      {/* Map */}
      <div className="map-wrapper">
        <MapComponent
          userLocation={userLocation}
          geofenceCenter={geofenceCenter}
          geofenceRadius={geofenceRadius}
          onMapClick={handleMapClick}
          centerMapTrigger={centerMapTrigger}
        />
      </div>

      {/* Recenter Button */}
      <button className="fab" onClick={handleRecenter} title="Find Me">
        <Navigation size={24} fill="currentColor" />
      </button>

      {/* UI Overlay */}
      <div className="ui-overlay">
        <div className="status-indicator">
          <div className={`status-dot ${status === 'inside' ? 'status-inside' : status === 'outside' ? 'status-outside' : ''}`} style={{ backgroundColor: status === 'unknown' ? '#aaa' : undefined }}></div>
          <span>
            {status === 'inside' ? 'Inside Geofence' : status === 'outside' ? 'Outside Geofence' : 'Set Geofence Zone'}
          </span>
        </div>

        <div className="info-row">
          <span>Distance to center</span>
          <span className="info-value">{distance !== null ? `${distance} m` : '--'}</span>
        </div>

        <div className="info-row">
          <span>Geofence Radius</span>
          <span className="info-value">{geofenceRadius} m</span>
        </div>

        {/* Optional Slider for Radius */}
        <div style={{ marginTop: '10px' }}>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={geofenceRadius}
            onChange={(e) => setGeofenceRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button
            className="action-button primary"
            onClick={() => {
              if (userLocation) {
                setGeofenceCenter(userLocation);
              } else {
                alert("Waiting for location signal...");
              }
            }}
          >
            Set Zone at My Location
          </button>
        </div>

        <div style={{ fontSize: '0.8em', color: '#888', textAlign: 'center', marginTop: '10px' }}>
          Tap on map to move geofence manually
        </div>
      </div>
    </div>
  );
}

export default App;
