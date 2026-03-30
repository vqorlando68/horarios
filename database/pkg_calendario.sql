CREATE OR REPLACE PACKAGE pkg_calendario AS

  -- Procedimientos Obligatorios
  PROCEDURE sp_obtener_horarios(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_obtener_ausencias(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_obtener_citas(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_obtener_profesional(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_generar_slots_dia(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_calcular_disponibilidad(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_resumen_estadistico(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

END pkg_calendario;
/

CREATE OR REPLACE PACKAGE BODY pkg_calendario AS

  PROCEDURE sp_obtener_horarios(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    -- Lógica simulada: Retorna la configuración de horario del profesional
    -- En producción, esto consultaría las tablas reales considerando fecha_inicio / fecha_final
    -- y los días de la semana válidos (LU, MA, MI, JU, VI, SA, DO)

    p_output := '{
      "success": true,
      "data": {
        "profesional_id": 1,
        "configuracion": true,
        "vigencia": {
          "fecha_inicio": "2023-01-01",
          "fecha_final": "2030-12-31"
        },
        "horarios": [
          { "dia_semana": "LU", "franjas": [ {"inicio": "08:00", "fin": "10:00", "franja": "V"}, {"inicio": "10:00", "fin": "12:00", "franja": "O"} ] },
          { "dia_semana": "MA", "franjas": [ {"inicio": "08:00", "fin": "12:00", "franja": null} ] },
          { "dia_semana": "MI", "franjas": [ {"inicio": "08:00", "fin": "12:00", "franja": "V"} ] },
          { "dia_semana": "JU", "franjas": [ {"inicio": "08:00", "fin": "12:00", "franja": null}, {"inicio": "14:00", "fin": "18:00", "franja": "O"} ] },
          { "dia_semana": "VI", "franjas": [ {"inicio": "09:00", "fin": "17:00", "franja": null} ] }
        ]
      }
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_obtener_horarios;

  PROCEDURE sp_obtener_ausencias(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    -- Simula la extracción de ausencias registradas
    p_output := '{
      "success": true,
      "data": [
        {
          "id": 101,
          "fecha_inicial": "2023-10-25T08:00:00",
          "fecha_final": "2023-10-25T12:00:00",
          "motivo": "Clinic Prep",
          "estado": "AUSENTE"
        }
      ]
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_obtener_ausencias;

  PROCEDURE sp_obtener_citas(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    -- Retorna las citas cruzadas. Los estados deben ser uno de los permitidos.
    p_output := '{
      "success": true,
      "data": [
        {
          "id": "HS-9021",
          "paciente_nombre": "Carlos Eduardo Mendoza",
          "paciente_doc_tipo": "CC",
          "paciente_doc_num": "1.023.456.789",
          "paciente_fecha_nac": "1985-05-15",
          "paciente_sexo": "Male",
          "paciente_telefono": "+57 300 123 4567",
          "paciente_direccion": "Calle 100 # 15-20, Bogotá",
          "fecha_inicio": "2023-10-26T09:00:00",
          "fecha_fin": "2023-10-26T09:30:00",
          "motivo": "Post-operative follow-up",
          "origen": "Colmedica - Emergency",
          "entidad": "MedPlus",
          "estado": "Atendida",
          "bloqueado": false,
          "color_hex": "#01ae6c",
          "modalidad": "Presencial"
        },
        {
          "id": "HS-9022",
          "paciente_nombre": "Juan Pérez García",
          "paciente_doc_tipo": "CC",
          "paciente_doc_num": "1.023.456.790",
          "paciente_fecha_nac": "1990-01-01",
          "paciente_sexo": "Male",
          "paciente_telefono": "3000000000",
          "paciente_direccion": "Cra 7 # 10-20, Bogotá",
          "fecha_inicio": "2023-10-23T08:30:00",
          "fecha_fin": "2023-10-23T09:00:00",
          "motivo": "General Checkup",
          "origen": "SURA EPS",
          "entidad": "SURA EPS",
          "estado": "Pendiente",
          "bloqueado": false,
          "color_hex": "#00aae1",
          "modalidad": "Virtual Visit"
        }
      ]
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_obtener_citas;

  PROCEDURE sp_obtener_profesional(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    p_output := '{
      "success": true,
      "data": {
        "id": 1,
        "nombre": "Dr. Sarah Jenkins",
        "especialidad": "General Surgery",
        "configuracion": true
      }
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_obtener_profesional;

  PROCEDURE sp_generar_slots_dia(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    -- Debería calcular slots de 30 mins dinámicamente.
    -- Retornamos los slots base para la UI en formato simplificado.
    p_output := '{
      "success": true,
      "data": [
        "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
      ]
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_generar_slots_dia;

  PROCEDURE sp_calcular_disponibilidad(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    -- Motor principal: Cruzar franjas maestras, con citas y con ausencias.
    -- (Lógica de cruce omitida para el mock, pero la UI confía en este endpoint)
    p_output := '{
      "success": true,
      "data": { }
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_calcular_disponibilidad;

  PROCEDURE sp_resumen_estadistico(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    -- Recibe parametros desde la UI: 
    -- { id_usuario: X, fecha_inicio: Y, fecha_fin: Z }
    p_output := '{
      "success": true,
      "data": {
        "total_citas": 82,
        "pendientes": 12,
        "atendidas": 70
      }
    }';
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := JSON_OBJECT('success' VALUE false, 'error' VALUE SQLERRM);
  END sp_resumen_estadistico;

END pkg_calendario;
/
