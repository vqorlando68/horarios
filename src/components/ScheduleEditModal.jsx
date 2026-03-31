import React, { useState, useEffect } from 'react';
import './ScheduleEditModal.css';

// ─── Time helpers ───────────────────────────────────────────────────
// Convierte hora (24h o AM/PM) a formato 24h para guardar en BD
const parseDBTime = (timeStr) => {
    if (!timeStr) return '';
    const trimmed = timeStr.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return trimmed;
    let [, h, m, meridiem] = match;
    let hours = parseInt(h, 10);
    if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${m}`;
};

const formatDBTime = (time24h) => {
    if (!time24h) return '';
    const [h, m] = time24h.split(':');
    let hours = parseInt(h, 10);
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${m} ${meridiem}`;
};

const formatTimeForInput = (timeStr) => {
    if (!timeStr) return '';
    const trimmed = timeStr.trim();
    if (/am|pm/i.test(trimmed)) return trimmed;
    return formatDBTime(timeStr);
};

// Enforce AM range (00:00-11:59)
const clampAM = (val) => {
    if (!val) return val;
    const match = val.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return val;
    let hours = parseInt(match[1], 10);
    const mins = match[2];
    if (hours >= 12) hours = 11;
    return `${String(hours).padStart(2, '0')}:${mins} AM`;
};

// Enforce PM range (12:00-23:59)
const clampPM = (val) => {
    if (!val) return val;
    const match = val.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return val;
    let hours = parseInt(match[1], 10);
    const mins = match[2];
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'AM' && hours === 12) {
        return `12:${mins} PM`;
    }
    if (!meridiem && hours < 12) {
        return `${String(hours).padStart(2, '0')}:${mins} PM`;
    }
    return `${String(hours).padStart(2, '0')}:${mins} PM`;
};

// ─── Custom mini-toast for inline messages ──────────────────────────
function InlineAlert({ msg, type = 'error', onClose }) {
    if (!msg) return null;
    const colors = {
        error:   { bg: '#fff5f5', border: '#e53e3e', text: '#c53030', icon: '🚫' },
        warning: { bg: '#fffbf0', border: '#ff7a39', text: '#c06000', icon: '⚠️' },
        success: { bg: '#f0fff4', border: '#01ae6c', text: '#276749', icon: '✅' },
        info:    { bg: '#e8f8ff', border: '#00aae1', text: '#035374', icon: 'ℹ️' },
    };
    const c = colors[type] || colors.error;
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 500,
            marginBottom: 16, lineHeight: 1.5, animation: 'modal-pop 0.2s ease-out'
        }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{c.icon}</span>
            <span style={{ flex: 1 }}>{msg}</span>
            {onClose && (
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontWeight: 700, fontSize: 14, padding: 0 }}>✕</button>
            )}
        </div>
    );
}

// ─── Main Modal ─────────────────────────────────────────────────────
export default function ScheduleEditModal({ isOpen, onClose, dayData, onSave, profesionalNombre, modoInfo, rangosPersonalizados = [], trabajaFestivos = true }) {
    const [formData, setFormData] = useState({
        hora_inicio_manana: '',
        hora_fin_manana: '',
        hora_inicio_tarde: '',
        hora_fin_tarde: ''
    });
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertType, setAlertType] = useState('error');

    useEffect(() => {
        if (dayData) {
            setFormData({
                hora_inicio_manana: formatTimeForInput(dayData.hora_inicio_manana),
                hora_fin_manana:    formatTimeForInput(dayData.hora_fin_manana),
                hora_inicio_tarde:  formatTimeForInput(dayData.hora_inicio_tarde),
                hora_fin_tarde:     formatTimeForInput(dayData.hora_fin_tarde)
            });
            setAlertMsg(null);
        }
    }, [dayData, isOpen]);

    if (!isOpen || !dayData) return null;

    const isDomingo = dayData.dia_semana === 'DO';
    const puedeEditarDomingo = trabajaFestivos || !isDomingo;

    // ── Handlers ──
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    // On blur: clamp to correct AM/PM range
    const handleBlurManana = (e) => {
        const clamped = clampAM(e.target.value);
        setFormData(prev => ({ ...prev, [e.target.name]: clamped }));
    };

    const handleBlurTarde = (e) => {
        const clamped = clampPM(e.target.value);
        setFormData(prev => ({ ...prev, [e.target.name]: clamped }));
    };

    const handleClearManana = () => setFormData(prev => ({ ...prev, hora_inicio_manana: '', hora_fin_manana: '' }));
    const handleClearTarde  = () => setFormData(prev => ({ ...prev, hora_inicio_tarde: '', hora_fin_tarde: '' }));

    // ── Validaciones ──
    const validate = () => {
        const { hora_inicio_manana, hora_fin_manana, hora_inicio_tarde, hora_fin_tarde } = formData;

        // Sesión mañana: si una tiene valor, ambas deben tenerlo y inicio < fin
        if (hora_inicio_manana || hora_fin_manana) {
            if (!hora_inicio_manana || !hora_fin_manana) {
                return { ok: false, msg: 'Sesión Mañana: debes completar tanto la hora de inicio como la de fin.' };
            }
            if (hora_inicio_manana >= hora_fin_manana) {
                return { ok: false, msg: 'Sesión Mañana: la hora de inicio debe ser anterior a la hora de fin.' };
            }
        }

        // Sesión tarde
        if (hora_inicio_tarde || hora_fin_tarde) {
            if (!hora_inicio_tarde || !hora_fin_tarde) {
                return { ok: false, msg: 'Sesión Tarde: debes completar tanto la hora de inicio como la de fin.' };
            }
            if (hora_inicio_tarde >= hora_fin_tarde) {
                return { ok: false, msg: 'Sesión Tarde: la hora de inicio debe ser anterior a la hora de fin.' };
            }
        }

        // Solapamiento con horarios personalizados (solo si modo personalizado)
        if (modoInfo?.tipo === 'personalizado' && modoInfo?.fechaInicio && modoInfo?.fechaFinal) {
            const newInicio = modoInfo.fechaInicio;
            const newFin    = modoInfo.fechaFinal;

            const solapados = rangosPersonalizados.filter(r => {
                // Excluir el rango actual que se está editando
                const mismoRango = r.fecha_inicio === newInicio && r.fecha_final === newFin;
                if (mismoRango) return false;
                // Overlap check: [newInicio, newFin] ∩ [r.inicio, r.fin] != ∅
                return r.fecha_inicio <= newFin && r.fecha_final >= newInicio;
            });

            if (solapados.length > 0) {
                const ranges = solapados.map(r => `• ${r.fecha_inicio} → ${r.fecha_final}`).join('\n');
                return {
                    ok: false,
                    msg: `El rango personalizado seleccionado se solapa con ${solapados.length} rango(s) existente(s):\n${ranges}`,
                    type: 'warning'
                };
            }
        }

        return { ok: true };
    };

    const handleSave = () => {
        const v = validate();
        if (!v.ok) {
            setAlertMsg(v.msg);
            setAlertType(v.type || 'error');
            return;
        }
        onSave({
            ...dayData,
            hora_inicio_manana: parseDBTime(formData.hora_inicio_manana),
            hora_fin_manana:    parseDBTime(formData.hora_fin_manana),
            hora_inicio_tarde:  parseDBTime(formData.hora_inicio_tarde),
            hora_fin_tarde:     parseDBTime(formData.hora_fin_tarde)
        });
        onClose();
    };

    // ── Info header data ──
    const tipoLabel = modoInfo?.tipo === 'personalizado' ? 'Horario Personalizado' : 'Horario Base';
    const rangoLabel = modoInfo?.tipo === 'personalizado'
        ? `${modoInfo.fechaInicio} → ${modoInfo.fechaFinal}`
        : modoInfo?.fechaInicio
            ? `Desde ${modoInfo.fechaInicio} (indefinido)`
            : 'Sin fecha de inicio definida';

    return (
        <div className="schedule-modal-overlay">
            <div className="schedule-modal-content">

                {/* Header */}
                <div className="modal-header">
                    <div className="modal-pretitle">PROGRAMACIÓN</div>
                    <div className="modal-title-text">Editar Horas del {dayData.nombreDia}</div>
                    <div className="modal-icon-top">⏱️</div>
                </div>

                {/* Info strip */}
                <div className="modal-info-strip">
                    <div className="modal-info-item">
                        <span className="modal-info-icon">👤</span>
                        <span className="modal-info-text">{profesionalNombre || '—'}</span>
                    </div>
                    <div className="modal-info-divider" />
                    <div className="modal-info-item">
                        <span className="modal-info-icon">{modoInfo?.tipo === 'personalizado' ? '📅' : '📋'}</span>
                        <span className="modal-info-text"><strong>{tipoLabel}</strong>&nbsp;·&nbsp;{rangoLabel}</span>
                    </div>
                </div>

                {/* Alert */}
                {!puedeEditarDomingo && (
                    <InlineAlert msg="Este profesional no trabaja domingos. No se pueden editar las horas de este día." type="warning" />
                )}
                {alertMsg && (
                    <InlineAlert msg={alertMsg} type={alertType} onClose={() => setAlertMsg(null)} />
                )}

                {/* Sesión Mañana */}
                <div className="session-block">
                    <div className="session-block-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>SESIÓN MAÑANA <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 11 }}>(solo AM)</span></span>
                        <button type="button" onClick={handleClearManana} className="btn-limpiar-session" disabled={!puedeEditarDomingo}>Limpiar</button>
                    </div>
                    <div className="time-inputs-row">
                        <div className="time-input-group">
                            <span className="time-label">HORA INICIO</span>
                            <div className="time-input-wrapper">
                                <input type="text" className="time-input" name="hora_inicio_manana"
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$"
                                    value={formData.hora_inicio_manana}
                                    onBlur={handleBlurManana}
                                    onChange={handleChange}
                                    disabled={!puedeEditarDomingo}
                                />
                                <span className="time-icon">🌤️</span>
                            </div>
                        </div>
                        <div className="time-input-group">
                            <span className="time-label">HORA FIN</span>
                            <div className="time-input-wrapper">
                                <input type="text" className="time-input" name="hora_fin_manana"
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$"
                                    value={formData.hora_fin_manana}
                                    onBlur={handleBlurManana}
                                    onChange={handleChange}
                                    disabled={!puedeEditarDomingo}
                                />
                                <span className="time-icon">🌥️</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sesión Tarde */}
                <div className="session-block">
                    <div className="session-block-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>SESIÓN TARDE <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 11 }}>(solo PM)</span></span>
                        <button type="button" onClick={handleClearTarde} className="btn-limpiar-session" disabled={!puedeEditarDomingo}>Limpiar</button>
                    </div>
                    <div className="time-inputs-row">
                        <div className="time-input-group">
                            <span className="time-label">HORA INICIO</span>
                            <div className="time-input-wrapper">
                                <input type="text" className="time-input" name="hora_inicio_tarde"
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$"
                                    value={formData.hora_inicio_tarde}
                                    onBlur={handleBlurTarde}
                                    onChange={handleChange}
                                    disabled={!puedeEditarDomingo}
                                />
                                <span className="time-icon">🌆</span>
                            </div>
                        </div>
                        <div className="time-input-group">
                            <span className="time-label">HORA FIN</span>
                            <div className="time-input-wrapper">
                                <input type="text" className="time-input" name="hora_fin_tarde"
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$"
                                    value={formData.hora_fin_tarde}
                                    onBlur={handleBlurTarde}
                                    onChange={handleChange}
                                    disabled={!puedeEditarDomingo}
                                />
                                <span className="time-icon">🌙</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-save-modal" onClick={handleSave} disabled={!puedeEditarDomingo}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        Guardar Cambios
                    </button>
                    <button className="btn-cancel-modal" onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}
