import React from 'react';
import {
    LayoutDashboard, MapPin, Route, ClipboardCheck, Bell, Users, LogOut, Loader2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard' },
        { icon: MapPin, path: '/manage-geofences', label: 'Geofences' },
        { icon: ClipboardCheck, path: user?.role === 'ORG_ADMIN' ? '/manage-assignments' : '/my-assignments', label: 'Assignments' },
        { icon: Route, path: '/manage-routes', label: 'Routes' },
        { icon: Bell, path: '/notifications', label: 'Notifications' },
    ];

    if (user?.role === 'ORG_ADMIN') {
        menuItems.push({ icon: Users, path: '/manage-users', label: 'Users' });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="main-sidebar">
            <div className="sidebar-logo">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 5L35 12.5V27.5L20 35L5 27.5V12.5L20 5Z" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="20" cy="20" r="4" fill="#818cf8" />
                </svg>
            </div>
            <nav className="sidebar-menu">
                {menuItems.map((item, idx) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <div
                            key={idx}
                            className={`menu-item ${isActive ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                            title={item.label}
                        >
                            <item.icon size={22} />
                        </div>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <div className="menu-item" onClick={handleLogout} title="Logout">
                    <LogOut size={22} />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
