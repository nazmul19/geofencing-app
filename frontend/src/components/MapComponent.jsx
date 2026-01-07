import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Clock, MapPin } from 'lucide-react';

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
        if (center && center[0] && center[1]) {
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

const MapComponent = ({ userLocation, geofenceCenter, geofenceRadius, onMapClick, centerMapTrigger, assignedSites = [] }) => {
    const defaultCenter = [19.076, 72.877]; // Default to Mumbai or somewhere more relevant if needed, or 51.505, -0.09

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="map-container"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationSelector onLocationSelect={onMapClick} />

            <MapController
                center={centerMapTrigger ? [userLocation?.lat, userLocation?.lng] : null}
                flyToTarget={geofenceCenter}
                zoom={16}
            />

            {/* Current Draft Geofence (for creation/interaction) */}
            {geofenceCenter && (
                <>
                    <Circle
                        center={[geofenceCenter.lat, geofenceCenter.lng]}
                        radius={geofenceRadius}
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, dashArray: '5,5' }}
                    />
                    <Marker position={[geofenceCenter.lat, geofenceCenter.lng]} />
                </>
            )}

            {/* Assigned Sites/Assignments */}
            {assignedSites.map((assignment) => {
                if (!assignment.geofence) return null;
                const { latitude, longitude, radius, name } = assignment.geofence;
                const isPlanned = assignment.status === 'PLANNED';

                return (
                    <React.Fragment key={assignment.id}>
                        <Circle
                            center={[latitude, longitude]}
                            radius={radius}
                            pathOptions={{
                                color: isPlanned ? '#fbbf24' : '#10b981',
                                fillColor: isPlanned ? '#fbbf24' : '#10b981',
                                fillOpacity: 0.15,
                                weight: 2
                            }}
                        />
                        <CircleMarker
                            center={[latitude, longitude]}
                            radius={5}
                            pathOptions={{
                                color: 'white',
                                fillColor: isPlanned ? '#fbbf24' : '#10b981',
                                fillOpacity: 1,
                                weight: 1.5
                            }}
                        >
                            <Popup minWidth={150}>
                                <div style={{ color: '#333' }}>
                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <MapPin size={14} /> {name}
                                    </div>
                                    <div style={{ fontSize: '0.85em', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Clock size={14} /> {formatTime(assignment.scheduledTime)}
                                    </div>
                                    <div style={{
                                        marginTop: '8px',
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75em',
                                        background: isPlanned ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: isPlanned ? '#b45309' : '#059669',
                                        fontWeight: 600
                                    }}>
                                        {assignment.status}
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    </React.Fragment>
                );
            })}

            {/* User Location */}
            {userLocation && (
                <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={8}
                    pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
                />
            )}
        </MapContainer>
    );
};

export default MapComponent;
