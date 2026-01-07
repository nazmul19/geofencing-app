import React, { useEffect, useState } from 'react';
import { routesApi, geofencesApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MapPin } from 'lucide-react';

const ManageRoutes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', geofenceIds: [], status: 'PLANNED' });

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

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this route?')) return;
        try {
            await routesApi.delete(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete route');
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

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#1e1e2f', color: '#fff', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <Link to="/dashboard" style={{ color: '#aaa' }}><ArrowLeft /></Link>
                    <h1 style={{ margin: 0 }}>Manage Routes</h1>
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
                    <Plus size={18} /> Add Route
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
                            placeholder="Route Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                        />

                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '8px', display: 'block' }}>Select Geofences:</label>
                            {geofences.length === 0 ? (
                                <div style={{ color: '#666' }}>No geofences available. Create geofences first.</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {geofences.map(gf => (
                                        <button
                                            type="button"
                                            key={gf.id}
                                            onClick={() => toggleGeofence(gf.id)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '20px',
                                                border: formData.geofenceIds.includes(gf.id) ? '2px solid #3b82f6' : '1px solid #444',
                                                background: formData.geofenceIds.includes(gf.id) ? 'rgba(59,130,246,0.2)' : 'transparent',
                                                color: formData.geofenceIds.includes(gf.id) ? '#60a5fa' : '#aaa',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <MapPin size={14} /> {gf.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                        >
                            <option value="PLANNED">Planned</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <button type="submit" style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                            Create Route
                        </button>
                    </form>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Loading routes...</div>
                ) : routes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#555', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '10px' }}>
                        No routes found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {routes.map(route => (
                            <div key={route.id} style={{
                                background: 'rgba(30,30,40,0.8)',
                                border: '1px solid #444',
                                padding: '15px 20px',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{route.name}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.85em' }}>
                                        Status: <span style={{
                                            color: route.status === 'ACTIVE' ? '#4ade80' : route.status === 'COMPLETED' ? '#60a5fa' : '#fbbf24'
                                        }}>{route.status}</span>
                                    </div>
                                    <div style={{ color: '#666', fontSize: '0.8em', marginTop: '5px' }}>
                                        {route.geofences?.length || 0} geofence(s)
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(route.id)}
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

export default ManageRoutes;
