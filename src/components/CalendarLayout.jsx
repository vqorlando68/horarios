import { useState, useEffect } from 'react';
import { useCalendarioContext } from '../context/CalendarioContext';
import '../styles/tokens.css';
import './CalendarLayout.css';
import WeekView from './WeekView';
import MonthView from './MonthView';
import DayView from './DayView';
import AppointmentModal from './AppointmentModal';
import StatsFooter from './StatsFooter';
import DocumentationModal from './DocumentationModal';
import SearchableSelect from './SearchableSelect';

export default function CalendarLayout() {
    const { 
        view, setView, professional, setProfessional, profesionales, 
        setToday, currentDate, setCurrentDate, nextDateRange, prevDateRange, 
        selectedAppointment, language, setLanguage, t, loading, 
        selectedEntity, setSelectedEntity, entidadesList, 
        estadosCita, selectedStatus, setSelectedStatus,
        theme, toggleTheme
    } = useCalendarioContext();
    const [docVisible, setDocVisible] = useState(false);

    // Dynamic documentation overlay (CTRL+ALT+D)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                setDocVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const formatDateLabel = () => {
        // Very basic formatting for the header like "Oct 23 - Oct 29, 2023"
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        const loc = language === 'es' ? 'es-ES' : 'en-US';
        if (view === 'week') {
            const day = start.getDay() || 7;
            if (day !== 1) start.setHours(-24 * (day - 1));
            end.setTime(start.getTime() + 6 * 24 * 60 * 60 * 1000);
            return `${start.toLocaleDateString(loc, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (view === 'month') {
            return start.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
        } else {
            return start.toLocaleDateString(loc, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    return (
        <div className="layout-container">
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'var(--modal-backdrop)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backdropFilter: 'blur(3px)'
                }}>
                    <style>
                        {`
                        @keyframes calendar-spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        `}
                    </style>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '5px solid #e0f2fe',
                        borderTop: '5px solid var(--color-seguridad-500, #00aae1)',
                        borderRadius: '50%',
                        animation: 'calendar-spin 1s linear infinite',
                        marginBottom: '20px'
                    }}></div>
                    <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>Cargando información...</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>Obteniendo datos frescos de la base de datos Oracle</p>
                </div>
            )}

            <header className="top-header">
                <div className="logo-section">
                    <div className="brand-text">
                        <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{t('schedules')}</h1>
                    </div>
                </div>

                <div className="action-section">
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button
                        onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    >
                        {language === 'es' ? '🇪🇸 ESP' : '🇺🇸 ENG'}
                    </button>
                </div>
            </header>

            <div className="controls-bar">
                <div className="filters">
                    <div className="filter-group">
                        <label>{t('selectDate')}</label>
                        <input
                            type="date"
                            className="date-picker-simulate"
                            style={{ fontFamily: 'inherit', WebkitAppearance: 'none' }}
                            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`}
                            onChange={(e) => {
                                const [y, m, d] = e.target.value.split('-').map(Number);
                                const newDate = new Date(currentDate);
                                newDate.setFullYear(y);
                                newDate.setMonth(m - 1);
                                newDate.setDate(d);
                                newDate.setHours(0, 0, 0, 0);
                                setCurrentDate(newDate);
                            }}
                        />
                    </div>
                    <div className="filter-group">
                        <label>{t('professional')}</label>
                        <SearchableSelect
                            options={profesionales}
                            selectedId={professional ? professional.id : 0}
                            onChange={(id) => {
                                setProfessional(id === 0 ? { id: 0, nombre: "Todos" } : profesionales.find(p => p.id === id));
                                setSelectedStatus(0); // Reset filter when switching pros
                            }}
                            placeholder={t('select')}
                        />
                    </div>
                    <div className="filter-group">
                        <label>{t('entity')}</label>
                        <select
                            className="filter-select"
                            value={selectedEntity}
                            onChange={(e) => setSelectedEntity(e.target.value)}
                        >
                            {entidadesList.map(ent => (
                                <option key={ent} value={ent}>{ent}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>{t('apptStatus')}</label>
                        <select
                            className="filter-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(Number(e.target.value))}
                        >
                            <option value={0}>{t('allStates')}</option>
                            {estadosCita.map(est => (
                                <option key={est.id} value={est.id}>{est.estado_cita}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="view-toggles">
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('view')}</label>
                    <div className="toggle-group">
                        <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>{t('day')}</button>
                        <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>{t('week')}</button>
                        <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>{t('month')}</button>
                    </div>
                </div>
            </div>

            <main className="calendar-mainArea">
                {view === 'day' && <DayView />}
                {view === 'week' && <WeekView />}
                {view === 'month' && <MonthView />}
            </main>

            <StatsFooter />

            {selectedAppointment && <AppointmentModal appt={selectedAppointment} />}

            {docVisible && <DocumentationModal onClose={() => setDocVisible(false)} />}
        </div>
    );
}
