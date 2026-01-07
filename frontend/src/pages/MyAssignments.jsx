import React, { useEffect, useState } from 'react';
import { routeAssignmentsApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';

const statusColors = {
    PLANNED: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
    COMPLETED: { bg: 'rgba(74, 222, 128, 0.2)', color: '#4ade80' },
    MISSED: { bg: 'rgba(248, 113, 113, 0.2)', color: '#f87171' },
    CANCELLED: { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' }
};

const MyAssignments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            navigate('/dashboard');
            return;
        }
        fetchAssignments();

        // Watch user location
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

    const handleCheckIn = async (assignmentId) => {
        if (!userLocation) {
            alert('Unable to get your location. Please enable location services.');
            return;
        }

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
        return date.toLocaleString();
    };

    const isWithinWindow = (assignment) => {
        const now = new Date();
        const scheduled = new Date(assignment.scheduledTime);
        const bufferMs = assignment.bufferMinutes * 60 * 1000;
        const windowStart = new Date(scheduled.getTime() - bufferMs);
        const windowEnd = new Date(scheduled.getTime() + bufferMs);
        return now >= windowStart && now <= windowEnd;
    };

    const plannedAssignments = assignments.filter(a => a.status === 'PLANNED');
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');
    const otherAssignments = assignments.filter(a => ['MISSED', 'CANCELLED'].includes(a.status));

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#1e1e2f', color: '#fff', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <Link to="/dashboard" style={{ color: '#aaa' }}><ArrowLeft /></Link>
                    <h1 style={{ margin: 0 }}>My Site Visits</h1>
                </header>

                {userLocation && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '10px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9em', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Navigation size={16} />
                        Location active: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Loading your assignments...</div>
                ) : assignments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#555', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '10px' }}>
                        No site visits assigned to you.
                    </div>
                ) : (
                    <>
                        {/* Pending Assignments */}
                        {plannedAssignments.length > 0 && (
                            <div style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: '#fbbf24', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={18} /> Upcoming Visits ({plannedAssignments.length})
                                </h3>
                                {plannedAssignments.map(assignment => (
                                    <div key={assignment.id} style={{
                                        background: 'rgba(30,30,40,0.8)',
                                        border: '1px solid #444',
                                        padding: '18px',
                                        borderRadius: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <MapPin size={18} style={{ color: '#f472b6' }} />
                                            <span style={{ fontWeight: 600, fontSize: '1.1em' }}>{assignment.geofence?.name}</span>
                                        </div>

                                        <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} />
                                                {formatDateTime(assignment.scheduledTime)}
                                            </div>
                                            <div style={{ marginTop: '4px' }}>Buffer: ±{assignment.bufferMinutes} minutes</div>
                                        </div>

                                        {isWithinWindow(assignment) ? (
                                            <button
                                                onClick={() => handleCheckIn(assignment.id)}
                                                disabled={checkingIn === assignment.id}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '1em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {checkingIn === assignment.id ? 'Checking in...' : (
                                                    <><CheckCircle size={18} /> Check In Now</>
                                                )}
                                            </button>
                                        ) : (
                                            <div style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                background: 'rgba(251, 191, 36, 0.1)',
                                                color: '#fbbf24',
                                                textAlign: 'center',
                                                fontSize: '0.9em'
                                            }}>
                                                Check-in available within the scheduled time window
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Completed */}
                        {completedAssignments.length > 0 && (
                            <div style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: '#4ade80', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle size={18} /> Completed ({completedAssignments.length})
                                </h3>
                                {completedAssignments.map(assignment => (
                                    <div key={assignment.id} style={{
                                        background: 'rgba(74, 222, 128, 0.05)',
                                        border: '1px solid rgba(74, 222, 128, 0.3)',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ fontWeight: 600 }}>{assignment.geofence?.name}</div>
                                        <div style={{ color: '#4ade80', fontSize: '0.85em', marginTop: '5px' }}>
                                            ✓ Completed at {formatDateTime(assignment.actualEntryTime)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Missed/Cancelled */}
                        {otherAssignments.length > 0 && (
                            <div>
                                <h3 style={{ color: '#9ca3af', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={18} /> Past Visits ({otherAssignments.length})
                                </h3>
                                {otherAssignments.map(assignment => (
                                    <div key={assignment.id} style={{
                                        background: 'rgba(156, 163, 175, 0.05)',
                                        border: '1px solid rgba(156, 163, 175, 0.2)',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{assignment.geofence?.name}</span>
                                            <span style={{
                                                fontSize: '0.8em',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: statusColors[assignment.status]?.bg,
                                                color: statusColors[assignment.status]?.color
                                            }}>
                                                {assignment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyAssignments;
