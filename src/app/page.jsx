'use client';
import { useState } from 'react';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import CalendarLayout from '@/components/CalendarLayout';
import ScheduleEditorLayout from '@/components/ScheduleEditorLayout';
import { useCalendarioContext } from '@/context/CalendarioContext';

function AppContent({ onLogout, usuario }) {
    const [activeSection, setActiveSection] = useState('horarios');
    const { resetToToday, t } = useCalendarioContext();

    const handleNavigate = (section) => {
        setActiveSection(section);
        if (section === 'horarios') {
            resetToToday();
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                activeSection={activeSection}
                onNavigate={handleNavigate}
                usuario={usuario}
                onLogout={onLogout}
                t={t}
            />
            <div style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {activeSection === 'horarios' && <CalendarLayout />}
                {activeSection === 'editar' && <ScheduleEditorLayout />}
            </div>
        </div>
    );
}

export default function Home() {
    const [usuario, setUsuario] = useState(null);

    const handleLogin = (user) => setUsuario(user);
    const handleLogout = () => setUsuario(null);

    if (!usuario) {
        return <Login onLogin={handleLogin} />;
    }

    return <AppContent onLogout={handleLogout} usuario={usuario} />;
}
