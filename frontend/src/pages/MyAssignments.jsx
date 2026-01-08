import React, { useEffect, useState } from 'react';
import { routeAssignmentsApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CheckCircle, AlertTriangle, Navigation, Plus, MoreHorizontal, Layers, Search } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MapComponent from '../components/MapComponent';

const MyAssignments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [geofenceCenter, setGeofenceCenter] = useState(null);
    const [centerMapTrigger, setCenterMapTrigger] = useState(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user?.id) {
            navigate('/dashboard');
            return;
        }
        fetchAssignments();

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [user, navigate]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await routeAssignmentsApi.getByUser(user.id);
            setAssignments(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = (e, assignmentId) => {
        e.stopPropagation(); // Don't trigger list item click
        if (!userLocation) {
            alert('Location services required');
            return;
        }
        confirmCheckIn(assignmentId);
    };

    const confirmCheckIn = async (assignmentId) => {
        try {
            setCheckingIn(assignmentId);
            await routeAssignmentsApi.checkIn(assignmentId, userLocation.lat, userLocation.lng);
            alert('Check-in successful!');
            fetchAssignments();
        } catch (error) {
            alert(error.response?.data?.message || 'Check-in failed');
        } finally {
            setCheckingIn(null);
        }
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    };

    const isWithinWindow = (assignment) => {
        const now = new Date();
        const scheduled = new Date(assignment.scheduledTime);
        const bufferMs = assignment.bufferMinutes * 60 * 1000;
        return now >= new Date(scheduled.getTime() - bufferMs) && now <= new Date(scheduled.getTime() + bufferMs);
    };

    const handleVisitClick = (item) => {
        if (item.geofence) {
            setGeofenceCenter({ lat: item.geofence.latitude, lng: item.geofence.longitude });
        }
    };

    const filteredAssignments = assignments.filter(a =>
        a.geofence?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="My Visits"
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
        >
            <div className="side-panels" style={{ width: '400px' }}>
                <section className="glass-panel" style={{ height: 'auto', maxHeight: '50%', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ marginBottom: '16px' }}>
                        <h3>Upcoming Visits</h3>
                    </div>

                    <div className="panel-list" style={{ overflowY: 'auto' }}>
                        {filteredAssignments.filter(a => a.status === 'PLANNED').map(item => (
                            <div
                                key={item.id}
                                className="list-item"
                                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '16px' }}
                                onClick={() => handleVisitClick(item)}
                            >
                                <div className="item-title" style={{ fontWeight: 600 }}>{item.geofence?.name}</div>
                                <div className="item-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={12} /> {formatDateTime(item.scheduledTime)}
                                </div>
                                {isWithinWindow(item) ? (
                                    <button
                                        onClick={(e) => handleCheckIn(e, item.id)}
                                        disabled={checkingIn === item.id}
                                        className="action-button primary"
                                        style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px', width: 'auto', marginTop: '4px' }}
                                    >
                                        {checkingIn === item.id ? 'Verifying...' : 'Check In Now'}
                                    </button>
                                ) : (
                                    <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                        Check-in logic active within {item.bufferMinutes}m
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredAssignments.filter(a => a.status === 'PLANNED').length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#71717a', fontSize: '0.8rem' }}>No upcoming visits</div>
                        )}
                    </div>
                </section>

                <section className="glass-panel" style={{ height: 'auto', flex: 1, display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
                    <div className="panel-header" style={{ marginBottom: '16px' }}>
                        <h3>Past Visits</h3>
                    </div>
                    <div className="panel-list" style={{ overflowY: 'auto' }}>
                        {filteredAssignments.filter(a => a.status !== 'PLANNED').map(item => (
                            <div
                                key={item.id}
                                className="list-item"
                                onClick={() => handleVisitClick(item)}
                                style={{ padding: '16px' }}
                            >
                                <div className="item-content">
                                    <div className="item-title" style={{ fontWeight: 600 }}>{item.geofence?.name}</div>
                                    <div className="item-subtitle">{item.status} at {formatDateTime(item.actualEntryTime || item.scheduledTime)}</div>
                                </div>
                                <CheckCircle size={18} style={{ color: item.status === 'COMPLETED' ? '#4ade80' : '#71717a', opacity: 0.8 }} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="map-canvas">
                <div className="map-toolbar">
                    <div className="toolbar-btn" onClick={() => userLocation && setCenterMapTrigger(Date.now())}><Navigation size={18} /></div>
                    <div className="toolbar-btn"><Layers size={18} /></div>
                </div>

                <MapComponent
                    userLocation={userLocation}
                    geofenceCenter={geofenceCenter}
                    geofenceRadius={100}
                    onMapClick={setGeofenceCenter}
                    centerMapTrigger={centerMapTrigger}
                    assignedSites={assignments}
                />
            </div>
        </DashboardLayout>
    );
};

export default MyAssignments;
