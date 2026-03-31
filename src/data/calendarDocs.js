/**
 * calendarDocs.js
 * Documentación de los stored procedures llamados por CalendarLayout.
 */
export const calendarDocs = [
    {
        id: 'sp_obtener_profesionales',
        title: 'sp_obtener_profesionales',
        package: 'pkgln_calendarios',
        purpose: 'Retorna el maestro de todos los médicos que tienen por lo menos un bloque de horario activo (tkr_horarios_doctor). Se usa al montar la pantalla de calendario para poblar el selector de profesional.',
        inputParams: [
            { name: 'p_input', type: 'CLOB (JSON)', required: true, description: 'JSON vacío {} — no requiere filtros.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'JSON con la lista de profesionales.' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{}`,
        outputJson: `{
  "success": true,
  "data": [
    { "id": 65, "nombre": "65-Rodolfo Vargas" },
    { "id": 6,  "nombre": "Carolina Avila" }
  ]
}`,
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input   CLOB;
  v_output  CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{}';

  pkgln_calendarios.sp_obtener_profesionales(
    p_input   => v_input,
    p_output  => v_output,
    p_success => v_success
  );

  IF v_success = 1 THEN
    DBMS_OUTPUT.PUT_LINE('SUCESO: 1');
    DBMS_OUTPUT.PUT_LINE('DATA: ' || DBMS_LOB.SUBSTR(v_output, 4000, 1));
  ELSE
    DBMS_OUTPUT.PUT_LINE('ERROR: 0');
  END IF;
END;
/`,
    },
    {
        id: 'sp_obtener_citas',
        title: 'sp_obtener_citas',
        package: 'pkgln_calendarios',
        purpose: 'Busca y retorna las citas programadas (tkr_citas) filtrando por id_usuario del médico tratante, entidad y rango de fechas. Se invoca cada vez que se cambia el profesional, la fecha o la entidad en el calendario.',
        inputParams: [
            { name: 'id_usuario', type: 'NUMBER', required: true,  description: 'ID del médico tratante.' },
            { name: 'fecha_inicio', type: 'VARCHAR2 (YYYY-MM-DD)', required: false, description: 'Inicio del rango de fechas a consultar.' },
            { name: 'fecha_fin',   type: 'VARCHAR2 (YYYY-MM-DD)', required: false, description: 'Fin del rango de fechas a consultar.' },
            { name: 'entidad',    type: 'VARCHAR2', required: false, description: 'Código de entidad para filtrar citas. Omitir para traer todas.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Array de citas con todos sus campos.' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{
  "id_usuario": 65,
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-31"
}`,
        outputJson: `{
  "success": true,
  "data": [
    {
      "id": 469,
      "paciente_nombre": "JUAN PEREZ",
      "fecha_inicio": "2026-03-04T16:00:00",
      "fecha_fin":    "2026-03-04T16:20:00",
      "modalidad":   "Presencial",
      "entidad":     "SURA",
      "id_estado":   1,
      "estado_cita": "Confirmada"
    }
  ]
}`,
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input   CLOB;
  v_output  CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{
    "id_usuario":   65,
    "fecha_inicio": "2026-03-01",
    "fecha_fin":    "2026-03-31"
  }';

  pkgln_calendarios.sp_obtener_citas(
    p_input   => v_input,
    p_output  => v_output,
    p_success => v_success
  );

  IF v_success = 1 THEN
    DBMS_OUTPUT.PUT_LINE('SUCESO: 1');
    DBMS_OUTPUT.PUT_LINE('DATA: ' || DBMS_LOB.SUBSTR(v_output, 4000, 1));
  ELSE
    DBMS_OUTPUT.PUT_LINE('ERROR: 0');
  END IF;
END;
/`,
    },
    {
        id: 'sp_obtener_horarios',
        title: 'sp_obtener_horarios',
        package: 'pkgln_calendarios',
        purpose: 'Calcula las franjas operativas (mañana / tarde) y la consolidación de tiempos por día de la semana para un médico específico. Usada para pintar las bandas de disponibilidad en las vistas Day y Week.',
        inputParams: [
            { name: 'id_usuario', type: 'NUMBER', required: true, description: 'ID del médico cuyo horario se desea obtener.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Objeto con array horarios, cada elemento con dia_semana y su lista de franjas.' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{ "id_usuario": 65 }`,
        outputJson: `{
  "success": true,
  "data": {
    "horarios": [
      {
        "dia_semana": "MI",
        "franjas": [
          { "inicio": "08:00", "fin": "11:40", "tipo_atencion": "V" },
          { "inicio": "14:00", "fin": "17:00", "tipo_atencion": "O" }
        ]
      }
    ]
  }
}`,
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input   CLOB;
  v_output  CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{ "id_usuario": 65 }';

  pkgln_calendarios.sp_obtener_horarios(
    p_input   => v_input,
    p_output  => v_output,
    p_success => v_success
  );

  IF v_success = 1 THEN
    DBMS_OUTPUT.PUT_LINE('SUCESO: 1');
    DBMS_OUTPUT.PUT_LINE('DATA: ' || DBMS_LOB.SUBSTR(v_output, 4000, 1));
  ELSE
    DBMS_OUTPUT.PUT_LINE('ERROR: 0');
  END IF;
END;
/`,
    },
    {
        id: 'sp_obtener_estados_cita',
        title: 'sp_obtener_estados_cita',
        package: 'pkgln_calendarios',
        purpose: 'Obtiene el catálogo de estados de cita (tkr_estados_cita) para poblar el filtro de estado en el encabezado del calendario.',
        inputParams: [
            { name: 'p_input', type: 'CLOB (JSON)', required: true, description: 'JSON vacío {}.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Array de estados con id y descripción.' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{}`,
        outputJson: `{
  "success": true,
  "data": [
    { "id": 1, "estado_cita": "Confirmada" },
    { "id": 2, "estado_cita": "Pendiente" },
    { "id": 3, "estado_cita": "Cancelada" }
  ]
}`,
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input   CLOB;
  v_output  CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{}';

  pkgln_calendarios.sp_obtener_estados_cita(
    p_input   => v_input,
    p_output  => v_output,
    p_success => v_success
  );

  IF v_success = 1 THEN
    DBMS_OUTPUT.PUT_LINE('SUCESO: 1');
    DBMS_OUTPUT.PUT_LINE('DATA: ' || DBMS_LOB.SUBSTR(v_output, 4000, 1));
  ELSE
    DBMS_OUTPUT.PUT_LINE('ERROR: 0');
  END IF;
END;
/`,
    },
];
