import React, { useEffect, useState } from 'react';
import { geofencesApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import { searchAddress } from '../utils/geoUtils';
import 'leaflet/dist/leaflet.css';

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
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const results = await searchAddress(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowSearchResults(true);
    };

    const handleSearchSelect = (result) => {
        const location = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setSelectedLocation(location);
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            name: prev.name || result.display_name.split(',')[0] // Auto-fill name with first part
        }));
        setFlyToTarget(location);
        setShowSearchResults(false);
        setSearchQuery('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) {
            alert('Please select a location on the map or search for an address');
            return;
        }
        try {
            await geofencesApi.create({
                name: formData.name,
                latitude: formData.latitude,
                longitude: formData.longitude,
                radius: formData.radius,
                organizationId: user.organization.id
            });
            setShowForm(false);
            setFormData({ name: '', latitude: null, longitude: null, radius: 100 });
            setSelectedLocation(null);
            setFlyToTarget(null);
            fetchGeofences();
        } catch (error) {
            alert('Failed to create geofence');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this geofence?')) return;
        try {
            await geofencesApi.delete(id);
            fetchGeofences();
        } catch (error) {
            alert('Failed to delete geofence');
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#1e1e2f', color: '#fff', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <Link to="/dashboard" style={{ color: '#aaa' }}><ArrowLeft /></Link>
                    <h1 style={{ margin: 0 }}>Manage Geofences</h1>
                </header>

                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        fontWeight: 600
                    }}
                >
                    <Plus size={18} /> Add Geofence
                </button>

                {showForm && (
                    <form onSubmit={handleCreate} style={{
                        background: 'rgba(30,30,40,0.8)',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                    }}>
                        <input
                            type="text"
                            placeholder="Geofence Name (e.g., Warehouse Zone A)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                        />

                        {/* Address Search */}
                        <div style={{ position: 'relative' }}>
                            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '8px', display: 'block' }}>
                                Search for a location:
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Search address, city, or landmark..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}
                                >
                                    {isSearching ? <span className="loader"></span> : <Search size={18} />}
                                </button>
                            </div>

                            {showSearchResults && searchResults.length > 0 && (
                                <ul style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(30,30,40,0.98)',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: '8px 0 0 0',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    zIndex: 100
                                }}>
                                    {searchResults.map((result) => (
                                        <li
                                            key={result.place_id}
                                            onClick={() => handleSearchSelect(result)}
                                            style={{
                                                padding: '12px 15px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #333',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                color: '#ccc'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <MapPin size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.9em' }}>{result.display_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '8px', display: 'block' }}>
                                Or click on the map to select location:
                            </label>
                            <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #444' }}>
                                <MapContainer
                                    center={[51.505, -0.09]}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationPicker onSelect={handleLocationSelect} selectedLocation={selectedLocation} />
                                    <FlyToLocation location={flyToTarget} />
                                </MapContainer>
                            </div>
                            {selectedLocation && (
                                <div style={{ marginTop: '10px', color: '#4ade80', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={14} />
                                    Location selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '8px', display: 'block' }}>
                                Radius: {formData.radius} meters
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="1000"
                                step="50"
                                value={formData.radius}
                                onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                                style={{ width: '100%', accentColor: '#3b82f6' }}
                            />
                        </div>

                        <button type="submit" style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                            Create Geofence
                        </button>
                    </form>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Loading geofences...</div>
                ) : geofences.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#555', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '10px' }}>
                        No geofences found. Create your first geofence above!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {geofences.map(gf => (
                            <div key={gf.id} style={{
                                background: 'rgba(30,30,40,0.8)',
                                border: '1px solid #444',
                                padding: '15px 20px',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={16} style={{ color: '#3b82f6' }} />
                                        {gf.name}
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '0.85em', marginTop: '4px' }}>
                                        {gf.latitude}, {gf.longitude} • Radius: {gf.radius}m
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(gf.id)}
                                    style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageGeofences;
