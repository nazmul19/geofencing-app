import React, { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import {
    MoreHorizontal, User as UserIcon, Navigation,
    Layers, Plus, LayoutGrid, BarChart3, FileText, Bell, Settings, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { geofencesApi, routeAssignmentsApi, usersApi } from '../services/orgApi';
import { searchAddress } from '../utils/geoUtils';
import DashboardLayout from '../components/DashboardLayout';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();

    // Data states
    const [assignments, setAssignments] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [orgUsers, setOrgUsers] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [geofenceRadius, setGeofenceRadius] = useState(100);
    const [geofenceCenter, setGeofenceCenter] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [mapSearchResults, setMapSearchResults] = useState([]);
    const [showMapSearchResults, setShowMapSearchResults] = useState(false);

    // UI states
    const [centerMapTrigger, setCenterMapTrigger] = useState(null);

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
        if (user?.organization?.id) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const orgId = user.organization.id;
            const [assignRes, geoRes, userRes] = await Promise.all([
                routeAssignmentsApi.getByOrganization(orgId),
                geofencesApi.getByOrganization(orgId),
                usersApi.getByOrganization(orgId)
            ]);
            setAssignments(assignRes.data);
            setGeofences(geoRes.data);
            setOrgUsers(userRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    const handleMapSearch = async (e) => {
        e?.preventDefault();
        if (!mapSearchQuery.trim()) return;
        const results = await searchAddress(mapSearchQuery);
        setMapSearchResults(results);
        setShowMapSearchResults(true);
    };

    const handleMapSearchSelect = (result) => {
        const location = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setGeofenceCenter(location);
        setShowMapSearchResults(false);
        setMapSearchQuery(result.display_name.split(',')[0]);
    };

    const filteredGeofences = geofences.filter(gf =>
        gf.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAssignments = assignments.filter(a =>
        a.geofence?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Geofencing"
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
        >
            {/* Left Panels */}
            <div className="side-panels">
                <section className="glass-panel">
                    <div className="panel-header">
                        <h3>Active Routes</h3>
                        <MoreHorizontal size={18} className="more-btn" />
                    </div>
                    <div className="panel-list">
                        {filteredAssignments.length > 0 ? filteredAssignments.slice(0, 3).map((item) => (
                            <div
                                key={item.id}
                                className="list-item"
                                onClick={() => {
                                    if (item.geofence) {
                                        setGeofenceCenter({ lat: item.geofence.latitude, lng: item.geofence.longitude });
                                    }
                                }}
                            >
                                <div className="route-indicator" style={{ background: item.status === 'COMPLETED' ? '#4ade80' : '#818cf8' }}></div>
                                <div className="item-content">
                                    <div className="item-title">Active Site Visit</div>
                                    <div className="item-subtitle">{item.geofence?.name || 'Loading...'}</div>
                                </div>
                                {item.status === 'PLANNED' && <span className="badge badge-purple">New</span>}
                            </div>
                        )) : (
                            <div style={{ color: '#71717a', fontSize: '0.8rem', textAlign: 'center', padding: '10px' }}>No matches found</div>
                        )}
                    </div>
                </section>

                <section className="glass-panel">
                    <div className="panel-header">
                        <h3>Geofence Zones</h3>
                        <MoreHorizontal size={18} className="more-btn" />
                    </div>
                    <div className="panel-list">
                        {filteredGeofences.slice(0, 3).map((geo) => (
                            <div
                                key={geo.id}
                                className="list-item"
                                onClick={() => setGeofenceCenter({ lat: geo.latitude, lng: geo.longitude })}
                            >
                                <div className="item-content">
                                    <div className="item-title">{geo.name}</div>
                                    <div className="item-subtitle">Radius: {geo.radius}m</div>
                                </div>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{geo.status || 'Active'}</span>
                            </div>
                        ))}
                        {filteredGeofences.length === 0 && (
                            <div style={{ color: '#71717a', fontSize: '0.8rem', textAlign: 'center', padding: '10px' }}>No matches found</div>
                        )}
                    </div>
                </section>

                <section className="glass-panel">
                    <div className="panel-header">
                        <h3>User Tracking</h3>
                        <MoreHorizontal size={18} className="more-btn" />
                    </div>
                    <div className="panel-list">
                        {orgUsers.slice(0, 3).map((u) => (
                            <div key={u.id} className="list-item">
                                <UserIcon size={20} style={{ color: '#818cf8' }} />
                                <div className="item-content">
                                    <div className="item-title">{u.email.split('@')[0]}</div>
                                    <div className="item-subtitle">{u.role}</div>
                                </div>
                                <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : 'badge-purple'}`}>
                                    {u.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Map Area */}
            <div className="map-canvas" style={{ position: 'relative' }}>
                {/* Map Search Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    width: '320px'
                }}>
                    <div className="search-bar-wrapper" style={{ background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', borderRadius: '14px' }}>
                        <Search size={18} className="search-icon" style={{ color: '#fbbf24' }} />
                        <input
                            type="text"
                            placeholder="Search map location..."
                            value={mapSearchQuery}
                            onChange={(e) => setMapSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '10px' }}
                        />
                    </div>
                    {showMapSearchResults && mapSearchResults.length > 0 && (
                        <div style={{
                            background: 'rgba(15, 15, 20, 0.95)',
                            borderRadius: '14px',
                            marginTop: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                            {mapSearchResults.map(r => (
                                <div
                                    key={r.place_id}
                                    onClick={() => handleMapSearchSelect(r)}
                                    style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '0.85rem', color: '#ccc' }}
                                >
                                    {r.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="map-zoom-slider">
                    <Plus size={16} />
                    <input
                        type="range"
                        orient="vertical"
                        min="50" max="1000"
                        value={geofenceRadius}
                        onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                    />
                    <MoreHorizontal size={16} />
                </div>

                <div className="map-toolbar">
                    <div className="toolbar-btn"><Navigation size={18} /></div>
                    <div className="toolbar-btn"><Layers size={18} /></div>
                </div>

                <MapComponent
                    userLocation={userLocation}
                    geofenceCenter={geofenceCenter}
                    geofenceRadius={geofenceRadius}
                    onMapClick={setGeofenceCenter}
                    centerMapTrigger={centerMapTrigger}
                    assignedSites={assignments}
                    allGeofences={geofences}
                />

                <div className="zoom-controls">
                    <div className="toolbar-btn" onClick={() => userLocation && setCenterMapTrigger(Date.now())}><Navigation size={20} /></div>
                    <div className="toolbar-btn"><Plus size={20} /></div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
