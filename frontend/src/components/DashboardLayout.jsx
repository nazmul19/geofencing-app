import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Search, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../pages/Dashboard.css';

const DashboardLayout = ({ children, title = "Geofencing", searchQuery = "", onSearchChange }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        if (user?.id) {
            import('../services/orgApi').then(({ notificationsApi }) => {
                notificationsApi.getByUser(user.id).then(res => {
                    const unread = res.data.filter(n => !n.isRead).length;
                    setUnreadCount(unread);
                });
            });
        }
    }, [user]);

    return (
        <div className="dashboard-root">
            <Sidebar />

            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1 className="page-title">{title}</h1>
                    <div className="header-actions">
                        <div className="search-bar-wrapper">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="icon-button" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer', position: 'relative' }}>
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <div className="notification-badge" style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    background: '#ef4444',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid #0f0f14'
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}
                        </div>
                        <div className="user-profile">
                            <span>{user?.email.split('@')[0]}</span>
                            <UserIcon size={24} className="user-avatar" />
                        </div>
                    </div>
                </header>

                <div className="dashboard-main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 24px 24px 24px' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
