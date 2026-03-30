export const calendarioService = {
  getProfesionales: async (payload = {}) => {
    try {
      const res = await fetch('/api/profesionales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getFechaActual: async () => {
    try {
      const res = await fetch('/api/fecha-actual');
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getProfesional: async (payload = {}) => {
    try {
      const res = await fetch('/api/profesional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: payload.id_usuario || 1 }) // fallback to 1 temporarily
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getHorarios: async (payload = {}) => {
    try {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getAusencias: async (payload = {}) => {
    try {
      const res = await fetch('/api/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getCitas: async (payload = {}) => {
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getStats: async (payload = {}) => {
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  },

  getEstadosCita: async (payload = {}) => {
    try {
      const res = await fetch('/api/estados-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { throw new Error('Error de conexión con Backend: ' + e.message); }
  }
};
