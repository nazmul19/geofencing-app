import React, { useEffect, useState } from 'react';
import { geofencesApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, Search, Navigation, Layers } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, CircleMarker, Popup } from 'react-leaflet';
import { searchAddress } from '../utils/geoUtils';
import DashboardLayout from '../components/DashboardLayout';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fly to searched location
const FlyToLocation = ({ location }) => {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo([location.lat, location.lng], 15, { animate: true });
        }
    }, [location, map]);
    return null;
};

const LocationPicker = ({ onSelect, selectedLocation }) => {
    useMapEvents({
        click(e) {
            onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return selectedLocation ? (
        <>
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
            <Circle
                center={[selectedLocation.lat, selectedLocation.lng]}
                radius={100}
                pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.2, dashArray: '5,5' }}
            />
        </>
    ) : null;
};

const ManageGeofences = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', latitude: null, longitude: null, radius: 100 });
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Search state
    const [globalSearch, setGlobalSearch] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [mapSearchResults, setMapSearchResults] = useState([]);
    const [isMapSearching, setIsMapSearching] = useState(false);
    const [showMapSearchResults, setShowMapSearchResults] = useState(false);
    const [flyToTarget, setFlyToTarget] = useState(null);

    useEffect(() => {
        if (!user?.organization?.id) {
            navigate('/dashboard');
            return;
        }
        fetchGeofences();
    }, [user, navigate]);

    const fetchGeofences = async () => {
        try {
            setLoading(true);
            const res = await geofencesApi.getByOrganization(user.organization.id);
            setGeofences(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng
        }));
    };

    const handleMapSearch = async (e) => {
        e?.preventDefault();
        if (!mapSearchQuery.trim()) return;

        setIsMapSearching(true);
        const results = await searchAddress(mapSearchQuery);
        setMapSearchResults(results);
        setIsMapSearching(false);
        setShowMapSearchResults(true);
    };

    const handleMapSearchSelect = (result) => {
        const location = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setFlyToTarget(location);
        setShowMapSearchResults(false);
        setMapSearchQuery(result.display_name.split(',')[0]);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) {
            alert('Please select a location on the map');
            return;
        }
        try {
            await geofencesApi.create({
                ...formData,
                organizationId: user.organization.id
            });
            setShowForm(false);
            setFormData({ name: '', latitude: null, longitude: null, radius: 100 });
            setSelectedLocation(null);
            fetchGeofences();
        } catch (error) {
            alert('Failed to create geofence');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await geofencesApi.delete(id);
            fetchGeofences();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const filteredGeofences = geofences.filter(gf =>
        gf.name.toLowerCase().includes(globalSearch.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Geofencing"
            searchQuery={globalSearch}
            onSearchChange={(e) => setGlobalSearch(e.target.value)}
        >
            <div className="side-panels" style={{ width: '380px' }}>
                <section className="glass-panel" style={{ height: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ marginBottom: '16px' }}>
                        <h3>{showForm ? 'New Geofence' : 'Geofence Zones'}</h3>
                        <div className="toolbar-btn" onClick={() => setShowForm(!showForm)}>
                            <Plus size={18} />
                        </div>
                    </div>

                    {showForm ? (
                        <form onSubmit={handleCreate} className="panel-list" style={{ gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Geofence Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px' }}
                            />

                            <div style={{ color: '#71717a', fontSize: '0.8rem' }}>
                                Radius: {formData.radius}m
                                <input type="range" min="50" max="1000" step="50" value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })} style={{ width: '100%', accentColor: '#fbbf24', marginTop: '8px' }} />
                            </div>

                            <div style={{ background: 'rgba(251, 191, 36, 0.05)', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', color: '#fbbf24', border: '1px dashed rgba(251, 191, 36, 0.2)' }}>
                                {selectedLocation ? `Location: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 'Click on map to select location'}
                            </div>

                            <button type="submit" className="action-button primary" style={{ background: '#fbbf24', color: '#000' }}>Create Geofence</button>
                            <button type="button" onClick={() => setShowForm(false)} className="action-button" style={{ color: '#71717a' }}>Cancel</button>
                        </form>
                    ) : (
                        <div className="panel-list" style={{ overflowY: 'auto' }}>
                            {filteredGeofences.length > 0 ? filteredGeofences.map(gf => (
                                <div
                                    key={gf.id}
                                    className="list-item"
                                    onClick={() => setFlyToTarget({ lat: gf.latitude, lng: gf.longitude })}
                                    style={{ padding: '16px' }}
                                >
                                    <div className="item-content">
                                        <div className="item-title" style={{ fontWeight: 600 }}>{gf.name}</div>
                                        <div className="item-subtitle">Radius: {gf.radius}m</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className="badge badge-green" style={{ fontSize: '0.6rem' }}>Active</span>
                                        <Trash2
                                            size={16}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(gf.id);
                                            }}
                                            style={{ color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '0.9rem' }}>
                                    No geofences found
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <div className="map-canvas" style={{ position: 'relative' }}>
                {/* Map Search Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    width: '300px'
                }}>
                    <div className="search-bar-wrapper" style={{ background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find location..."
                            value={mapSearchQuery}
                            onChange={(e) => setMapSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '8px' }}
                        />
                    </div>
                    {showMapSearchResults && mapSearchResults.length > 0 && (
                        <div style={{
                            background: 'rgba(15, 15, 20, 0.95)',
                            borderRadius: '12px',
                            marginTop: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {mapSearchResults.map(r => (
                                <div
                                    key={r.place_id}
                                    onClick={() => handleMapSearchSelect(r)}
                                    style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '0.8rem', color: '#ccc' }}
                                >
                                    {r.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="map-toolbar">
                    <div className="toolbar-btn"><Navigation size={18} /></div>
                    <div className="toolbar-btn"><Layers size={18} /></div>
                </div>

                <MapContainer
                    center={[19.076, 72.877]}
                    zoom={12}
                    style={{ height: '100%', width: '100%', borderRadius: '24px' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='Tiles &copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <LocationPicker onSelect={handleLocationSelect} selectedLocation={selectedLocation} />
                    <FlyToLocation location={flyToTarget} />

                    {geofences.map(gf => (
                        <React.Fragment key={gf.id}>
                            <Circle
                                center={[gf.latitude, gf.longitude]}
                                radius={gf.radius}
                                pathOptions={{
                                    color: gf.id === flyToTarget?.id ? '#fbbf24' : '#10b981',
                                    fillColor: gf.id === flyToTarget?.id ? '#fbbf24' : '#10b981',
                                    fillOpacity: 0.15,
                                    weight: 2
                                }}
                            />
                            <CircleMarker
                                center={[gf.latitude, gf.longitude]}
                                radius={5}
                                pathOptions={{ color: '#fff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }}
                            >
                                <Popup>
                                    <div style={{ color: '#000', fontWeight: 'bold' }}>{gf.name}</div>
                                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Radius: {gf.radius}m</div>
                                </Popup>
                            </CircleMarker>
                        </React.Fragment>
                    ))}
                </MapContainer>

                <div className="zoom-controls">
                    <div className="toolbar-btn"><Navigation size={20} /></div>
                    <div className="toolbar-btn"><Plus size={20} /></div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageGeofences;
