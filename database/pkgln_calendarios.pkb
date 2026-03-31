CREATE OR REPLACE PACKAGE BODY pkgln_calendarios AS

  PROCEDURE sp_obtener_horarios(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_id_usuario NUMBER; 
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_fecha_ref DATE;
    v_clob CLOB;
    v_primero BOOLEAN := TRUE;
    v_hay_manana BOOLEAN;
    v_hay_tarde BOOLEAN;
    v_fecha_inicio_str VARCHAR2(100);
  BEGIN
    p_success := 1;
    BEGIN
       SELECT JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER) INTO v_id_usuario FROM DUAL;
       SELECT JSON_VALUE(p_input, '$.fecha_inicio') INTO v_fecha_inicio_str FROM DUAL;
       
       IF v_fecha_inicio_str IS NOT NULL THEN
         v_fecha_ref := TO_DATE(SUBSTR(v_fecha_inicio_str, 1, 10), 'YYYY-MM-DD');
       ELSE
         v_fecha_ref := TRUNC(f_fecha_actual);
       END IF;
    EXCEPTION
       WHEN OTHERS THEN 
         v_id_usuario := 1;
         v_fecha_ref := TRUNC(f_fecha_actual);
    END;
    
    IF v_id_usuario IS NULL THEN v_id_usuario := 1; END IF;
    
    v_fecha_inicio := v_fecha_ref;
    v_fecha_fin := v_fecha_ref + 7;

    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":{"profesional_id":' || v_id_usuario || ',"configuracion":true,"vigencia":{"fecha_inicio":"' || TO_CHAR(v_fecha_inicio, 'YYYY-MM-DD') || '","fecha_final":"' || TO_CHAR(v_fecha_fin, 'YYYY-MM-DD') || '"},"horarios":[');
    
    -- Lógica corregida: 
    -- 1. Identificamos los horarios válidos para v_fecha_ref.
    -- 2. Para un mismo día de la semana, si existen horarios específicos (FECHA_FINAL no nula), 
    --    estos tienen prioridad sobre el horario base (FECHA_FINAL nula).
    FOR r IN (
       WITH valid_horarios AS (
         SELECT h.*,
                CASE WHEN h.fecha_final IS NOT NULL THEN 1 ELSE 2 END as priority
         FROM tkr_horarios_doctor h
         WHERE h.id_usuario = v_id_usuario
           AND (
             (h.fecha_final IS NULL AND TRUNC(h.fecha_inicio) <= TRUNC(v_fecha_ref)) OR
             (TRUNC(v_fecha_ref) BETWEEN TRUNC(h.fecha_inicio) AND TRUNC(h.fecha_final))
           )
       ),
       best_priority_per_day AS (
         SELECT dia_semana, MIN(priority) as min_priority
         FROM valid_horarios
         GROUP BY dia_semana
       )
       SELECT v.dia_semana,
              CASE WHEN v.hora_inicio_manana IS NOT NULL THEN TO_CHAR(TO_DATE(v.hora_inicio_manana, 'HH:MI AM'), 'HH24:MI') ELSE NULL END AS hora_inicio_manana,
              CASE WHEN v.hora_fin_manana IS NOT NULL THEN TO_CHAR(TO_DATE(v.hora_fin_manana, 'HH:MI AM'), 'HH24:MI') ELSE NULL END AS hora_fin_manana,
              CASE WHEN v.hora_inicio_tarde IS NOT NULL THEN TO_CHAR(TO_DATE(v.hora_inicio_tarde, 'HH:MI AM'), 'HH24:MI') ELSE NULL END AS hora_inicio_tarde,
              CASE WHEN v.hora_fin_tarde IS NOT NULL THEN TO_CHAR(TO_DATE(v.hora_fin_tarde, 'HH:MI AM'), 'HH24:MI') ELSE NULL END AS hora_fin_tarde,
              v.tipo_atencion
       FROM valid_horarios v
       JOIN best_priority_per_day b ON v.dia_semana = b.dia_semana AND v.priority = b.min_priority
    ) LOOP
       -- Omitir celdas vacías (si el horario base o específico tiene todas las horas nulas, no lo enviamos)
       IF r.hora_inicio_manana IS NOT NULL OR r.hora_inicio_tarde IS NOT NULL THEN
           IF NOT v_primero THEN
             DBMS_LOB.APPEND(v_clob, ',');
           END IF;
           v_primero := FALSE;
           
           DBMS_LOB.APPEND(v_clob, '{"dia_semana":"' || r.dia_semana || '","franjas":[');
           
           v_hay_manana := (r.hora_inicio_manana IS NOT NULL AND r.hora_fin_manana IS NOT NULL);
           v_hay_tarde := (r.hora_inicio_tarde IS NOT NULL AND r.hora_fin_tarde IS NOT NULL);
           
           IF v_hay_manana THEN
             DBMS_LOB.APPEND(v_clob, '{"inicio":"' || r.hora_inicio_manana || '","fin":"' || r.hora_fin_manana || '","tipo_atencion":');
             IF r.tipo_atencion IS NULL THEN DBMS_LOB.APPEND(v_clob, 'null'); ELSE DBMS_LOB.APPEND(v_clob, '"' || r.tipo_atencion || '"'); END IF;
             DBMS_LOB.APPEND(v_clob, '}');
             IF v_hay_tarde THEN DBMS_LOB.APPEND(v_clob, ','); END IF;
           END IF;
           
           IF v_hay_tarde THEN
             DBMS_LOB.APPEND(v_clob, '{"inicio":"' || r.hora_inicio_tarde || '","fin":"' || r.hora_fin_tarde || '","tipo_atencion":');
             IF r.tipo_atencion IS NULL THEN DBMS_LOB.APPEND(v_clob, 'null'); ELSE DBMS_LOB.APPEND(v_clob, '"' || r.tipo_atencion || '"'); END IF;
             DBMS_LOB.APPEND(v_clob, '}');
           END IF;
           
           DBMS_LOB.APPEND(v_clob, ']}');
       END IF;
    END LOOP;
    
    DBMS_LOB.APPEND(v_clob, ']}}');
    p_output := v_clob;
    
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_horarios;

  PROCEDURE sp_obtener_ausencias(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_id_usuario NUMBER;
    v_fecha_inicio_str VARCHAR2(100);
    v_fecha_fin_str VARCHAR2(100);
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_clob CLOB;
    v_primero BOOLEAN := TRUE;
  BEGIN
    p_success := 1;

    BEGIN
       SELECT JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER) INTO v_id_usuario FROM DUAL;
       SELECT JSON_VALUE(p_input, '$.fecha_inicio') INTO v_fecha_inicio_str FROM DUAL;
       SELECT JSON_VALUE(p_input, '$.fecha_fin') INTO v_fecha_fin_str FROM DUAL;
       
       IF v_fecha_inicio_str IS NOT NULL THEN
         v_fecha_inicio := TO_DATE(SUBSTR(v_fecha_inicio_str, 1, 19), 'YYYY-MM-DD"T"HH24:MI:SS');
       ELSE
         v_fecha_inicio := TRUNC(f_fecha_actual);
       END IF;
       
       IF v_fecha_fin_str IS NOT NULL THEN
         v_fecha_fin := TO_DATE(SUBSTR(v_fecha_fin_str, 1, 19), 'YYYY-MM-DD"T"HH24:MI:SS');
       ELSE
         v_fecha_fin := v_fecha_inicio + 30; -- range for month view
       END IF;
    EXCEPTION
       WHEN OTHERS THEN v_id_usuario := 1; v_fecha_inicio := TRUNC(f_fecha_actual); v_fecha_fin := TRUNC(f_fecha_actual) + 30;
    END;
    IF v_id_usuario IS NULL THEN v_id_usuario := 1; END IF;

    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":[');
    
    FOR r IN (
       SELECT a.id, a.fecha_inicial, a.fecha_final
       FROM tkr_ausencias_profesional a
       WHERE (a.id_usuario = v_id_usuario OR v_id_usuario = 0)
         AND TRUNC(a.fecha_inicial) <= TRUNC(v_fecha_fin)
         AND TRUNC(a.fecha_final) >= TRUNC(v_fecha_inicio)
    ) LOOP
       IF NOT v_primero THEN 
         DBMS_LOB.APPEND(v_clob, ','); 
       END IF;
       v_primero := FALSE;
       DBMS_LOB.APPEND(v_clob, '{"id":' || r.id || ',"fecha_inicial":"' || TO_CHAR(r.fecha_inicial, 'YYYY-MM-DD"T"HH24:MI:SS') || '","fecha_final":"' || TO_CHAR(r.fecha_final, 'YYYY-MM-DD"T"HH24:MI:SS') || '","motivo":"Ausencia Registrada","estado":"AUSENTE"}');
    END LOOP;
    
    DBMS_LOB.APPEND(v_clob, ']}');
    p_output := v_clob;
  EXCEPTION
    WHEN OTHERS THEN 
      p_success := 0; 
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_ausencias;

  PROCEDURE sp_obtener_citas(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_id_usuario NUMBER;
    v_id_estado_cita NUMBER;
    v_fecha_inicio_str VARCHAR2(100);
    v_fecha_fin_str VARCHAR2(100);
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_clob CLOB;
    v_primero BOOLEAN := TRUE;
  BEGIN
    p_success := 1;

    BEGIN
       SELECT JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER) INTO v_id_usuario FROM DUAL;
       SELECT JSON_VALUE(p_input, '$.id_estado_cita' RETURNING NUMBER) INTO v_id_estado_cita FROM DUAL;
       SELECT JSON_VALUE(p_input, '$.fecha_inicio') INTO v_fecha_inicio_str FROM DUAL;
       SELECT JSON_VALUE(p_input, '$.fecha_fin') INTO v_fecha_fin_str FROM DUAL;
       
       IF v_fecha_inicio_str IS NOT NULL THEN
         v_fecha_inicio := TO_DATE(SUBSTR(v_fecha_inicio_str, 1, 19), 'YYYY-MM-DD"T"HH24:MI:SS');
       ELSE
         v_fecha_inicio := TRUNC(f_fecha_actual);
       END IF;
       
       IF v_fecha_fin_str IS NOT NULL THEN
         v_fecha_fin := TO_DATE(SUBSTR(v_fecha_fin_str, 1, 19), 'YYYY-MM-DD"T"HH24:MI:SS');
       ELSE
         v_fecha_fin := v_fecha_inicio + 1;
       END IF;
    EXCEPTION
       WHEN OTHERS THEN v_id_usuario := 1; v_id_estado_cita := 0; v_fecha_inicio := TRUNC(f_fecha_actual); v_fecha_fin := TRUNC(f_fecha_actual) + 1;
    END;
    IF v_id_usuario IS NULL THEN v_id_usuario := 1; END IF;
    IF v_id_estado_cita IS NULL THEN v_id_estado_cita := 0; END IF;

    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":[');
    
    FOR r IN (
       SELECT c.id_hexadecimal,
              c.fecha_inicio_cita,
              c.fecha_final_cita,
              t.abreviatura,
              u.identificacion,
              TO_CHAR(u.fecha_nacimiento,'dd/mm/yyyy') AS fecha_nacimiento,
              REGEXP_REPLACE(REPLACE(REPLACE(c.descripcion, '"', '\"'), CHR(10), '\n'), '[[:cntrl:]]', '') AS motivo_consulta,
              REGEXP_REPLACE(REPLACE(REPLACE(u.nombres || ' ' || u.apellidos, '"', '\"'), CHR(10), '\n'), '[[:cntrl:]]', '') AS paciente_nombre,
              REGEXP_REPLACE(REPLACE(REPLACE(u.telefono, '"', '\"'), CHR(10), '\n'), '[[:cntrl:]]', '') AS paciente_telefono,
              REGEXP_REPLACE(REPLACE(REPLACE(u.direccion, '"', '\"'), CHR(10), '\n'), '[[:cntrl:]]', '') AS paciente_direccion,
              e.estado_cita AS estado,
              c.codigo_zoom, 
              REGEXP_REPLACE(REPLACE(REPLACE(en.nombre_entidad, '"', '\"'), CHR(10), '\n'), '[[:cntrl:]]', '') AS nombre_entidad,
              pkgcn_citas.f_link_info_cita(c.id) AS link_detalle_atencion,
              REGEXP_REPLACE(REPLACE(REPLACE((SELECT nombres || ' ' || apellidos FROM tkr_usuarios WHERE id = pkgca_tkr_cita_usuarios.f_profesional_cita(c.id)), '"', '\"'), CHR(10), '\n'), '[[:cntrl:]]', '') AS profesional_nombre
         FROM tkr_citas c, tkr_usuarios u, tkr_estados_cita e, tkr_tipos_identificacion t, tkr_entidades en
        WHERE c.id_usuario = u.id
          AND u.id_tipo_identificacion = t.id
          AND c.id_estado_cita = e.id
          AND (pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = v_id_usuario OR v_id_usuario = 0)
          AND (c.id_estado_cita = v_id_estado_cita OR v_id_estado_cita = 0)
          AND NVL(c.id_estado_cita, 0) != 4
          AND c.id_entidad = en.id (+)
          AND TRUNC(c.fecha_inicio_cita) BETWEEN TRUNC(v_fecha_inicio) AND TRUNC(v_fecha_fin)
    ) LOOP
       IF NOT v_primero THEN 
         DBMS_LOB.APPEND(v_clob, ','); 
       END IF;
       v_primero := FALSE;
       
       DBMS_LOB.APPEND(v_clob, '{"id":"' || NVL(r.id_hexadecimal, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"paciente_nombre":"' || NVL(r.paciente_nombre, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"profesional_nombre":"' || NVL(r.profesional_nombre, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"paciente_doc_tipo":"' || NVL(r.abreviatura, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"paciente_doc_num":"' || NVL(r.identificacion, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"paciente_fecha_nac":"' || NVL(r.fecha_nacimiento, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"paciente_telefono":"' || NVL(r.paciente_telefono, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"paciente_direccion":"' || NVL(r.paciente_direccion, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"fecha_inicio":"' || TO_CHAR(r.fecha_inicio_cita, 'YYYY-MM-DD"T"HH24:MI:SS') || '",');
       DBMS_LOB.APPEND(v_clob, '"fecha_fin":"' || TO_CHAR(r.fecha_final_cita, 'YYYY-MM-DD"T"HH24:MI:SS') || '",');
       DBMS_LOB.APPEND(v_clob, '"estado":"' || NVL(r.estado, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"codigo_zoom":"' || NVL(r.codigo_zoom, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"color_hex":"#00aae1",');
       DBMS_LOB.APPEND(v_clob, '"modalidad":"Presencial",');
       DBMS_LOB.APPEND(v_clob, '"motivo":"' || REPLACE(NVL(r.motivo_consulta, ''), '\', '\\') || '",');
       DBMS_LOB.APPEND(v_clob, '"entidad":"' || NVL(r.nombre_entidad, '') || '",');
       DBMS_LOB.APPEND(v_clob, '"link_detalle":"' || NVL(r.link_detalle_atencion, '') || '"}');
    END LOOP;
    
    DBMS_LOB.APPEND(v_clob, ']}');
    p_output := v_clob;
  EXCEPTION
    WHEN OTHERS THEN 
      p_success := 0; 
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_citas;

  PROCEDURE sp_obtener_profesional(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_id_usuario NUMBER;
    v_clob CLOB;
    v_encontrado BOOLEAN := FALSE;
  BEGIN
    p_success := 1;
    
    BEGIN
       v_id_usuario := JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER);
    EXCEPTION
       WHEN OTHERS THEN v_id_usuario := NULL;
    END;
    
    IF v_id_usuario IS NULL THEN
       p_output := '{"success":false,"error":"Falta el parámetro id_usuario"}';
       p_success := 0;
       RETURN;
    END IF;
    
    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    FOR r IN (
       SELECT u.id, u.nombres || ' ' || u.apellidos as nombre
       FROM tkr_usuarios u
       WHERE u.id = v_id_usuario AND u.id_rol = 4 AND id_estado_usuario = 1 
    ) LOOP
       DBMS_LOB.APPEND(v_clob, '{"success":true,"data":{"id":' || r.id || ',"nombre":"' || REPLACE(r.nombre, '"', '\"') || '","especialidad":"General","configuracion":true}}');
       p_output := v_clob;
       v_encontrado := TRUE;
       EXIT;
    END LOOP;
    
    IF NOT v_encontrado THEN 
      p_output := '{"success":true,"data":null}'; 
    END IF;
  EXCEPTION
    WHEN OTHERS THEN 
      p_success := 0; 
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_profesional;

  PROCEDURE sp_obtener_profesionales(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_clob CLOB;
    v_primero BOOLEAN := TRUE;
    v_fecha DATE;
    v_fecha_str VARCHAR2(100);
    v_incluir_sin_horario VARCHAR2(10);
  BEGIN
    p_success := 1;
    
    BEGIN
       SELECT JSON_VALUE(p_input, '$.fecha_inicio'), JSON_VALUE(p_input, '$.incluir_sin_horario')
       INTO v_fecha_str, v_incluir_sin_horario
       FROM DUAL;
       IF v_fecha_str IS NOT NULL THEN
         v_fecha := TO_DATE(SUBSTR(v_fecha_str, 1, 10), 'YYYY-MM-DD');
       ELSE
         v_fecha := TRUNC(f_fecha_actual);
       END IF;
    EXCEPTION
       WHEN OTHERS THEN 
         v_fecha := TRUNC(f_fecha_actual);
         v_incluir_sin_horario := NULL;
    END;

    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":[');
    
    IF UPPER(NVL(v_incluir_sin_horario, 'FALSE')) IN ('TRUE', '1', 'S') THEN
       FOR r IN (
          SELECT u.id, u.nombres || ' ' || u.apellidos as nombre,
                 CASE WHEN EXISTS (SELECT 1 FROM tkr_citas c WHERE pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = u.id AND TRUNC(c.fecha_inicio_cita) = TRUNC(v_fecha) AND NVL(c.id_estado_cita, 0) != 4) THEN 'true' ELSE 'false' END AS tiene_citas,
                 (SELECT COUNT(1) FROM tkr_citas c WHERE pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = u.id AND TRUNC(c.fecha_inicio_cita) = TRUNC(v_fecha) AND NVL(c.id_estado_cita, 0) != 4) AS cantidad_citas,
                 NVL(u.trabaja_festivos, 'N') AS trabaja_festivos
          FROM tkr_usuarios u
          WHERE id_estado_usuario = 1 AND (u.id_rol = 4 OR EXISTS (SELECT 1 FROM tkr_roles_usuario ru WHERE u.id = ru.id_usuario AND ru.id_rol = 4)) 
       ) LOOP
          IF NOT v_primero THEN 
            DBMS_LOB.APPEND(v_clob, ','); 
          END IF;
          v_primero := FALSE;
          DBMS_LOB.APPEND(v_clob, '{"id":' || r.id || ',"nombre":"' || REPLACE(r.nombre, '"', '\"') || '","tiene_citas":' || r.tiene_citas || ',"cantidad_citas":' || r.cantidad_citas || ',"trabaja_festivos":"' || NVL(r.trabaja_festivos, 'N') || '"}');
       END LOOP;
    ELSE
       FOR r IN (
          SELECT u.id, u.nombres || ' ' || u.apellidos as nombre,
                 CASE WHEN EXISTS (SELECT 1 FROM tkr_citas c WHERE pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = u.id AND TRUNC(c.fecha_inicio_cita) = TRUNC(v_fecha) AND NVL(c.id_estado_cita, 0) != 4) THEN 'true' ELSE 'false' END AS tiene_citas,
                 (SELECT COUNT(1) FROM tkr_citas c WHERE pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = u.id AND TRUNC(c.fecha_inicio_cita) = TRUNC(v_fecha) AND NVL(c.id_estado_cita, 0) != 4) AS cantidad_citas,
                 NVL(u.trabaja_festivos, 'N') AS trabaja_festivos
          FROM tkr_usuarios u
          WHERE EXISTS (SELECT 1 FROM tkr_horarios_doctor h WHERE h.id_usuario = u.id)
       ) LOOP
          IF NOT v_primero THEN 
            DBMS_LOB.APPEND(v_clob, ','); 
          END IF;
          v_primero := FALSE;
          DBMS_LOB.APPEND(v_clob, '{"id":' || r.id || ',"nombre":"' || REPLACE(r.nombre, '"', '\"') || '","tiene_citas":' || r.tiene_citas || ',"cantidad_citas":' || r.cantidad_citas || ',"trabaja_festivos":"' || NVL(r.trabaja_festivos, 'N') || '"}');
       END LOOP;
    END IF;
    
    DBMS_LOB.APPEND(v_clob, ']}');
    p_output := v_clob;
  EXCEPTION
    WHEN OTHERS THEN 
      p_success := 0; 
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_profesionales;

  PROCEDURE sp_generar_slots_dia(p_input IN CLOB, p_output OUT CLOB, p_success OUT NUMBER) AS
  BEGIN
    p_success := 1;
    p_output := '{"success":true,"data":["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"]}';
  END sp_generar_slots_dia;

  PROCEDURE sp_calcular_disponibilidad(p_input IN CLOB, p_output OUT CLOB, p_success OUT NUMBER) AS
  BEGIN
    p_success := 1; p_output := '{"success":true,"data":{}}';
  END sp_calcular_disponibilidad;

  PROCEDURE sp_resumen_estadistico(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_id_usuario NUMBER;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_total NUMBER := 0;
    v_atendidas NUMBER := 0;
    v_pendientes NUMBER := 0;
    v_clob CLOB;
  BEGIN
    p_success := 1;

    BEGIN
       SELECT JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER) INTO v_id_usuario FROM DUAL;
    EXCEPTION
       WHEN OTHERS THEN v_id_usuario := 1;
    END;
    IF v_id_usuario IS NULL THEN v_id_usuario := 1; END IF;

    BEGIN
       SELECT TO_DATE(SUBSTR(JSON_VALUE(p_input, '$.fecha_inicio'), 1, 10), 'YYYY-MM-DD') INTO v_fecha_inicio FROM DUAL;
       SELECT TO_DATE(SUBSTR(JSON_VALUE(p_input, '$.fecha_fin'), 1, 10), 'YYYY-MM-DD') INTO v_fecha_fin FROM DUAL;
    EXCEPTION
       WHEN OTHERS THEN 
         v_fecha_inicio := TRUNC(f_fecha_actual);
         v_fecha_fin := TRUNC(f_fecha_actual);
    END;
    IF v_fecha_inicio IS NULL THEN v_fecha_inicio := TRUNC(f_fecha_actual); END IF;
    IF v_fecha_fin IS NULL THEN v_fecha_fin := TRUNC(f_fecha_actual); END IF;

    SELECT 
      COUNT(*),
      COUNT(CASE WHEN c.id_estado_cita = 3 THEN 1 END),
      COUNT(CASE WHEN NVL(c.id_estado_cita, 0) != 3 THEN 1 END)
    INTO v_total, v_atendidas, v_pendientes
    FROM tkr_citas c
    WHERE (pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = v_id_usuario OR v_id_usuario = 0)
      AND TRUNC(c.fecha_inicio_cita) >= TRUNC(v_fecha_inicio)
      AND TRUNC(c.fecha_inicio_cita) <= TRUNC(v_fecha_fin)
      AND NVL(c.id_estado_cita, 0) != 4;

    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":{');
    DBMS_LOB.APPEND(v_clob, '"total_citas":' || v_total || ',');
    DBMS_LOB.APPEND(v_clob, '"atendidas":' || v_atendidas || ',');
    DBMS_LOB.APPEND(v_clob, '"pendientes":' || v_pendientes);
    DBMS_LOB.APPEND(v_clob, '}}');
    
    p_output := v_clob;
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_resumen_estadistico;

  PROCEDURE sp_obtener_estados_cita(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
    v_id_usuario NUMBER;
    v_clob CLOB;
    v_primero BOOLEAN := TRUE;
  BEGIN
    p_success := 1;
    v_id_usuario := JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER);
    IF v_id_usuario IS NULL THEN v_id_usuario := 0; END IF;

    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);
    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":[');

    FOR r IN (
        SELECT DISTINCT e.id, e.estado_cita
        FROM tkr_estados_cita e
        JOIN tkr_citas c ON c.id_estado_cita = e.id
        WHERE (pkgca_tkr_cita_usuarios.f_profesional_cita(c.id) = v_id_usuario OR v_id_usuario = 0)
          AND NVL(c.id_estado_cita, 0) != 4 -- Omit irrelevant states
        ORDER BY e.estado_cita
    ) LOOP
        IF NOT v_primero THEN DBMS_LOB.APPEND(v_clob, ','); END IF;
        v_primero := FALSE;
        DBMS_LOB.APPEND(v_clob, '{"id":' || r.id || ',"estado_cita":"' || r.estado_cita || '"}');
    END LOOP;

    DBMS_LOB.APPEND(v_clob, ']}');
    p_output := v_clob;

  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_estados_cita;

  -- ═══════════════════════════════════════════════════════════
  --  EDICION DE HORARIOS
  -- ═══════════════════════════════════════════════════════════

  PROCEDURE sp_editar_horarios(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) IS
    v_id_usuario   NUMBER;
    v_tipo         VARCHAR2(10); -- 'base' or 'temporal'
    v_clob         CLOB;
    v_primero      BOOLEAN := TRUE;
  BEGIN
    p_success := 1;
    DBMS_LOB.CREATETEMPORARY(v_clob, TRUE);

    v_id_usuario := JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER);
    v_tipo       := NVL(JSON_VALUE(p_input, '$.tipo'), 'base');

    DBMS_LOB.APPEND(v_clob, '{"success":true,"data":[');

    FOR r IN (
      SELECT h.id,
             h.id_usuario,
             h.dia_semana,
             NVL(h.hora_inicio_manana, '') AS hora_inicio_manana,
             NVL(h.hora_fin_manana, '')    AS hora_fin_manana,
             NVL(h.hora_inicio_tarde, '')  AS hora_inicio_tarde,
             NVL(h.hora_fin_tarde, '')     AS hora_fin_tarde,
             TO_CHAR(h.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
             TO_CHAR(h.fecha_final, 'YYYY-MM-DD')  AS fecha_final
        FROM tkr_horarios_doctor h
       WHERE h.id_usuario = v_id_usuario
         AND (
               (v_tipo = 'base' AND h.fecha_final IS NULL)
               OR
               (v_tipo = 'temporal' AND h.fecha_final IS NOT NULL)
             )
       ORDER BY DECODE(h.dia_semana, 'LU',1,'MA',2,'MI',3,'JU',4,'VI',5,'SA',6,'DO',7,8),
                h.fecha_inicio NULLS FIRST
    ) LOOP
      IF NOT v_primero THEN DBMS_LOB.APPEND(v_clob, ','); END IF;
      v_primero := FALSE;
      DBMS_LOB.APPEND(v_clob,
        '{"id":'                || r.id ||
        ',"id_usuario":'        || r.id_usuario ||
        ',"dia_semana":"'       || r.dia_semana || '"' ||
        ',"hora_inicio_manana":"' || r.hora_inicio_manana || '"' ||
        ',"hora_fin_manana":"'    || r.hora_fin_manana || '"' ||
        ',"hora_inicio_tarde":"'  || r.hora_inicio_tarde || '"' ||
        ',"hora_fin_tarde":"'     || r.hora_fin_tarde || '"' ||
        ',"fecha_inicio":'      || CASE WHEN r.fecha_inicio IS NOT NULL THEN '"' || r.fecha_inicio || '"' ELSE 'null' END ||
        ',"fecha_final":'       || CASE WHEN r.fecha_final IS NOT NULL THEN '"' || r.fecha_final || '"' ELSE 'null' END ||
        '}'
      );
    END LOOP;

    DBMS_LOB.APPEND(v_clob, ']}');
    p_output := v_clob;

  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_editar_horarios;


  PROCEDURE sp_guardar_horario_doctor(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) IS
    v_id            NUMBER;
    v_id_usuario    NUMBER;
    v_dia_semana    VARCHAR2(2);
    v_hora_inicio_m VARCHAR2(8);
    v_hora_fin_m    VARCHAR2(8);
    v_hora_inicio_t VARCHAR2(8);
    v_hora_fin_t    VARCHAR2(8);
    v_fecha_inicio  DATE;
    v_fecha_final   DATE;
    v_new_id        NUMBER;
  BEGIN
    p_success := 1;

    v_id            := JSON_VALUE(p_input, '$.id'                 RETURNING NUMBER);
    v_id_usuario    := JSON_VALUE(p_input, '$.id_usuario'         RETURNING NUMBER);
    v_dia_semana    := JSON_VALUE(p_input, '$.dia_semana');
    v_hora_inicio_m := JSON_VALUE(p_input, '$.hora_inicio_manana');
    v_hora_fin_m    := JSON_VALUE(p_input, '$.hora_fin_manana');
    v_hora_inicio_t := JSON_VALUE(p_input, '$.hora_inicio_tarde');
    v_hora_fin_t    := JSON_VALUE(p_input, '$.hora_fin_tarde');
    v_fecha_inicio  := TO_DATE(JSON_VALUE(p_input, '$.fecha_inicio'), 'YYYY-MM-DD');
    IF v_fecha_inicio IS NULL THEN
      v_fecha_inicio := TRUNC(f_fecha_actual);
    END IF;

    v_fecha_final   := CASE
                          WHEN JSON_VALUE(p_input, '$.fecha_final') IS NOT NULL
                          THEN TO_DATE(JSON_VALUE(p_input, '$.fecha_final'), 'YYYY-MM-DD')
                          ELSE NULL
                        END;

    IF v_id IS NOT NULL AND v_id > 0 THEN
      -- UPDATE existing
      UPDATE tkr_horarios_doctor
         SET hora_inicio_manana = NULLIF(v_hora_inicio_m, ''),
             hora_fin_manana    = NULLIF(v_hora_fin_m, ''),
             hora_inicio_tarde  = NULLIF(v_hora_inicio_t, ''),
             hora_fin_tarde     = NULLIF(v_hora_fin_t, ''),
             fecha_inicio       = v_fecha_inicio,
             fecha_final        = v_fecha_final
       WHERE id = v_id;
      v_new_id := v_id;
    ELSE
      -- INSERT new
      v_new_id := tkr_horarios_doctor_seq.nextval;
      INSERT INTO tkr_horarios_doctor (
        id, id_usuario, dia_semana,
        hora_inicio_manana, hora_fin_manana,
        hora_inicio_tarde, hora_fin_tarde,
        fecha_inicio, fecha_final
      ) VALUES (
        v_new_id, v_id_usuario, v_dia_semana,
        NULLIF(v_hora_inicio_m, ''), NULLIF(v_hora_fin_m, ''),
        NULLIF(v_hora_inicio_t, ''), NULLIF(v_hora_fin_t, ''),
        v_fecha_inicio, v_fecha_final
      );
    END IF;

    COMMIT;
    p_output := '{"success":true,"id":' || v_new_id || '}';

  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_guardar_horario_doctor;


  PROCEDURE sp_obtener_info_profesional(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) IS
    v_id_usuario  NUMBER;
    v_nombres     VARCHAR2(100);
    v_apellidos   VARCHAR2(100);
    v_duracion    NUMBER;
    v_festivos    VARCHAR2(1);
  BEGIN
    p_success := 1;
    v_id_usuario := JSON_VALUE(p_input, '$.id_usuario' RETURNING NUMBER);

    SELECT u.nombres, u.apellidos,
           NVL(u.duracion_minutos_cita, 30),
           NVL(u.trabaja_festivos, 'N')
      INTO v_nombres, v_apellidos, v_duracion, v_festivos
      FROM tkr_usuarios u
     WHERE u.id = v_id_usuario;

    p_output := '{"success":true,"data":{'
      || '"id":' || v_id_usuario
      || ',"nombres":"' || v_nombres || '"'
      || ',"apellidos":"' || v_apellidos || '"'
      || ',"duracion_minutos_cita":' || v_duracion
      || ',"trabaja_festivos":"' || v_festivos || '"'
      || '}}';

  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      p_success := 0;
      p_output := '{"success":false,"error":"Profesional no encontrado"}';
    WHEN OTHERS THEN
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_obtener_info_profesional;

  PROCEDURE sp_login(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS 
    v_usuario VARCHAR2(100);
    v_clave   VARCHAR2(100);
    v_valor   NUMBER;
  BEGIN
    p_success := 1;
    v_usuario := JSON_VALUE(p_input, '$.usuario');
    v_clave   := JSON_VALUE(p_input, '$.clave');

    v_valor := pkgln_seguridad.f_validar_clave(v_usuario, v_clave, 1);
    
    IF v_valor = 1 THEN
      p_output := '{"success":true,"usuario":"' || v_usuario || '"}';
    ELSE
      p_success := 0;
      p_output := '{"success":false,"error":"Usuario o clave incorrectos"}';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      p_success := 0;
      p_output := '{"success":false,"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END sp_login;

  PROCEDURE sp_obtener_fecha_actual(
    p_input   IN  CLOB,
    p_output  OUT CLOB,
    p_success OUT NUMBER
  ) AS
  BEGIN
    p_success := 1;
    p_output := '{"success":true,"data":"' || TO_CHAR(f_fecha_actual, 'YYYY-MM-DD"T"HH24:MI:SS') || '"}';
  END sp_obtener_fecha_actual;

END pkgln_calendarios;
  