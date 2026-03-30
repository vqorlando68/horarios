import { useCalendarioContext } from '../context/CalendarioContext';
import { calendarioService } from '../services/calendarioService';

export const useCalendario = () => {
    const context = useCalendarioContext();

    // Custom helper functions
    const nextDateRange = () => {
        const newDate = new Date(context.currentDate);
        if (context.view === 'day') newDate.setDate(newDate.getDate() + 1);
        else if (context.view === 'week') newDate.setDate(newDate.getDate() + 7);
        else if (context.view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        context.setCurrentDate(newDate);
    };

    const prevDateRange = () => {
        const newDate = new Date(context.currentDate);
        if (context.view === 'day') newDate.setDate(newDate.getDate() - 1);
        else if (context.view === 'week') newDate.setDate(newDate.getDate() - 7);
        else if (context.view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        context.setCurrentDate(newDate);
    };

    const setToday = async () => {
        try {
            const res = await calendarioService.getFechaActual();
            if (res && res.data) {
                const dbDate = new Date(res.data);
                dbDate.setHours(0, 0, 0, 0);
                context.setCurrentDate(dbDate);
            } else {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                context.setCurrentDate(d);
            }
        } catch (e) {
            console.error("Error obteniendo fecha actual de BD:", e);
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            context.setCurrentDate(d);
        }
    };

    const getDayAppointments = (dateString) => {
        // Very basic filtering by date string match for Demo
        const datePart = typeof dateString === 'string' ? dateString.split('T')[0] : dateString.toISOString().split('T')[0];
        return context.appointments.filter(app => app.fecha_inicio.startsWith(datePart));
    };


    return {
        ...context,
        nextDateRange,
        prevDateRange,
        setToday,
        getDayAppointments
    };
};
