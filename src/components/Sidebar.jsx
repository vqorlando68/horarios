'use client';
import './Sidebar.css';

export default function Sidebar({ activeSection, onNavigate, usuario, onLogout, t }) {
    const initials = usuario ? usuario.substring(0, 2).toUpperCase() : 'U';

    const navItems = [
        { id: 'horarios', label: t ? t('schedules') : 'Horarios', icon: '📅' },
        { id: 'editar', label: 'Editar', icon: '⚙️' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">📅</div>
                <span className="sidebar-logo-text">{t ? t('schedules') : 'Horarios'}</span>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">{t ? t('view') : 'Menú'}</div>
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-username">{usuario}</div>
                        <div className="sidebar-user-role">Usuario del Sistema</div>
                    </div>
                    <button
                        className="sidebar-logout-btn"
                        onClick={onLogout}
                        title="Cerrar sesión"
                    >
                        ⏻
                    </button>
                </div>
            </div>
        </aside>
    );
}
