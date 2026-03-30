import { useCalendario } from '../hooks/useCalendario';
import './WeekView.css';

export default function WeekView() {
    const { currentDate, appointments, absences, horarios, openAppointmentDetails, t, prevDateRange, nextDateRange, setToday, language } = useCalendario();

    // Generate week days starting from the current date's Monday
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    let minHour = 7;
    let maxHour = 18;
    let minT = 24, maxT = 0;

    if (horarios && horarios.length > 0) {
        horarios.forEach(h => {
            if (h.franjas) {
                h.franjas.forEach(f => {
                    if (!f.inicio || !f.fin) return;
                    const s = parseInt(f.inicio.split(':')[0], 10);
                    const e = parseInt(f.fin.split(':')[0], 10);
                    if (!isNaN(s) && s < minT) minT = s;
                    if (!isNaN(e)) {
                        let eAdj = e;
                        if (parseInt(f.fin.split(':')[1], 10) > 0) eAdj = e + 1;
                        if (eAdj > maxT) maxT = eAdj;
                    }
                });
            }
        });
    }

    if (appointments && appointments.length > 0) {
        appointments.forEach(a => {
            if (!a.fecha_inicio || !a.fecha_fin) return;
            const sDate = new Date(a.fecha_inicio);
            const eDate = new Date(a.fecha_fin);
            const s = sDate.getHours();
            let e = eDate.getHours();
            if (eDate.getMinutes() > 0) e += 1;
            if (s < minT) minT = s;
            if (e > maxT) maxT = e;
        });
    }

    if (minT < 24) minHour = minT;
    if (maxT > 0) maxHour = Math.max(maxT, minHour + 1);

    if (minHour > maxHour) {
        minHour = 7;
        maxHour = 18;
    }

    const formatDateStr = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const hoursCount = (maxHour - minHour) + 1;
    const hours = Array.from({ length: Math.max(hoursCount, 1) }).map((_, i) => i + minHour);
    const startHourOffset = minHour;

    const renderEvent = (appt, currentDayObj, column = 0, totalColumns = 1) => {
        const start = new Date(appt.fecha_inicio);
        const end = new Date(appt.fecha_fin);

        const dayString = formatDateStr(currentDayObj);
        const dayStartMilli = new Date(dayString + 'T00:00:00').getTime();
        const dayEndMilli = new Date(dayString + 'T23:59:59').getTime();

        const renderStart = new Date(Math.max(start.getTime(), dayStartMilli));
        const renderEnd = new Date(Math.min(end.getTime(), dayEndMilli));

        const startHour = renderStart.getHours();
        const startMin = renderStart.getMinutes();
        const durationMins = Math.max(0, (renderEnd.getTime() - renderStart.getTime()) / 60000);

        if (durationMins <= 0) return null;

        const topOffset = ((startHour - startHourOffset) * 80) + ((startMin / 60) * 80);
        const height = (durationMins / 60) * 80;

        // Position event side-by-side
        const width = 100 / totalColumns;
        const left = column * width;

        return (
            <div
                key={appt.id}
                className="calendar-event"
                style={{
                    top: `${topOffset}px`,
                    height: `${height}px`,
                    left: `${left}%`,
                    width: `${width}%`,
                    borderLeftColor: appt.color_hex,
                    '--event-color': appt.color_hex,
                    background: (appt.color_hex || '#000') + '08' // Subtle back color
                }}
                onClick={() => openAppointmentDetails(appt)}
            >
                <div className="custom-wk-tooltip">
                    <strong>Código:</strong> {appt.id}<br />
                    <strong>Hora:</strong> {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
                    <strong>Paciente:</strong> {appt.paciente_nombre}<br />
                    <strong>Entidad:</strong> {appt.entidad}<br />
                    <strong>Motivo:</strong> {appt.motivo}
                </div>

                <div style={{ overflow: 'hidden', height: '100%' }}>
                    <div className="event-time">
                        <span style={{ color: appt.color_hex, fontWeight: 'bold' }}>{appt.id} - {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="event-title">{appt.paciente_nombre}</div>
                    <div className="event-subtitle">{appt.origen}</div>
                    <div className="event-reason">{t('reason')}: {appt.motivo}</div>
                </div>
            </div>
        );
    };

    // Helper to group overlapping appointments
    const getOverlappingGroups = (events) => {
        if (!events || events.length === 0) return [];
        const sorted = [...events].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
        const groups = [];
        
        sorted.forEach(evt => {
            const start = new Date(evt.fecha_inicio).getTime();
            let placed = false;
            for(const group of groups) {
                const groupMaxEnd = Math.max(...group.map(e => new Date(e.fecha_fin).getTime()));
                if (start < groupMaxEnd) {
                    group.push(evt);
                    placed = true;
                    break;
                }
            }
            if(!placed) groups.push([evt]);
        });

        // For each group, calculate columns
        const results = [];
        groups.forEach(group => {
            const columns = [];
            group.forEach(evt => {
                const start = new Date(evt.fecha_inicio).getTime();
                let colIdx = 0;
                while (columns[colIdx] && columns[colIdx] > start) {
                    colIdx++;
                }
                columns[colIdx] = new Date(evt.fecha_fin).getTime();
                results.push({ appt: evt, col: colIdx, total: group.length });
            });
            // Update total to actual max columns used in group for better width distribution
            const maxColsInGroup = columns.length;
            results.forEach(r => {
                if (group.includes(r.appt)) r.total = maxColsInGroup;
            });
        });
        return results;
    };

    const renderAbsence = (abs, currentDayObj) => {
        const absStart = new Date(abs.fecha_inicial);
        const absEnd = new Date(abs.fecha_final);
        if (absEnd.getHours() === 0 && absEnd.getMinutes() === 0) {
            absEnd.setHours(23, 59, 59, 999);
        }

        const dayString = formatDateStr(currentDayObj);
        const dayStartMilli = new Date(dayString + 'T00:00:00').getTime();
        const dayEndMilli = new Date(dayString + 'T23:59:59').getTime();

        let startMins = 0;
        if (absStart.getTime() > dayStartMilli) {
            startMins = absStart.getHours() * 60 + absStart.getMinutes();
        }

        let endMins = 24 * 60;
        if (absEnd.getTime() < dayEndMilli) {
            endMins = absEnd.getHours() * 60 + absEnd.getMinutes();
        }

        const calStartMins = startHourOffset * 60;
        const calEndMins = (startHourOffset + hoursCount) * 60;

        const renderStartMins = Math.max(startMins, calStartMins);
        const renderEndMins = Math.min(endMins, calEndMins);
        const durationMins = Math.max(0, renderEndMins - renderStartMins);

        if (durationMins <= 0) return null;

        const topOffset = ((renderStartMins - calStartMins) / 60) * 80;
        const height = (durationMins / 60) * 80;

        return (
            <div
                key={abs.id}
                className="calendar-absence"
                style={{ top: `${topOffset}px`, height: `${height}px`, zIndex: 5 }}
            >
                {abs.motivo}
            </div>
        )
    }

    const formatDateRange = () => {
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        const loc = language === 'es' ? 'es-ES' : 'en-US';
        return `${startOfWeek.toLocaleDateString(loc, { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="week-view-container">
            <div className="week-header-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-surface-alt)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{t('dailySchedule')} - {t('week')} ({formatDateRange()})</h2>
                <div className="m-controls" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={prevDateRange} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>{"<"}</button>
                    <button onClick={setToday} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', fontWeight: 'bold' }}>{t('today')}</button>
                    <button onClick={nextDateRange} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>{">"}</button>
                </div>
            </div>
            <div className="week-header">
                <div className="time-col-header">{t('time')}</div>
                {weekDays.map(d => (
                    <div key={d.toISOString()} className="day-col-header">
                        {d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'short', day: '2-digit' }).toUpperCase()}
                    </div>
                ))}
            </div>

            <div className="week-body">
                <div className="time-col">
                    {hours.map(h => (
                        <div key={h} className="time-slot">{h < 10 ? `0${h}:00` : `${h}:00`} {h >= 12 ? 'PM' : 'AM'}</div>
                    ))}
                </div>
                {weekDays.map(d => {
                    const localY = d.getFullYear();
                    const localM = String(d.getMonth() + 1).padStart(2, '0');
                    const localD = String(d.getDate()).padStart(2, '0');
                    const dayString = `${localY}-${localM}-${localD}`;
                    const dayAppts = appointments.filter(a => a.fecha_inicio.startsWith(dayString));
                    const dayStartMilli = new Date(dayString + 'T00:00:00').getTime();
                    const dayEndMilli = new Date(dayString + 'T23:59:59').getTime();
                    const dayAbsences = absences.filter(a => {
                        const absStart = new Date(a.fecha_inicial).getTime();
                        const absEndDate = new Date(a.fecha_final);
                        if (absEndDate.getHours() === 0 && absEndDate.getMinutes() === 0) {
                            absEndDate.setHours(23, 59, 59, 999);
                        }
                        const absEnd = absEndDate.getTime();
                        return absStart <= dayEndMilli && absEnd >= dayStartMilli;
                    });
                    const dayMapping = { 0: 'DO', 1: 'LU', 2: 'MA', 3: 'MI', 4: 'JU', 5: 'VI', 6: 'SA' };
                    const dayCode = dayMapping[d.getDay()];
                    
                    // En Oracle pueden venir multiples filas para el mismo día, consolidamos todas sus franjas
                    const dayHorariosList = horarios.filter(h => h.dia_semana === dayCode);
                    const todasLasFranjas = dayHorariosList.flatMap(h => h.franjas || []);

                    const franjasV = todasLasFranjas.filter(f => f.tipo_atencion === 'V');
                    const franjasO = todasLasFranjas.filter(f => f.tipo_atencion === 'O');
                    const overlaps = [];

                    franjasV.forEach(v => {
                        const [vStartH, vStartM] = v.inicio.split(':').map(Number);
                        const [vEndH, vEndM] = v.fin.split(':').map(Number);
                        const vStartMin = vStartH * 60 + vStartM;
                        const vEndMin = vEndH * 60 + vEndM;

                        franjasO.forEach(o => {
                            const [oStartH, oStartM] = o.inicio.split(':').map(Number);
                            const [oEndH, oEndM] = o.fin.split(':').map(Number);
                            const oStartMin = oStartH * 60 + oStartM;
                            const oEndMin = oEndH * 60 + oEndM;

                            const overlapStart = Math.max(vStartMin, oStartMin);
                            const overlapEnd = Math.min(vEndMin, oEndMin);

                            if (overlapStart < overlapEnd) {
                                overlaps.push({ start: overlapStart, end: overlapEnd });
                            }
                        });
                    });


                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                    return (
                        <div key={dayString} className={`day-col ${isWeekend ? 'weekend' : ''}`}>
                            {/* Render Franjas */}
                            <div className="franjas-container">
                                {todasLasFranjas.map((franja, idx) => {
                                    const [startH, startM] = franja.inicio.split(':').map(Number);
                                    const [endH, endM] = franja.fin.split(':').map(Number);
                                    const startTotalMin = startH * 60 + startM;
                                    const endTotalMin = endH * 60 + endM;
                                    const durationMins = endTotalMin - startTotalMin;

                                    const topOffset = ((startH - startHourOffset) * 80) + ((startM / 60) * 80);
                                    const height = (durationMins / 60) * 80;

                                    let franjaClass = 'franja-regular';
                                    let franjaLabel = '';
                                    if (franja.tipo_atencion === 'V') {
                                        franjaClass = 'franja-v';
                                        franjaLabel = t('voluntary') || 'Voluntario';
                                    } else if (franja.tipo_atencion === 'O') {
                                        franjaClass = 'franja-o';
                                        franjaLabel = t('obligatory') || 'Obligatorio';
                                    } else if (franja.tipo_atencion === 'G') {
                                        franjaClass = 'franja-g';
                                        franjaLabel = t('giris') || 'GIRIS';
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={`franja-slot ${franjaClass}`}
                                            style={{ top: `${topOffset}px`, height: `${height}px`, zIndex: franja.tipo_atencion ? 10 : 5 }}
                                        >
                                            {franjaLabel && <span className="franja-label">{franjaLabel}</span>}
                                        </div>
                                    );
                                })}
                                {overlaps.map((overlap, idx) => {
                                    const topOffset = ((overlap.start / 60) - startHourOffset) * 80;
                                    const height = ((overlap.end - overlap.start) / 60) * 80;
                                    return (
                                        <div
                                            key={`overlap-${idx}`}
                                            className="franja-slot franja-overlap"
                                            style={{ top: `${topOffset}px`, height: `${height}px`, zIndex: 3 }}
                                        >
                                            <span className="franja-label" style={{ color: '#991b1b', zIndex: 4 }}>TRASLAPE</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Render Background Grid Lines Overlay so solid franjas dont hide lines */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
                                {hours.map(h => (
                                    <div key={h} className="grid-cell"></div>
                                ))}
                            </div>
                            {/* Render Events */}
                            <div className="events-container">
                                {dayAbsences.map(abs => renderAbsence(abs, d))}
                                {getOverlappingGroups(dayAppts).map(groupObj => renderEvent(groupObj.appt, d, groupObj.col, groupObj.total))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
