CREATE OR REPLACE PACKAGE pkgln_calendarios AS

  -- Procedimientos Principales
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

  PROCEDURE sp_obtener_profesionales(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  -- Procedimientos auxiliares para compatibilidad con la UI actual
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

  PROCEDURE sp_obtener_estados_cita(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  -- Edicion de Horarios
  PROCEDURE sp_editar_horarios(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_guardar_horario_doctor(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_obtener_info_profesional(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_login(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

  PROCEDURE sp_obtener_fecha_actual(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  );

END pkgln_calendarios;
/

