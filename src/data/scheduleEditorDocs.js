/**
 * scheduleEditorDocs.js
 * Documentación de los stored procedures llamados por ScheduleEditorLayout.
 */
export const scheduleEditorDocs = [
    {
        id: 'sp_obtener_profesionales_editor',
        title: 'sp_obtener_profesionales',
        package: 'pkgln_calendarios',
        purpose: 'Retorna todos los profesionales, incluyendo aquellos sin horario activo (incluir_sin_horario: true), para el selector del editor. A diferencia de la vista calendario, aquí se necesitan todos para poder configurarles un horario.',
        inputParams: [
            { name: 'incluir_sin_horario', type: 'BOOLEAN (1/0)', required: false, description: 'Si es true/1, incluye profesionales sin tkr_horarios_doctor activo.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Contiene: { success: boolean, data: Array<{ id, nombre, trabaja_festivos }> }.' },
            { name: 'data[].id', type: 'NUMBER', description: 'ID único del usuario/profesional.' },
            { name: 'data[].trabaja_festivos', type: 'VARCHAR2(1)', description: 'S/N — Indica si el profesional atiende en días festivos (usado para habilitar/deshabilitar el domingo en el editor).' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{ "incluir_sin_horario": true }`,
        outputJson: `{
  "success": true,
  "data": [
    {
      "id": 65,
      "nombre": "65-Rodolfo Vargas",
      "trabaja_festivos": "N"
    },
    {
      "id": 6,
      "nombre": "Carolina Avila",
      "trabaja_festivos": "S"
    }
  ]
}`,
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input   CLOB;
  v_output  CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{ "incluir_sin_horario": 1 }';

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
        id: 'sp_editar_horarios_base',
        title: 'sp_editar_horarios (tipo=base)',
        package: 'pkgln_calendarios',
        purpose: 'Obtiene el horario base del profesional (registros donde fecha_final IS NULL). Retorna los bloques de mañana y tarde para cada día de la semana.',
        inputParams: [
            { name: 'id_usuario', type: 'NUMBER', required: true, description: 'ID del profesional a consultar.' },
            { name: 'tipo', type: 'VARCHAR2', required: true, description: '"base" — filtra registros sin fecha_final.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Objeto con array "horarios" y metadatos.' },
            { name: 'data.horarios[].dia_semana', type: 'VARCHAR2(2)', description: 'Código del día (LU, MA, MI, JU, VI, SA, DO).' },
            { name: 'data.horarios[].hora_inicio_manana', type: 'VARCHAR2(5)', description: 'Formato HH24:MI (ej: 08:00).' },
            { name: 'data.horarios[].hora_fin_manana', type: 'VARCHAR2(5)', description: 'Formato HH24:MI (ej: 12:00).' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{ "id_usuario": 65, "tipo": "base" }`,
        outputJson: `{
  "success": true,
  "data": {
    "horarios": [
      {
        "dia_semana":          "LU",
        "fecha_inicio":        "2026-01-01",
        "fecha_final":         null,
        "hora_inicio_manana":  "08:00",
        "hora_fin_manana":     "12:00",
        "hora_inicio_tarde":   "14:00",
        "hora_fin_tarde":      "17:00"
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
  v_input := '{ "id_usuario": 65, "tipo": "base" }';

  pkgln_calendarios.sp_editar_horarios(
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
        id: 'sp_editar_horarios_temporal',
        title: 'sp_editar_horarios (tipo=temporal)',
        package: 'pkgln_calendarios',
        purpose: 'Obtiene los rangos personalizados del profesional (registros donde fecha_final IS NOT NULL). El frontend agrupa estos registros por el par (fecha_inicio + fecha_final) para mostrar las "fichas" de rango.',
        inputParams: [
            { name: 'id_usuario', type: 'NUMBER', required: true, description: 'ID del profesional.' },
            { name: 'tipo', type: 'VARCHAR2', required: true, description: '"temporal" — filtra por registros con fecha_final definida.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Array de días configurados con sus rangos de fechas.' },
            { name: 'data.horarios[].fecha_inicio', type: 'DATE (YYYY-MM-DD)', description: 'Inicio del rango personalizado.' },
            { name: 'data.horarios[].fecha_final', type: 'DATE (YYYY-MM-DD)', description: 'Fin del rango personalizado.' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{ "id_usuario": 65, "tipo": "temporal" }`,
        outputJson: `{
  "success": true,
  "data": {
    "horarios": [
      {
        "dia_semana":         "MI",
        "fecha_inicio":       "2026-04-01",
        "fecha_final":        "2026-04-30",
        "hora_inicio_manana": "09:00",
        "hora_fin_manana":    "13:00",
        "hora_inicio_tarde":  null,
        "hora_fin_tarde":     null
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
  v_input := '{ "id_usuario": 65, "tipo": "temporal" }';

  pkgln_calendarios.sp_editar_horarios(
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
        id: 'sp_guardar_horario_doctor',
        title: 'sp_guardar_horario_doctor',
        package: 'pkgln_calendarios',
        purpose: 'Inserta o actualiza un bloque de horario semanal en tkr_horarios_doctor para un día específico. Identifica univocamente el registro por id_usuario + dia_semana + fecha_inicio + fecha_final.',
        inputParams: [
            { name: 'id_usuario',          type: 'NUMBER',  required: true,  description: 'ID del profesional.' },
            { name: 'dia_semana',           type: 'VARCHAR2(2)', required: true,  description: 'Código del día: LU, MA, MI, JU, VI, SA, DO.' },
            { name: 'fecha_inicio',         type: 'DATE (YYYY-MM-DD)', required: true,  description: 'Fecha desde la que aplica el horario.' },
            { name: 'fecha_final',          type: 'DATE (YYYY-MM-DD)', required: false, description: 'Fecha de fin. NULL para horario base permanente.' },
            { name: 'hora_inicio_manana',   type: 'VARCHAR2(5)', required: false, description: 'HH24:MI del bloque mañana. Omitir si no labora ese bloque.' },
            { name: 'hora_fin_manana',      type: 'VARCHAR2(5)', required: false, description: 'HH24:MI del bloque mañana.' },
            { name: 'hora_inicio_tarde',    type: 'VARCHAR2(5)', required: false, description: 'HH24:MI del bloque tarde.' },
            { name: 'hora_fin_tarde',       type: 'VARCHAR2(5)', required: false, description: 'HH24:MI del bloque tarde.' },
        ],
        outputParams: [
            { name: 'p_output', type: 'CLOB (JSON)', description: 'Contiene: { success: true }.' },
            { name: 'p_success', type: 'NUMBER', description: '1 = éxito, 0 = error.' },
        ],
        inputJson: `{
  "id_usuario":        65,
  "dia_semana":        "LU",
  "fecha_inicio":      "2026-01-01",
  "fecha_final":       null,
  "hora_inicio_manana":"08:00",
  "hora_fin_manana":   "12:00",
  "hora_inicio_tarde": "14:00",
  "hora_fin_tarde":    "17:00"
}`,
        outputJson: `{ "success": true }`,
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input   CLOB;
  v_output  CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{
    "id_usuario":         65,
    "dia_semana":         "LU",
    "fecha_inicio":       "2026-01-01",
    "fecha_final":        null,
    "hora_inicio_manana": "08:00",
    "hora_fin_manana":    "12:00",
    "hora_inicio_tarde":  "14:00",
    "hora_fin_tarde":     "17:00"
  }';

  pkgln_calendarios.sp_guardar_horario_doctor(
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

