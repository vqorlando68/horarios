import React from 'react';
import { useCalendarioContext } from '../context/CalendarioContext';
import './ProfessionalSchedule.css';

const dayNames = {
  'LU': 'Lunes',
  'MA': 'Martes',
  'MI': 'Miércoles',
  'JU': 'Jueves',
  'VI': 'Viernes',
  'SA': 'Sábado',
  'DO': 'Domingo'
};

const dayOrder = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

export default function ProfessionalSchedule() {
  const { horarios, professional, absences, currentDate, language, t } = useCalendarioContext();

  if (!professional || professional.id === 0) return null;

  // Calculate visible period range for absences (usually the current week/month visible)
  const startVisible = new Date(currentDate);
  const day = startVisible.getDay() || 7;
  startVisible.setDate(startVisible.getDate() - (day - 1));
  startVisible.setHours(0,0,0,0);
  
  const endVisible = new Date(startVisible);
  endVisible.setDate(endVisible.getDate() + 6);
  endVisible.setHours(23,59,59,999);

  // Filter absences for the visible period
  const visibleAbsences = absences.filter(abs => {
    const absStart = new Date(abs.fecha_inicial);
    const absEnd = new Date(abs.fecha_final);
    return absStart <= endVisible && absEnd >= startVisible;
  });

  // Sort horarios by dayOrder
  const sortedHorarios = [...horarios].sort((a, b) => {
    return dayOrder.indexOf(a.dia_semana) - dayOrder.indexOf(b.dia_semana);
  });

  const formatAbsenceDate = (dateStr) => {
    const d = new Date(dateStr);
    const loc = language === 'es' ? 'es-ES' : 'en-US';
    return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="professional-schedule">
      <div className="schedule-header">
        <h3>{t('professionalSchedule') || 'Horario del Profesional'}</h3>
        <p className="professional-name">{professional.nombre}</p>
      </div>
      
      <div className="schedule-sections">
        <section className="horarios-section">
          <h4 className="section-title">{t('workingHours')}</h4>
          <div className="schedule-list">
            {sortedHorarios.length > 0 ? (
              sortedHorarios.map((h, idx) => (
                <div key={idx} className="day-schedule-card">
                  <div className="day-header">
                    <span className="day-name">{dayNames[h.dia_semana] || h.dia_semana}</span>
                  </div>
                  <div className="franjas-list">
                    {h.franjas && h.franjas.length > 0 ? (
                      h.franjas.map((f, fIdx) => (
                        <div key={fIdx} className="franja-item">
                          <div className="franja-time">
                            <span className="time-icon">🕒</span>
                            <span>{f.inicio} - {f.fin}</span>
                          </div>
                          {f.tipo_atencion && (
                            <span className={`atencion-badge ${f.tipo_atencion.toLowerCase()}`}>
                              {f.tipo_atencion === 'G' ? t('giris') :
                               f.tipo_atencion === 'V' ? t('voluntary') :
                               f.tipo_atencion === 'O' ? t('obligatory') :
                               f.tipo_atencion}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="no-schedule">No labora</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-horarios">
                <p>No hay horario configurado para este profesional.</p>
              </div>
            )}
          </div>
        </section>

        <section className="absences-section">
          <h4 className="section-title">{t('absences')}</h4>
          {visibleAbsences.length > 0 ? (
            <div className="absences-table-container">
              <table className="absences-table">
                <thead>
                  <tr>
                    <th>{t('start') || 'Inicio'}</th>
                    <th>{t('end') || 'Fin'}</th>
                    <th>{t('reason') || 'Motivo'}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAbsences.map((abs, idx) => (
                    <tr key={idx}>
                      <td>{formatAbsenceDate(abs.fecha_inicial)}</td>
                      <td>{formatAbsenceDate(abs.fecha_final)}</td>
                      <td><span className="absence-reason-badge">{abs.motivo}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-absences">No hay ausencias registradas para este periodo.</p>
          )}
        </section>
      </div>

      <div className="schedule-footer">
        <p className="legend">📍 El horario base puede variar según fechas especiales.</p>
      </div>
    </aside>
  );
}
