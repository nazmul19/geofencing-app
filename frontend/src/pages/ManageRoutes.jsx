import React, { useEffect, useState } from 'react';
import { routesApi, geofencesApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, Navigation, Layers } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MapComponent from '../components/MapComponent';

const ManageRoutes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', geofenceIds: [], status: 'PLANNED' });

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Map states
    const [geofenceCenter, setGeofenceCenter] = useState(null);
    const [selectedRouteId, setSelectedRouteId] = useState(null);
    const [centerMapTrigger, setCenterMapTrigger] = useState(null);

    useEffect(() => {
        if (!user?.organization?.id) {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [routesRes, geofencesRes] = await Promise.all([
                routesApi.getByOrganization(user.organization.id),
                geofencesApi.getByOrganization(user.organization.id)
            ]);
            setRoutes(routesRes.data);
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
            await routesApi.create({
                ...formData,
                organizationId: user.organization.id
            });
            setShowForm(false);
            setFormData({ name: '', geofenceIds: [], status: 'PLANNED' });
            fetchData();
        } catch (error) {
            alert('Failed to create route');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            await routesApi.delete(id);
            if (selectedRouteId === id) setSelectedRouteId(null);
            fetchData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const toggleGeofence = (id) => {
        setFormData(prev => ({
            ...prev,
            geofenceIds: prev.geofenceIds.includes(id)
                ? prev.geofenceIds.filter(gId => gId !== id)
                : [...prev.geofenceIds, id]
        }));
    };

    const handleRouteClick = (route) => {
        setSelectedRouteId(route.id);
        if (route.geofences && route.geofences.length > 0) {
            const firstGeo = route.geofences[0];
            setGeofenceCenter({ lat: firstGeo.latitude, lng: firstGeo.longitude });
        }
    };

    const getRouteGeofences = () => {
        if (!selectedRouteId) return [];
        const route = routes.find(r => r.id === selectedRouteId);
        return route ? route.geofences || [] : [];
    };

    const filteredRoutes = routes.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Manage Routes"
            searchQuery={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
        >
            <div className="side-panels" style={{ width: '400px' }}>
                <section className="glass-panel" style={{ height: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header" style={{ marginBottom: '16px' }}>
                        <h3>{showForm ? 'New Route' : 'Operational Routes'}</h3>
                        <div className="toolbar-btn" onClick={() => {
                            setShowForm(!showForm);
                            if (!showForm) setSelectedRouteId(null);
                        }}>
                            <Plus size={18} />
                        </div>
                    </div>

                    {showForm ? (
                        <form onSubmit={handleCreate} className="panel-list">
                            <input
                                type="text"
                                placeholder="Route Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%' }}
                            />

                            <div style={{ color: '#71717a', fontSize: '0.8rem', marginTop: '12px' }}>Select Geofences:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {geofences.map(gf => (
                                    <button
                                        type="button"
                                        key={gf.id}
                                        onClick={() => toggleGeofence(gf.id)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            border: formData.geofenceIds.includes(gf.id) ? '1px solid #818cf8' : '1px solid #333',
                                            background: formData.geofenceIds.includes(gf.id) ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                                            color: formData.geofenceIds.includes(gf.id) ? '#818cf8' : '#71717a',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {gf.name}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                style={{ background: '#181926', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', width: '100%', marginTop: '16px' }}
                            >
                                <option value="PLANNED">Planned</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                            </select>

                            <button type="submit" className="action-button primary" style={{ marginTop: '20px' }}>Create Route</button>
                            <button type="button" onClick={() => setShowForm(false)} className="action-button" style={{ marginTop: '8px' }}>Cancel</button>
                        </form>
                    ) : (
                        <div className="panel-list" style={{ overflowY: 'auto' }}>
                            {filteredRoutes.length > 0 ? filteredRoutes.map(route => (
                                <div
                                    key={route.id}
                                    className={`list-item ${selectedRouteId === route.id ? 'selected' : ''}`}
                                    onClick={() => handleRouteClick(route)}
                                    style={{ border: selectedRouteId === route.id ? '1px solid rgba(129, 140, 248, 0.4)' : '1px solid transparent', padding: '16px' }}
                                >
                                    <div className="item-content">
                                        <div className="item-title" style={{ fontWeight: 600 }}>{route.name}</div>
                                        <div className="item-subtitle">{route.geofences?.length || 0} geofences • {route.status}</div>
                                    </div>
                                    <Trash2 size={16} onClick={(e) => handleDelete(e, route.id)} style={{ color: '#ef4444', cursor: 'pointer', opacity: 0.6 }} />
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '0.9rem' }}>
                                    No routes found
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
                    geofenceCenter={geofenceCenter}
                    geofenceRadius={100}
                    onMapClick={setGeofenceCenter}
                    centerMapTrigger={centerMapTrigger}
                    allGeofences={geofences}
                    highlightedGeofenceIds={selectedRouteId ? getRouteGeofences().map(g => g.id) : []}
                />
            </div>
        </DashboardLayout>
    );
};

export default ManageRoutes;
