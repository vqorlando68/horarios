import { useCalendario } from '../hooks/useCalendario';
import './MonthView.css';

export default function MonthView() {
    const { currentDate, appointments, openAppointmentDetails, t, prevDateRange, nextDateRange, setToday, language } = useCalendario();

    // Generate grid for true month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 for Sunday
    const realToday = new Date();

    const days = [];
    // Padding prev month
    for (let i = 0; i < firstDay; i++) {
        days.push({ day: '', date: null });
    }
    // Content
    for (let i = 1; i <= daysInMonth; i++) {
        const isCurrentActiveDay = (
            i === realToday.getDate() &&
            month === realToday.getMonth() &&
            year === realToday.getFullYear()
        );
        days.push({
            day: i,
            date: new Date(year, month, i),
            isToday: isCurrentActiveDay,
            badge: null
        });
    }

    const renderEventsForDay = (dayObj) => {
        if (!dayObj.date) return null;
        
        const localY = dayObj.date.getFullYear();
        const localM = String(dayObj.date.getMonth() + 1).padStart(2, '0');
        const localD = String(dayObj.date.getDate()).padStart(2, '0');
        const dayString = `${localY}-${localM}-${localD}`;

        const dayAppts = (appointments || [])
            .filter(a => a.fecha_inicio && a.fecha_inicio.startsWith(dayString))
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

        return dayAppts.map(appt => {
            const isSurgery = appt.motivo ? appt.motivo.includes('Surgery') : false;
            const timeStart = appt.fecha_inicio ? appt.fecha_inicio.split('T')[1]?.substring(0, 5) : '';
            const eDate = appt.fecha_final || appt.fecha_fin;
            const timeEnd = eDate ? eDate.split('T')[1]?.substring(0, 5) : '';

            return (
                <div key={appt.id} className="month-event" onClick={() => openAppointmentDetails(appt)}>
                    <div className="m-event-time" style={{ background: (appt.color_hex || '#000') + '15', color: appt.color_hex }}>
                        {timeStart} - {timeEnd}
                    </div>
                    <div className="m-event-body">
                        <strong>{isSurgery ? 'Next: Surgery' : appt.paciente_nombre}</strong><br />
                        {isSurgery && <span>{appt.paciente_nombre}<br /></span>}
                        <span className="m-event-id">{appt.id} | {timeStart}</span>
                    </div>
                </div>
            )
        });
    };

    return (
        <div className="month-view-container">
            <div className="month-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-surface-alt)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Agenda Mensual - {currentDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}</h2>
                <div className="m-controls" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={prevDateRange} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>{"<"}</button>
                    <button onClick={setToday} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', fontWeight: 'bold' }}>{t('today')}</button>
                    <button onClick={nextDateRange} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>{">"}</button>
                </div>
            </div>
            <div className="month-grid-header">
                {(language === 'es' ? ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']).map(d => (
                    <div key={d}>{d}</div>
                ))}
            </div>
            <div className="month-grid">
                {days.map((d, index) => (
                    <div key={index} className={`month-cell ${d.isToday ? 'is-today' : ''} ${!d.day ? 'empty-cell' : ''}`}>
                        {d.day && (
                            <div className="cell-header">
                                <span className="day-number">{d.day}</span>
                                {d.badge && <span className="day-badge">{d.badge}</span>}
                                {d.isToday && <span className="today-badge">{t('today').toUpperCase()}</span>}
                            </div>
                        )}
                        <div className="cell-content">
                            {renderEventsForDay(d)}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
