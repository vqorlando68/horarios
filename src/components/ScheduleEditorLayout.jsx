import React, { useState, useEffect, useCallback } from 'react';
import { calendarioService } from '@/services/calendarioService';
import { useDatabaseDocs } from '@/context/DatabaseDocsContext';
import { scheduleEditorDocs } from '@/data/scheduleEditorDocs';
import './ScheduleEditorLayout.css';
import ScheduleEditModal from './ScheduleEditModal';
import SearchableSelect from './SearchableSelect';
import { AppDialogProvider } from './AppDialog';

const diasSemana = [
    { code: 'LU', name: 'Lunes' },
    { code: 'MA', name: 'Martes' },
    { code: 'MI', name: 'Miércoles' },
    { code: 'JU', name: 'Jueves' },
    { code: 'VI', name: 'Viernes' },
    { code: 'SA', name: 'Sábado' },
    { code: 'DO', name: 'Domingo' }
];

const MODO_BASE = 'base';
const MODO_PERSONALIZADO = 'personalizado';

// Formatea 'YYYY-MM-DD' → '1 de Enero de 2026'
const formatFechaLarga = (fechaStr) => {
    if (!fechaStr) return '';
    // Use UTC to avoid timezone day-off issues
    const [y, m, d] = fechaStr.split('-').map(Number);
    const fecha = new Date(Date.UTC(y, m - 1, d));
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Formatea hora 24h a 12h AM/PM (ej: "08:00" → "08:00 AM")
// Si ya viene con AM/PM, la devuelve tal cual
const formatHoraAMPM = (timeStr) => {
    if (!timeStr) return '';
    const trimmed = timeStr.trim();
    if (/am|pm/i.test(trimmed)) return trimmed;
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${m} ${meridiem}`;
};

function ScheduleEditorLayout() {
    const [profesionales, setProfesionales] = useState([]);
    const [selectedProfId, setSelectedProfId] = useState(0);
    const { setScreenDocs } = useDatabaseDocs();

    // Register this screen's DB docs for the global Ctrl+Alt+D modal
    useEffect(() => {
        setScreenDocs(scheduleEditorDocs);
    }, [setScreenDocs]);

    // Modo: 'base' o 'personalizado'
    const [modo, setModo] = useState(MODO_BASE);

    // Horario Base
    const [horarioBase, setHorarioBase] = useState([]);
    const [fechaInicioBase, setFechaInicioBase] = useState('');
    const [trabajaFestivos, setTrabajaFestivos] = useState(false);

    // Horarios Personalizados - lista de rangos
    const [rangosPersonalizados, setRangosPersonalizados] = useState([]);
    const [rangoSeleccionado, setRangoSeleccionado] = useState(null);
    const [mostrarFormNuevoRango, setMostrarFormNuevoRango] = useState(false);
    const [nuevoRangoInicio, setNuevoRangoInicio] = useState('');
    const [nuevoRangoFin, setNuevoRangoFin] = useState('');
    const [horarioActivo, setHorarioActivo] = useState([]);
    const [verPasados, setVerPasados] = useState(false);
    const [formError, setFormError] = useState(null); // error inline en formulario nuevo rango
    const [isLoadingDatos, setIsLoadingDatos] = useState(false);

    // Estado derivado de cuál grilla mostrar
    const horarioEnGrilla = modo === MODO_BASE ? horarioBase : horarioActivo;
    const setHorarioEnGrilla = modo === MODO_BASE ? setHorarioBase : setHorarioActivo;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeDayParams, setActiveDayParams] = useState(null);

    // ───────── Carga inicial de profesionales ─────────
    useEffect(() => {
        calendarioService.getProfesionales({ incluir_sin_horario: true })
            .then(data => {
                if (data.success) setProfesionales(data.data || []);
            })
            .catch(err => console.error(err));
    }, []);

    // ───────── Al cambiar profesional ─────────
    const cargarDatosProfesional = useCallback(async (profId) => {
        if (!profId || profId === 0) {
            setHorarioBase([]);
            setFechaInicioBase('');
            setRangosPersonalizados([]);
            setRangoSeleccionado(null);
            setHorarioActivo([]);
            return;
        }

        // Cargar horario base (fecha_final IS NULL)
        const resBase = await fetch(`/api/editar-horarios?id_usuario=${profId}&tipo=base`).then(r => r.json());
        if (resBase.success && resBase.data) {
            const dias = resBase.data.horarios || [];
            setHorarioBase(dias);
            if (dias.length > 0 && dias[0].fecha_inicio) {
                setFechaInicioBase(dias[0].fecha_inicio);
            } else {
                try {
                    const rf = await calendarioService.getFechaActual();
                    if (rf.success && rf.data) setFechaInicioBase(rf.data.split('T')[0]);
                } catch { setFechaInicioBase(''); }
            }
        }

        // Cargar horarios personalizados (fecha_final IS NOT NULL)
        const resTmp = await fetch(`/api/editar-horarios?id_usuario=${profId}&tipo=temporal`).then(r => r.json());
        if (resTmp.success && resTmp.data) {
            const diasTmp = resTmp.data.horarios || [];
            // Agrupar por rango (fecha_inicio + fecha_final)
            const rangoMap = {};
            diasTmp.forEach(d => {
                const key = `${d.fecha_inicio}|${d.fecha_final}`;
                if (!rangoMap[key]) {
                    rangoMap[key] = {
                        fecha_inicio: d.fecha_inicio,
                        fecha_final: d.fecha_final,
                        horarios: []
                    };
                }
                rangoMap[key].horarios.push(d);
            });
            const rangos = Object.values(rangoMap).sort((a, b) => a.fecha_inicio < b.fecha_inicio ? -1 : 1);
            setRangosPersonalizados(rangos);
            setRangoSeleccionado(null);
            setHorarioActivo([]);
        }
    }, []);

    // Calcular ayer una sola vez para filtrar rangos
    const ayerStr = (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    })();

    const rangosFiltrados = rangosPersonalizados.filter(r => {
        if (!r.fecha_final) return false; // nunca mostrar sin fecha_final
        if (!verPasados && r.fecha_final < ayerStr) return false;
        return true;
    });

    useEffect(() => {
        const prof = profesionales.find(p => p.id === selectedProfId);
        if (prof) setTrabajaFestivos(prof.trabaja_festivos === 'S');
        
        if (selectedProfId && selectedProfId !== 0) {
            setIsLoadingDatos(true);
            cargarDatosProfesional(selectedProfId).finally(() => setIsLoadingDatos(false));
        } else {
            cargarDatosProfesional(selectedProfId);
        }
    }, [selectedProfId, profesionales, cargarDatosProfesional]);

    // ───────── Seleccionar rango personalizado ─────────
    const handleSeleccionarRango = (rango) => {
        setRangoSeleccionado(rango);
        setHorarioActivo(rango ? rango.horarios : []);
        setMostrarFormNuevoRango(false);
    };

    // ───────── Crear nuevo rango ─────────
    const handleCrearNuevoRango = () => {
        // Validar que ambas fechas estén definidas
        if (!nuevoRangoInicio || !nuevoRangoFin) {
            setFormError('Debes definir tanto la fecha de inicio como la fecha de fin del rango.');
            return;
        }
        // Validar que fecha_final sea estrictamente mayor que fecha_inicio
        if (nuevoRangoFin <= nuevoRangoInicio) {
            setFormError('La fecha de fin debe ser posterior a la fecha de inicio.');
            return;
        }
        // Validar solapamiento con rangos existentes
        const solapados = rangosPersonalizados.filter(r => {
            if (!r.fecha_final) return false;
            return r.fecha_inicio <= nuevoRangoFin && r.fecha_final >= nuevoRangoInicio;
        });
        if (solapados.length > 0) {
            const lista = solapados.map(r => `  • ${formatFechaLarga(r.fecha_inicio)} → ${formatFechaLarga(r.fecha_final)}`).join('\n');
            setFormError(`El rango se solapa con ${solapados.length} rango(s) existente(s):\n${lista}`);
            return;
        }
        setFormError(null);
        const nuevoRango = { fecha_inicio: nuevoRangoInicio, fecha_final: nuevoRangoFin, horarios: [] };
        const nuevosRangos = [...rangosPersonalizados, nuevoRango].sort((a, b) => a.fecha_inicio < b.fecha_inicio ? -1 : 1);
        setRangosPersonalizados(nuevosRangos);
        setRangoSeleccionado(nuevoRango);
        setHorarioActivo([]);
        setMostrarFormNuevoRango(false);
        setNuevoRangoInicio('');
        setNuevoRangoFin('');
    };

    // ───────── Editar un día ─────────
    const handleEditDay = (dayObj) => {
        if (!trabajaFestivos && dayObj.code === 'DO') return;
        
        const existingInfo = horarioEnGrilla.find(h => h.dia_semana === dayObj.code) || {
            dia_semana: dayObj.code,
            hora_inicio_manana: '',
            hora_fin_manana: '',
            hora_inicio_tarde: '',
            hora_fin_tarde: ''
        };
        setActiveDayParams({ ...existingInfo, nombreDia: dayObj.name });
        setIsModalOpen(true);
    };

    // ───────── Guardar un día ─────────
    const handleSaveDay = (updatedDay) => {
        setHorarioEnGrilla(prev => {
            const exists = prev.find(h => h.dia_semana === updatedDay.dia_semana);
            return exists
                ? prev.map(h => h.dia_semana === updatedDay.dia_semana ? updatedDay : h)
                : [...prev, updatedDay];
        });

        if (!selectedProfId || selectedProfId === 0) return;

        // Determinar fecha_inicio y fecha_final según modo
        const fechaInicio = modo === MODO_BASE ? fechaInicioBase : (rangoSeleccionado?.fecha_inicio || '');
        const fechaFinal = modo === MODO_BASE ? null : (rangoSeleccionado?.fecha_final || '');

        const payload = {
            ...updatedDay,
            id_usuario: selectedProfId,
            fecha_inicio: fechaInicio,
            fecha_final: fechaFinal
        };

        fetch('/api/horarios-doctor/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) console.error('Error al guardar:', data.error);
        })
        .catch(err => console.error('Error de red:', err));
    };

    // ───────── Render Grilla de días ─────────
    const renderGrilla = () => (
        <div className="week-grid">
            {diasSemana.map((dia) => {
                const diaData = horarioEnGrilla.find(h => h.dia_semana === dia.code);
                const hasManana = diaData && diaData.hora_inicio_manana && diaData.hora_fin_manana;
                const hasTarde = diaData && diaData.hora_inicio_tarde && diaData.hora_fin_tarde;
                const isConfigured = hasManana || hasTarde;

                return (
                    <div key={dia.code} className={`day-card ${isConfigured ? 'active-card' : 'empty-card'}`}>
                        <div className="day-header-top">
                            <div className="day-titles">
                                <span className="day-code">{dia.code} - {dia.name.toUpperCase()}</span>
                                <span className="day-name">{dia.name}</span>
                            </div>
                            {(!trabajaFestivos && dia.code === 'DO') ? (
                                <span style={{ fontSize: 11, color: 'var(--gray-400)', fontStyle: 'italic' }}>No editable</span>
                            ) : (
                                <button className="edit-day-btn" onClick={() => handleEditDay(dia)} title="Editar horas">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                </button>
                            )}
                        </div>

                        <div className="session-container">
                            <span className="session-label">SESIÓN MAÑANA</span>
                            {hasManana ? (
                                <div className="session-time">
                                    <span style={{color: 'var(--gray-500)'}}>⏱️</span>
                                    {formatHoraAMPM(diaData.hora_inicio_manana)} - {formatHoraAMPM(diaData.hora_fin_manana)}
                                </div>
                            ) : (
                                <div className="status-badge fuera">🚫 No labora</div>
                            )}
                        </div>

                        <div className="session-container">
                            <span className="session-label">SESIÓN TARDE</span>
                            {hasTarde ? (
                                <div className="session-time">
                                    <span style={{color: 'var(--gray-500)'}}>⏱️</span>
                                    {formatHoraAMPM(diaData.hora_inicio_tarde)} - {formatHoraAMPM(diaData.hora_fin_tarde)}
                                </div>
                            ) : (
                                <div className="status-badge fuera">🚫 No labora</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const profSeleccionado = profesionales.find(p => p.id === selectedProfId);

    return (
        <div className="schedule-editor-layout">
            {/* Header selección profesional */}
            <div className="editor-header-card">
                <div className="editor-label-mini">SELECCIONAR PROFESIONAL PARA GESTIÓN ({profesionales.length} cargados)</div>
                <div className="professional-select-wrapper" style={{ display: 'flex', gap: '12px' }}>
                    <SearchableSelect
                        options={profesionales}
                        selectedId={selectedProfId}
                        onChange={id => setSelectedProfId(id)}
                        placeholder="Buscar profesional..."
                    />
                    {profSeleccionado && (() => {
                        const nameStr = profSeleccionado.nombre || profSeleccionado.nombre_completo || '';
                        const inits = nameStr.substring(0, 2).toUpperCase() || 'Dr';
                        return (
                            <div className="professional-info-badge">
                                <div className="professional-avatar">{inits}</div>
                                <div className="professional-name">{nameStr}</div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Título */}
            <div className="editor-title-container">
                <h1>Horario Semanal</h1>
                <p>Gestiona las horas clínicas del profesional seleccionado para el horario base o rangos personalizados.</p>
            </div>

            {/* Tabs de modo */}
            <div className="editor-config-bar">
                <div className="type-toggle-wrapper">
                    <button
                        className={`type-toggle-btn ${modo === MODO_BASE ? 'active' : ''}`}
                        onClick={() => { setModo(MODO_BASE); setRangoSeleccionado(null); }}
                    >
                        Horario Base
                    </button>
                    <button
                        className={`type-toggle-btn ${modo === MODO_PERSONALIZADO ? 'active' : ''}`}
                        onClick={() => setModo(MODO_PERSONALIZADO)}
                    >
                        Horarios Personalizados
                    </button>
                </div>

                {modo === MODO_BASE && (
                    <div className="date-config-group">
                        <div className="date-input-wrapper">
                            <label>FECHA INICIAL</label>
                            <input
                                type="date"
                                value={fechaInicioBase}
                                onChange={e => setFechaInicioBase(e.target.value)}
                            />
                        </div>
                        <div className="toggles-group">
                            <div className="toggle-item">
                                <span className="toggle-label">Trabaja Festivos</span>
                                <input type="checkbox" id="festivos-toggle" className="toggle-switch-input"
                                    checked={trabajaFestivos}
                                    onChange={e => setTrabajaFestivos(e.target.checked)}
                                />
                                <label htmlFor="festivos-toggle" className="toggle-switch-label"></label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MODO PERSONALIZADO ─── */}
            {modo === MODO_PERSONALIZADO && (
                <div className="rangos-personalizados-panel">
                    <div className="rangos-header">
                        <div className="rangos-title">
                            <span className="rangos-title-icon">📅</span>
                            <div>
                                <div className="rangos-title-text">Rangos Personalizados</div>
                                <div className="rangos-title-sub">Selecciona un rango para editarlo o crea uno nuevo</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={verPasados}
                                    onChange={e => setVerPasados(e.target.checked)}
                                    style={{ accentColor: 'var(--sec-500)', width: 14, height: 14 }}
                                />
                                Ver rangos pasados
                            </label>
                            <button className="btn-nuevo-rango" onClick={() => { setMostrarFormNuevoRango(v => !v); setRangoSeleccionado(null); }}>
                                {mostrarFormNuevoRango ? '✕ Cancelar' : '+ Nuevo Rango'}
                            </button>
                        </div>
                    </div>

                    {/* Formulario nuevo rango */}
                    {mostrarFormNuevoRango && (
                        <div className="nuevo-rango-form" style={{ flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="date-input-wrapper">
                                    <label>FECHA INICIO</label>
                                    <input type="date" value={nuevoRangoInicio}
                                        onChange={e => { setNuevoRangoInicio(e.target.value); setFormError(null); }} />
                                </div>
                                <div className="date-input-wrapper">
                                    <label>FECHA FIN</label>
                                    <input type="date" value={nuevoRangoFin}
                                        onChange={e => { setNuevoRangoFin(e.target.value); setFormError(null); }} />
                                </div>
                                <button className="btn-crear-rango" onClick={handleCrearNuevoRango}>Crear Rango</button>
                            </div>
                            {formError && (
                                <div style={{
                                    display: 'flex', gap: 8, alignItems: 'flex-start',
                                    background: '#fff5f5', border: '1px solid #e53e3e',
                                    color: '#c53030', borderRadius: 8,
                                    padding: '10px 14px', fontSize: 13, lineHeight: 1.5,
                                    whiteSpace: 'pre-line'
                                }}>
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>🚫</span>
                                    <span>{formError}</span>
                                    <button onClick={() => setFormError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#c53030', fontWeight: 700 }}>✕</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lista de rangos */}
                    <div className="rangos-lista">
                        {rangosFiltrados.length === 0 && !mostrarFormNuevoRango && (
                            <div className="rangos-empty">
                                <span>📋</span>
                                <p>
                                    {rangosPersonalizados.length > 0
                                        ? 'Todos los rangos están vencidos. Activa "Ver rangos pasados" para verlos.'
                                        : 'No hay rangos personalizados para este profesional.\nCrea uno nuevo con el botón de arriba.'
                                    }
                                </p>
                            </div>
                        )}
                        {rangosFiltrados.map((rango, idx) => {
                            const isSelected = rangoSeleccionado && rangoSeleccionado.fecha_inicio === rango.fecha_inicio && rangoSeleccionado.fecha_final === rango.fecha_final;
                            const diasConfig = rango.horarios.filter(h => h.hora_inicio_manana || h.hora_inicio_tarde).length;
                            return (
                                <div
                                    key={idx}
                                    className={`rango-chip ${isSelected ? 'rango-chip-selected' : ''}`}
                                    onClick={() => handleSeleccionarRango(rango)}
                                >
                                    <div className="rango-chip-icon">📅</div>
                                    <div className="rango-chip-info">
                                        <div className="rango-chip-dates">
                                            {rango.fecha_inicio} → {rango.fecha_final}
                                        </div>
                                        <div className="rango-chip-sub">{diasConfig} día{diasConfig !== 1 ? 's' : ''} configurado{diasConfig !== 1 ? 's' : ''}</div>
                                    </div>
                                    {isSelected && <div className="rango-chip-badge">EDITANDO</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Grilla semanal */}
            {(modo === MODO_BASE || rangoSeleccionado) && (
                <>
                    {modo === MODO_PERSONALIZADO && rangoSeleccionado && (
                        <div className="rango-editando-banner">
                            <span>✏️ Editando: <strong>Desde {formatFechaLarga(rangoSeleccionado.fecha_inicio)} al {formatFechaLarga(rangoSeleccionado.fecha_final)}</strong></span>
                        </div>
                    )}
                    {isLoadingDatos ? (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '60px 20px',
                            color: 'var(--gray-500)'
                        }}>
                            <div className="loading-spinner" style={{
                                width: 40,
                                height: 40,
                                border: '3px solid var(--gray-200)',
                                borderTopColor: 'var(--pri-500)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginBottom: 16
                            }}></div>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>Cargando datos del profesional...</span>
                        </div>
                    ) : (
                        renderGrilla()
                    )}
                </>
            )}

            <ScheduleEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                dayData={activeDayParams}
                onSave={handleSaveDay}
                profesionalNombre={profSeleccionado ? (profSeleccionado.nombre || profSeleccionado.nombre_completo || '') : ''}
                modoInfo={modo === MODO_BASE
                    ? { tipo: 'base', fechaInicio: fechaInicioBase, fechaFinal: null }
                    : { tipo: 'personalizado', fechaInicio: rangoSeleccionado?.fecha_inicio, fechaFinal: rangoSeleccionado?.fecha_final }
                }
                rangosPersonalizados={rangosPersonalizados}
                trabajaFestivos={trabajaFestivos}
            />
        </div>
    );
}

function ScheduleEditorLayoutWithProvider() {
    return (
        <AppDialogProvider>
            <ScheduleEditorLayout />
        </AppDialogProvider>
    );
}

export default ScheduleEditorLayoutWithProvider;
