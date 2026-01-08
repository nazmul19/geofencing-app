import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, CircleMarker, Popup, Polyline } from 'react-leaflet';
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
function MapController({ center, zoom, flyToTarget, highlightedGeofences = [] }) {
    const map = useMap();

    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.flyTo(center, zoom);
        }
    }, [center, zoom, map]);

    useEffect(() => {
        if (highlightedGeofences && highlightedGeofences.length > 0) {
            const bounds = L.latLngBounds(highlightedGeofences.map(g => [g.latitude, g.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    }, [highlightedGeofences, map]);

    useEffect(() => {
        if (flyToTarget && highlightedGeofences.length <= 1) {
            map.flyTo([flyToTarget.lat, flyToTarget.lng], 16, { animate: true });
        }
    }, [flyToTarget, map, highlightedGeofences]);

    return null;
}

const MapComponent = ({ userLocation, geofenceCenter, geofenceRadius, onMapClick, centerMapTrigger, assignedSites = [], allGeofences = [], highlightedGeofenceIds = [] }) => {
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
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.3}
            />

            <LocationSelector onLocationSelect={onMapClick} />

            <MapController
                center={centerMapTrigger ? [userLocation?.lat, userLocation?.lng] : null}
                flyToTarget={geofenceCenter}
                highlightedGeofences={allGeofences.filter(g => highlightedGeofenceIds.includes(g.id))}
                zoom={16}
            />

            {/* Current Draft Geofence (for creation/interaction) */}
            {geofenceCenter && (
                <>
                    <Circle
                        center={[geofenceCenter.lat, geofenceCenter.lng]}
                        radius={geofenceRadius}
                        pathOptions={{ color: '#818cf8', fillColor: '#818cf8', fillOpacity: 0.2, dashArray: '5,5' }}
                    />
                    <Marker position={[geofenceCenter.lat, geofenceCenter.lng]} />
                </>
            )}

            {/* Route Polyline if highlighted geofences exist */}
            {highlightedGeofenceIds.length > 1 && (
                <Polyline
                    positions={allGeofences
                        .filter(g => highlightedGeofenceIds.includes(g.id))
                        .map(g => [g.latitude, g.longitude])}
                    pathOptions={{ color: '#fbbf24', weight: 4, opacity: 0.9, dashArray: '1, 10' }} // Sharp dotted line or solid
                />
            )}
            {highlightedGeofenceIds.length > 1 && (
                <Polyline
                    positions={allGeofences
                        .filter(g => highlightedGeofenceIds.includes(g.id))
                        .map(g => [g.latitude, g.longitude])}
                    pathOptions={{ color: '#fbbf24', weight: 2, opacity: 0.5 }} // Subtle solid connector
                />
            )}

            {/* All Geofence Zones */}
            {allGeofences.map((geo) => {
                const isAssigned = assignedSites.some(a => a.geofence?.id === geo.id);
                const isHighlighted = highlightedGeofenceIds.includes(geo.id);
                if (isAssigned && !isHighlighted) return null;

                const activeColor = '#fbbf24'; // Warning Yellow/Neon
                const staticColor = '#10b981'; // Emerald

                return (
                    <React.Fragment key={geo.id}>
                        <Circle
                            center={[geo.latitude, geo.longitude]}
                            radius={geo.radius}
                            pathOptions={{
                                color: isHighlighted ? activeColor : staticColor,
                                fillColor: isHighlighted ? activeColor : staticColor,
                                fillOpacity: isHighlighted ? 0.4 : 0.15,
                                weight: isHighlighted ? 3 : 1
                            }}
                        />
                        <CircleMarker
                            center={[geo.latitude, geo.longitude]}
                            radius={isHighlighted ? 8 : 4}
                            pathOptions={{
                                color: '#fff',
                                fillColor: isHighlighted ? activeColor : staticColor,
                                fillOpacity: 1,
                                weight: 2
                            }}
                        >
                            <Popup>
                                <div style={{ color: '#333', fontWeight: 'bold' }}>
                                    {geo.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {isHighlighted ? 'Active Route Site' : 'Inventory Site'}
                                </div>
                            </Popup>
                        </CircleMarker>
                    </React.Fragment>
                );
            })}

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
                                color: isPlanned ? '#818cf8' : '#4ade80',
                                fillColor: isPlanned ? '#818cf8' : '#4ade80',
                                fillOpacity: 0.3,
                                weight: 2
                            }}
                        />
                        <CircleMarker
                            center={[latitude, longitude]}
                            radius={5}
                            pathOptions={{
                                color: 'white',
                                fillColor: isPlanned ? '#818cf8' : '#4ade80',
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
