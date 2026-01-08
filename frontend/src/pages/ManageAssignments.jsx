import React, { useEffect, useState } from 'react';
import { routeAssignmentsApi, usersApi, geofencesApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, Clock, User, CheckCircle, XCircle, AlertTriangle, X, Layers, Navigation } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MapComponent from '../components/MapComponent';

const statusColors = {
    PLANNED: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', icon: Clock },
    COMPLETED: { bg: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', icon: CheckCircle },
    MISSED: { bg: 'rgba(248, 113, 113, 0.2)', color: '#f87171', icon: AlertTriangle },
    CANCELLED: { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', icon: XCircle }
};

const ManageAssignments = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Map states
    const [geofenceCenter, setGeofenceCenter] = useState(null);
    const [centerMapTrigger, setCenterMapTrigger] = useState(null);
    const [userLoc, setUserLoc] = useState(null);

    const [formData, setFormData] = useState({
        assignedToId: '',
        reportsToId: '',
        geofenceId: '',
        scheduledTime: '',
        bufferMinutes: 10
    });

    useEffect(() => {
        if (!currentUser?.organization?.id) {
            navigate('/dashboard');
            return;
        }
        fetchData();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, [currentUser, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, usersRes, geofencesRes] = await Promise.all([
                routeAssignmentsApi.getByOrganization(currentUser.organization.id),
                usersApi.getByOrganization(currentUser.organization.id),
                geofencesApi.getByOrganization(currentUser.organization.id)
            ]);
            setAssignments(assignmentsRes.data);
            setUsers(usersRes.data);
            setGeofences(geofencesRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await routeAssignmentsApi.create({
                ...formData,
                reportsToId: formData.reportsToId || currentUser.id,
                organizationId: currentUser.organization.id
            });
            setShowForm(false);
            setFormData({
                assignedToId: '',
                reportsToId: '',
                geofenceId: '',
                scheduledTime: '',
                bufferMinutes: 10
            });
            fetchData();
        } catch (error) {
            alert('Failed to create assignment');
        }
    };

    const handleCancel = async (e, id) => {
        e.stopPropagation();
        const reason = prompt('Cancellation reason:');
        try {
            await routeAssignmentsApi.cancel(id, currentUser.id, reason);
            fetchData();
        } catch (error) {
            alert('Failed to cancel');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            await routeAssignmentsApi.delete(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    };

    const handleItemClick = (item) => {
        if (item.geofence) {
            setGeofenceCenter({ lat: item.geofence.latitude, lng: item.geofence.longitude });
        }
    };

    const filteredAssignments = assignments.filter(a =>
        a.geofence?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assignedTo?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Site Assignments"
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
        >
            <div className="side-panels" style={{ width: '400px' }}>
                <section className="glass-panel" style={{ height: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ marginBottom: '16px' }}>
                        <h3>{showForm ? 'Assign Site' : 'Site Visits'}</h3>
                        <div className="toolbar-btn" onClick={() => setShowForm(!showForm)}>
                            <Plus size={18} />
                        </div>
                    </div>

                    {showForm ? (
                        <form onSubmit={handleCreate} className="panel-list">
                            <select
                                value={formData.assignedToId}
                                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%' }}
                            >
                                <option value="">Assign To...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.email}</option>
                                ))}
                            </select>

                            <select
                                value={formData.geofenceId}
                                onChange={(e) => {
                                    setFormData({ ...formData, geofenceId: e.target.value });
                                    const selectedGeo = geofences.find(g => g.id === e.target.value);
                                    if (selectedGeo) setGeofenceCenter({ lat: selectedGeo.latitude, lng: selectedGeo.longitude });
                                }}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%', marginTop: '8px' }}
                            >
                                <option value="">Select Site (Geofence)</option>
                                {geofences.map(gf => (
                                    <option key={gf.id} value={gf.id}>{gf.name}</option>
                                ))}
                            </select>

                            <input
                                type="datetime-local"
                                value={formData.scheduledTime}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%', marginTop: '8px' }}
                            />

                            <input
                                type="number"
                                placeholder="Buffer (min)"
                                value={formData.bufferMinutes}
                                onChange={(e) => setFormData({ ...formData, bufferMinutes: Number(e.target.value) })}
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%', marginTop: '8px' }}
                            />

                            <button type="submit" className="action-button primary" style={{ marginTop: '16px' }}>Create Assignment</button>
                            <button type="button" onClick={() => setShowForm(false)} className="action-button" style={{ marginTop: '8px' }}>Cancel</button>
                        </form>
                    ) : (
                        <div className="panel-list" style={{ overflowY: 'auto' }}>
                            {filteredAssignments.length > 0 ? filteredAssignments.map(item => (
                                <div
                                    key={item.id}
                                    className="list-item"
                                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '16px' }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                        <div className="item-title" style={{ fontWeight: 600 }}>{item.geofence?.name}</div>
                                        <span className="badge" style={{
                                            background: statusColors[item.status]?.bg,
                                            color: statusColors[item.status]?.color,
                                            fontSize: '0.65rem'
                                        }}>{item.status}</span>
                                    </div>
                                    <div className="item-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <User size={12} /> {item.assignedTo?.email.split('@')[0]}
                                    </div>
                                    <div className="item-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {formatDateTime(item.scheduledTime)}
                                    </div>
                                    <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        {item.status === 'PLANNED' && <X size={16} onClick={(e) => handleCancel(e, item.id)} style={{ cursor: 'pointer', color: '#f59e0b', opacity: 0.8 }} />}
                                        <Trash2 size={16} onClick={(e) => handleDelete(e, item.id)} style={{ cursor: 'pointer', color: '#ef4444', opacity: 0.8 }} />
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '0.9rem' }}>
                                    No assignments found
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <div className="map-canvas">
                <div className="map-toolbar">
                    <div className="toolbar-btn" onClick={() => setCenterMapTrigger(Date.now())}><Navigation size={18} /></div>
                    <div className="toolbar-btn"><Layers size={18} /></div>
                </div>

                <MapComponent
                    userLocation={userLoc}
                    geofenceCenter={geofenceCenter}
                    geofenceRadius={100}
                    onMapClick={setGeofenceCenter}
                    centerMapTrigger={centerMapTrigger}
                    assignedSites={assignments}
                    allGeofences={geofences}
                />
            </div>
        </DashboardLayout>
    );
};

export default ManageAssignments;
