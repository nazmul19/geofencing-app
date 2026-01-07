import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationSelector({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
}

// Component to center map on user initially or when requested
function MapController({ center, zoom, flyToTarget }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom);
        }
    }, [center, zoom, map]);

    useEffect(() => {
        if (flyToTarget) {
            map.flyTo([flyToTarget.lat, flyToTarget.lng], 16, { animate: true });
        }
    }, [flyToTarget, map]);

    return null;
}

const MapComponent = ({ userLocation, geofenceCenter, geofenceRadius, onMapClick, centerMapTrigger }) => {
    // Default center if no location yet
    const defaultCenter = [51.505, -0.09];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="map-container"
            zoomControl={false} // We can hide default zoom control for mobile look or move it
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Handle clicks to set geofence */}
            <LocationSelector onLocationSelect={onMapClick} />

            {/* Programmatic Control */}
            <MapController
                center={centerMapTrigger ? [userLocation?.lat, userLocation?.lng] : null}
                flyToTarget={geofenceCenter}
                zoom={16}
            />

            {/* Geofence Area */}
            {geofenceCenter && (
                <>
                    <Circle
                        center={[geofenceCenter.lat, geofenceCenter.lng]}
                        radius={geofenceRadius}
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                    />
                    <Marker position={[geofenceCenter.lat, geofenceCenter.lng]} />
                </>
            )}

            {/* User Location */}
            {userLocation && (
                <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={8}
                    pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
                >
                    {/* Pulsing effect could be added with CSS on a divIcon, but CircleMarker is simple and effective */}
                </CircleMarker>
            )}
        </MapContainer>
    );
};

export default MapComponent;
