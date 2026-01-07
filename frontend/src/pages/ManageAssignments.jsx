import React, { useEffect, useState } from 'react';
import { routeAssignmentsApi, usersApi, geofencesApi } from '../services/orgApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MapPin, Clock, User, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const statusColors = {
    PLANNED: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', icon: Clock },
    COMPLETED: { bg: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', icon: CheckCircle },
    MISSED: { bg: 'rgba(248, 113, 113, 0.2)', color: '#f87171', icon: AlertTriangle },
    CANCELLED: { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', icon: XCircle }
};

const ManageAssignments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        assignedToId: '',
        reportsToId: '',
        geofenceId: '',
        scheduledTime: '',
        bufferMinutes: 10
    });

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
            const [assignmentsRes, usersRes, geofencesRes] = await Promise.all([
                routeAssignmentsApi.getByOrganization(user.organization.id),
                usersApi.getByOrganization(user.organization.id),
                geofencesApi.getByOrganization(user.organization.id)
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
        if (!formData.assignedToId || !formData.geofenceId || !formData.scheduledTime) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            await routeAssignmentsApi.create({
                ...formData,
                reportsToId: formData.reportsToId || user.id,
                organizationId: user.organization.id
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

    const handleCancel = async (id) => {
        const reason = prompt('Enter cancellation reason (optional):');
        try {
            await routeAssignmentsApi.cancel(id, user.id, reason);
            fetchData();
        } catch (error) {
            alert('Failed to cancel assignment');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            await routeAssignmentsApi.delete(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete assignment');
        }
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#1e1e2f', color: '#fff', padding: '20px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <Link to="/dashboard" style={{ color: '#aaa' }}><ArrowLeft /></Link>
                    <h1 style={{ margin: 0 }}>Site Assignments</h1>
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
                    <Plus size={18} /> Assign Site
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '6px' }}>
                                    Assign To *
                                </label>
                                <select
                                    value={formData.assignedToId}
                                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                                >
                                    <option value="">Select User</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '6px' }}>
                                    Reports To (Manager)
                                </label>
                                <select
                                    value={formData.reportsToId}
                                    onChange={(e) => setFormData({ ...formData, reportsToId: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                                >
                                    <option value="">Default (You)</option>
                                    {users.filter(u => u.role === 'ORG_ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '6px' }}>
                                Geofenced Site *
                            </label>
                            <select
                                value={formData.geofenceId}
                                onChange={(e) => setFormData({ ...formData, geofenceId: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white' }}
                            >
                                <option value="">Select Geofence</option>
                                {geofences.map(gf => (
                                    <option key={gf.id} value={gf.id}>{gf.name} (Radius: {gf.radius}m)</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '6px' }}>
                                    Scheduled Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '6px' }}>
                                    Buffer (±minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={formData.bufferMinutes}
                                    onChange={(e) => setFormData({ ...formData, bufferMinutes: Number(e.target.value) })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2a2a3a', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <button type="submit" style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                            Create Assignment
                        </button>
                    </form>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Loading assignments...</div>
                ) : assignments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#555', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '10px' }}>
                        No site assignments found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {assignments.map(assignment => {
                            const StatusIcon = statusColors[assignment.status]?.icon || Clock;
                            return (
                                <div key={assignment.id} style={{
                                    background: 'rgba(30,30,40,0.8)',
                                    border: '1px solid #444',
                                    padding: '18px',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8em',
                                                    fontWeight: 600,
                                                    background: statusColors[assignment.status]?.bg,
                                                    color: statusColors[assignment.status]?.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    <StatusIcon size={14} />
                                                    {assignment.status}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <User size={16} style={{ color: '#60a5fa' }} />
                                                <span style={{ fontWeight: 600 }}>{assignment.assignedTo?.email}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <MapPin size={16} style={{ color: '#f472b6' }} />
                                                <span>{assignment.geofence?.name}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '0.9em' }}>
                                                <Clock size={14} />
                                                <span>{formatDateTime(assignment.scheduledTime)} (±{assignment.bufferMinutes}min)</span>
                                            </div>

                                            {assignment.status === 'COMPLETED' && assignment.actualEntryTime && (
                                                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', fontSize: '0.85em', color: '#4ade80' }}>
                                                    ✓ Checked in at {formatDateTime(assignment.actualEntryTime)}
                                                </div>
                                            )}

                                            {assignment.status === 'CANCELLED' && assignment.cancellationReason && (
                                                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(156, 163, 175, 0.1)', borderRadius: '8px', fontSize: '0.85em', color: '#9ca3af' }}>
                                                    Reason: {assignment.cancellationReason}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {assignment.status === 'PLANNED' && (
                                                <button
                                                    onClick={() => handleCancel(assignment.id)}
                                                    style={{ background: '#f59e0b', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}
                                                    title="Cancel"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(assignment.id)}
                                                style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAssignments;
