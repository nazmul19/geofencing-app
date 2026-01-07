import React, { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import AddressSearch from '../components/AddressSearch';
import { getDistance } from '../utils/geoUtils';
import { Locate, MapPin, Navigation, LogOut, Menu, Save, X, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { geofencesApi, routeAssignmentsApi } from '../services/orgApi';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState(null);
    const [geofenceCenter, setGeofenceCenter] = useState(null);
    const [geofenceRadius, setGeofenceRadius] = useState(100);
    const [status, setStatus] = useState('unknown');
    const [distance, setDistance] = useState(null);
    const [centerMapTrigger, setCenterMapTrigger] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Assigned sites state
    const [assignments, setAssignments] = useState([]);
    const [showAssignedSites, setShowAssignedSites] = useState(true);

    // Save geofence modal state
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [geofenceName, setGeofenceName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
            },
            (err) => console.error(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchAssignments();
        }
    }, [user]);

    const fetchAssignments = async () => {
        try {
            const res = await routeAssignmentsApi.getByUser(user.id);
            setAssignments(res.data);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        }
    };

    useEffect(() => {
        if (userLocation && geofenceCenter) {
            const dist = getDistance(userLocation.lat, userLocation.lng, geofenceCenter.lat, geofenceCenter.lng);
            setDistance(Math.round(dist));
            setStatus(dist <= geofenceRadius ? 'inside' : 'outside');
        } else {
            // Check if user is inside any assigned geofence
            const activeAssignment = assignments.find(a => {
                if (!a.geofence || a.status !== 'PLANNED') return false;
                const dist = getDistance(userLocation?.lat || 0, userLocation?.lng || 0, a.geofence.latitude, a.geofence.longitude);
                return dist <= a.geofence.radius;
            });

            if (activeAssignment) {
                const dist = getDistance(userLocation.lat, userLocation.lng, activeAssignment.geofence.latitude, activeAssignment.geofence.longitude);
                setDistance(Math.round(dist));
                setStatus('inside');
            } else {
                setStatus('unknown');
                setDistance(null);
            }
        }
    }, [userLocation, geofenceCenter, geofenceRadius, assignments]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSaveGeofence = async () => {
        if (!geofenceName.trim()) {
            alert('Please enter a name for the geofence');
            return;
        }
        if (!geofenceCenter) {
            alert('Please select a location first');
            return;
        }

        try {
            setIsSaving(true);
            await geofencesApi.create({
                name: geofenceName,
                latitude: geofenceCenter.lat,
                longitude: geofenceCenter.lng,
                radius: geofenceRadius,
                organizationId: user.organization.id
            });
            setShowSaveModal(false);
            setGeofenceName('');
            alert('Geofence saved successfully!');
        } catch (error) {
            alert('Failed to save geofence');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="app-container" style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>

            {/* Save Geofence Modal */}
            {showSaveModal && (
                <>
                    <div
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000 }}
                        onClick={() => setShowSaveModal(false)}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#1e1e2f',
                        padding: '25px',
                        borderRadius: '16px',
                        zIndex: 3001,
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>Save Geofence</h3>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '15px', color: '#aaa', fontSize: '0.9em' }}>
                            <div>Location: {geofenceCenter?.lat.toFixed(6)}, {geofenceCenter?.lng.toFixed(6)}</div>
                            <div>Radius: {geofenceRadius}m</div>
                        </div>

                        <input
                            type="text"
                            placeholder="Geofence name (e.g., Office Zone)"
                            value={geofenceName}
                            onChange={(e) => setGeofenceName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #444',
                                background: '#2a2a3a',
                                color: 'white',
                                marginBottom: '15px',
                                boxSizing: 'border-box'
                            }}
                        />

                        <button
                            onClick={handleSaveGeofence}
                            disabled={isSaving}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#10b981',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSaving ? 'Saving...' : <><Save size={18} /> Save Geofence</>}
                        </button>
                    </div>
                </>
            )}

            {/* Sidebar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '260px',
                background: '#1e1e2f',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                zIndex: 2000,
                boxShadow: '4px 0 15px rgba(0,0,0,0.5)',
                padding: '20px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h2 style={{ color: 'white', marginTop: 0 }}>Menu</h2>
                <div style={{ color: '#aaa', marginBottom: '20px' }}>
                    {user?.email}<br />
                    <small>{user?.organization?.name} ({user?.role})</small>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <button className="action-button" onClick={() => { setSidebarOpen(false); navigate('/dashboard'); }}>Map View</button>

                    <button
                        className="action-button"
                        style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa' }}
                        onClick={() => { setSidebarOpen(false); navigate('/my-assignments'); }}
                    >
                        My Assignments
                    </button>

                    {user?.role === 'ORG_ADMIN' && (
                        <>
                            <div style={{ padding: '15px 0 5px 0', borderTop: '1px solid #333', marginTop: '10px', fontSize: '0.8em', color: '#666', fontWeight: 600, letterSpacing: '1px' }}>ADMINISTRATION</div>
                            <button
                                className="action-button"
                                style={{ background: 'transparent', border: '1px solid #444', color: '#ccc' }}
                                onClick={() => { setSidebarOpen(false); navigate('/manage-assignments'); }}
                            >
                                Manage Assignments
                            </button>
                            <button
                                className="action-button"
                                style={{ background: 'transparent', border: '1px solid #444', color: '#ccc' }}
                                onClick={() => { setSidebarOpen(false); navigate('/manage-geofences'); }}
                            >
                                Manage Geofences
                            </button>
                            <button
                                className="action-button"
                                style={{ background: 'transparent', border: '1px solid #444', color: '#ccc' }}
                                onClick={() => { setSidebarOpen(false); navigate('/manage-users'); }}
                            >
                                Manage Users
                            </button>
                            <button
                                className="action-button"
                                style={{ background: 'transparent', border: '1px solid #444', color: '#ccc' }}
                                onClick={() => { setSidebarOpen(false); navigate('/manage-routes'); }}
                            >
                                Manage Routes
                            </button>
                        </>
                    )}
                </nav>

                <button onClick={handleLogout} className="action-button" style={{ background: '#ef4444', color: 'white', marginTop: 'auto' }}>
                    <LogOut size={16} style={{ marginRight: '8px' }} /> Log Out
                </button>
            </div>

            {/* Overlay to close sidebar */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1999 }}
                />
            )}

            {/* Top Bar */}
            <div className="top-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
                <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
                    <Menu />
                </button>
                <span>{user?.organization?.name || 'GeoFence App'}</span>
            </div>

            <AddressSearch onLocationSelect={setGeofenceCenter} />

            <div className="map-wrapper">
                <MapComponent
                    userLocation={userLocation}
                    geofenceCenter={geofenceCenter}
                    geofenceRadius={geofenceRadius}
                    onMapClick={setGeofenceCenter}
                    centerMapTrigger={centerMapTrigger}
                    assignedSites={showAssignedSites ? assignments : []}
                />
            </div>

            <div style={{ position: 'absolute', bottom: '100px', right: '16px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1000 }}>
                <button
                    className="fab"
                    onClick={() => setShowAssignedSites(!showAssignedSites)}
                    title={showAssignedSites ? "Hide Assigned Sites" : "Show Assigned Sites"}
                    style={{ background: showAssignedSites ? '#3b82f6' : '#1e1e2f', position: 'static' }}
                >
                    <Layers size={22} color="white" />
                </button>

                <button
                    className="fab"
                    onClick={() => userLocation && setCenterMapTrigger(Date.now())}
                    title="Find Me"
                    style={{ position: 'static' }}
                >
                    <Navigation size={24} fill="currentColor" />
                </button>
            </div>

            {/* UI Overlay */}
            <div className="ui-overlay">
                <div className="status-indicator">
                    <div className={`status-dot ${status === 'inside' ? 'status-inside' : status === 'outside' ? 'status-outside' : ''}`} style={{ backgroundColor: status === 'unknown' ? '#aaa' : undefined }}></div>
                    <span>
                        {status === 'inside' ? 'Inside Assigned Site' : status === 'outside' ? 'Outside Assigned Site' : 'Select Zone'}
                    </span>
                </div>
                {distance !== null && (
                    <div className="info-row">
                        <span>Distance</span>
                        <span className="info-value">{distance} m</span>
                    </div>
                )}
                {geofenceCenter && (
                    <>
                        <div className="info-row">
                            <span>Radius</span>
                            <span className="info-value">{geofenceRadius} m</span>
                        </div>
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
                    </>
                )}

                {/* Save Geofence Button - Only for Org Admin when location is selected */}
                {user?.role === 'ORG_ADMIN' && geofenceCenter && (
                    <button
                        onClick={() => setShowSaveModal(true)}
                        style={{
                            width: '100%',
                            marginTop: '15px',
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                        }}
                    >
                        <Save size={18} /> Save as Geofence
                    </button>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
