'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { calendarioService } from '../services/calendarioService';
import { translations } from '../translations';

const CalendarioContext = createContext();

const formatDatePayload = (d) => {
    if (!d) return '';
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
};

export const CalendarioProvider = ({ children }) => {
    // Por defecto inicia en el dia actual y normaliza la hora a 00:00:00 local
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentDate, setCurrentDate] = useState(today); // Default from local, will be updated by DB on mount

    // Al cargar la app, pedir fecha real de f_fecha_actual desde BD 
    useEffect(() => {
        calendarioService.getFechaActual().then(res => {
            if (res && res.data) {
                const dbDate = new Date(res.data);
                dbDate.setHours(0, 0, 0, 0);
                setCurrentDate(dbDate);
            }
        }).catch(err => console.error("Error obteniendo fecha actual de BD:", err));
    }, []);
    const [view, setView] = useState('week'); // day, week, month
    const [appointments, setAppointments] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState('Todas');
    const [absences, setAbsences] = useState([]);

    // Lista de profesionales para el selector
    const [profesionales, setProfesionales] = useState([]);
    const [professional, setProfessional] = useState(null);
    const [horarios, setHorarios] = useState([]); // New state for horarios
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [stats, setStats] = useState(null);
    const [language, setLanguage] = useState('es');
    const [estadosCita, setEstadosCita] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(0);
    const [theme, setTheme] = useState('light');

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            return next;
        });
    };

    const t = (key) => translations[language][key] || key;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Traer la lista de todos los profesionales refrescada para detectar si tienen citas en currentDate
            let profList = profesionales;
            const listRes = await calendarioService.getProfesionales({ 
                fecha_inicio: formatDatePayload(currentDate) 
            });
            if (listRes.data) {
                profList = listRes.data;
                setProfesionales(profList);
            }

            const activeProfReq = professional ? professional.id : (profList.length > 0 ? profList[0].id : null);

            if (activeProfReq === undefined || activeProfReq === null) {
                setLoading(false);
                return;
            }

            // Calculate start and end date for stats and appointments depending on view
            const startDate = new Date(currentDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);

            if (view === 'week') {
                const daysToMonday = (startDate.getDay() || 7) - 1;
                startDate.setDate(startDate.getDate() - daysToMonday);
                endDate.setTime(startDate.getTime());
                endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
            } else if (view === 'month') {
                startDate.setDate(1);
                endDate.setMonth(endDate.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
            } else {
                endDate.setHours(23, 59, 59, 999);
            }

            const profReq = activeProfReq === 0 ? Promise.resolve({ data: { id: 0, nombre: "Todos", configuracion: true } }) : calendarioService.getProfesional({ id_usuario: activeProfReq });
            const horariosReq = calendarioService.getHorarios({ id_usuario: activeProfReq, fecha_inicio: formatDatePayload(currentDate) });
            const apptReq = calendarioService.getCitas({ 
                fecha_inicio: formatDatePayload(startDate) + 'T00:00:00',
                fecha_fin: formatDatePayload(endDate) + 'T23:59:59',
                id_usuario: activeProfReq,
                id_estado_cita: selectedStatus
            });
            const absReq = activeProfReq === 0 ? Promise.resolve({ data: [] }) : calendarioService.getAusencias({ 
                id_usuario: activeProfReq,
                fecha_inicio: formatDatePayload(startDate) + 'T00:00:00',
                fecha_fin: formatDatePayload(endDate) + 'T23:59:59'
            });
            const statsReq = calendarioService.getStats({
                id_usuario: activeProfReq,
                fecha_inicio: formatDatePayload(startDate),
                fecha_fin: formatDatePayload(endDate)
            });
            const estadosReq = calendarioService.getEstadosCita({
                id_usuario: activeProfReq
            });

            const [profRes, horariosRes, apptRes, absRes, statsRes, estadosRes] = await Promise.all([profReq, horariosReq, apptReq, absReq, statsReq, estadosReq]);

            if (profRes && profRes.data && !profRes.data.configuracion) {
                setError("Profesional sin horario configurado");
            }

            // Si no habia profesional seleccionado, actualizar el estado para que el Select del Layout se pinte
            if (!professional && profRes.data) {
                setProfessional(profRes.data);
            } else if (professional && profRes.data && professional.id !== profRes.data.id) {
                setProfessional(profRes.data);
            }

            setHorarios(horariosRes.data.horarios || []); // Set horarios
            setAppointments(apptRes.data);
            setAbsences(absRes.data);
            setStats(statsRes.data);
            setEstadosCita(estadosRes.data || []);

        } catch (err) {
            setError(err.message || 'Error al cargar datos del calendario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate, view, professional, selectedStatus]); // Recargar si cambia el estado seleccionado

    const openAppointmentDetails = (appointment) => {
        setSelectedAppointment(appointment);
    };

    const closeAppointmentDetails = () => {
        setSelectedAppointment(null);
    };

    const resetToToday = () => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        setCurrentDate(t);
        setView('month');  // Default a Mes al navegar a Horarios
        setProfessional({ id: 0, nombre: 'Todos' });
        setSelectedStatus(0);
        setSelectedEntity('Todas');
    };

    const entidadesList = ['Todas', ...new Set(appointments.map(a => a.entidad).filter(Boolean))].sort();
    const filteredAppointments = selectedEntity === 'Todas' ? appointments : appointments.filter(a => a.entidad === selectedEntity);

    return (
        <CalendarioContext.Provider
            value={{
                currentDate,
                setCurrentDate,
                view,
                setView,
                horarios,
                appointments: filteredAppointments,
                entidadesList,
                selectedEntity,
                setSelectedEntity,
                absences,
                stats,
                profesionales,
                professional,
                setProfessional,
                loading,
                error,
                selectedAppointment,
                openAppointmentDetails,
                closeAppointmentDetails,
                language,
                setLanguage,
                estadosCita,
                selectedStatus,
                setSelectedStatus,
                theme,
                toggleTheme,
                resetToToday,
                t
            }}
        >
            {children}
        </CalendarioContext.Provider>
    );
};

export const useCalendarioContext = () => {
    const context = useContext(CalendarioContext);
    if (!context) {
        throw new Error('useCalendarioContext debe ser usado dentro de CalendarioProvider');
    }
    return context;
};
