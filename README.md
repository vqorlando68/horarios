# Documentación de Base de Datos - Sistema de Horarios Teker

Este documento detalla todos los llamados a procedimientos almacenados (Stored Procedures) de Oracle realizados por la aplicación, incluyendo sus parámetros de entrada, estructuras de salida y ejemplos de uso.

## Índice
1. [Configuración General](#configuración-general)
2. [Procedimientos de Calendario (Vista Principal)](#procedimientos-de-calendario-vista-principal)
3. [Procedimientos de Gestión (Página Editar)](#procedimientos-de-gestión-página-editar)
4. [Catálogos y Utilidades](#catálogos-y-utilidades)

---

## Configuración General

Todos los procedimientos pertenecen al paquete `pkgln_calendarios` y siguen el estándar de firma:
- `p_input`: CLOB conteniendo un JSON con los filtros.
- `p_output`: CLOB donde se retorna el JSON de respuesta.
- `p_success`: NUMBER (1 indica éxito, 0 indica error).

---

## Procedimientos de Calendario (Vista Principal)

### 1. `pkgln_calendarios.sp_obtener_profesionales`
**Uso:** Carga el selector de profesionales en el encabezado.
- **Entrada (JSON):**
  - `fecha_inicio` (opcional): Filtra profesionales con actividad en esta fecha.
  - `incluir_sin_horario` (booleano): Si es `true`, incluye médicos sin configuración activa (usado en el Editor).
- **Salida (JSON):**
  - `data`: Array de objetos `{ id, nombre, trabaja_festivos }`.
- **Ubicación:** `CalendarLayout.jsx` y `ScheduleEditorLayout.jsx`.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_obtener_profesionales('{"incluir_sin_horario": 1}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

### 2. `pkgln_calendarios.sp_obtener_citas`
**Uso:** Recupera las citas programadas para las vistas de Día, Semana y Mes.
- **Entrada (JSON):**
  - `id_usuario` (requerido): ID del profesional.
  - `fecha_inicio` (requerido): Fecha inicial del rango (ISO 8601).
  - `fecha_fin` (requerido): Fecha final del rango (ISO 8601).
  - `id_estado_cita` (opcional): Filtro por estado.
- **Salida (JSON):**
  - `data`: Array de citas con `paciente_nombre`, `fecha_inicio`, `estado_cita`, etc.
- **Ubicación:** `CalendarioContext.jsx` -> `fetchData`.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_obtener_citas('{"id_usuario": 65, "fecha_inicio": "2026-03-01T00:00:00", "fecha_fin": "2026-03-31T23:59:59"}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

### 3. `pkgln_calendarios.sp_obtener_horarios`
**Uso:** Determina las franjas de disponibilidad visual en el calendario.
- **Entrada (JSON):**
  - `id_usuario` (requerido): ID del profesional.
  - `fecha_inicio` (requerido): Fecha de referencia.
- **Salida (JSON):**
  - `data.horarios`: Array de franjas por día (`inicio`, `fin`, `tipo_atencion`).
- **Ubicación:** `CalendarioContext.jsx` -> `fetchData`.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_obtener_horarios('{"id_usuario": 65, "fecha_inicio": "2026-03-31"}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

### 4. `pkgln_calendarios.sp_resumen_estadistico`
**Uso:** Carga los contadores del pie de página (Total, Atendidas, Pendientes).
- **Entrada (JSON):**
  - `id_usuario`, `fecha_inicio`, `fecha_fin`.
- **Salida (JSON):**
  - `data`: Objeto `{ total_citas, atendidas, pendientes }`.
- **Ubicación:** `StatsFooter.jsx`.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_resumen_estadistico('{"id_usuario": 65, "fecha_inicio": "2026-03-01", "fecha_fin": "2026-03-31"}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

---

## Procedimientos de Gestión (Página Editar)

### 5. `pkgln_calendarios.sp_editar_horarios`
**Uso:** Carga la configuración administrativa de bloques horarios.
- **Entrada (JSON):**
  - `id_usuario` (requerido).
  - `tipo` (requerido): `"base"` para horario permanente o `"temporal"` para rangos personalizados.
- **Detalle de Campos de Salida:**
  - `dia_semana`: `LU, MA, MI, JU, VI, SA, DO`.
  - `hora_inicio_manana` / `hora_fin_manana`: Bloque matutino.
  - `hora_inicio_tarde` / `hora_fin_tarde`: Bloque vespertino.
- **Ubicación:** `ScheduleEditorLayout.jsx`.
- **Ejemplo SQL (Base):**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_editar_horarios('{"id_usuario": 65, "tipo": "base"}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

### 6. `pkgln_calendarios.sp_guardar_horario_doctor`
**Uso:** Persiste cambios (Insert/Update) mediante un MERGE en la tabla `tkr_horarios_doctor`.
- **Entrada (JSON):**
  - `id_usuario`, `dia_semana`, `fecha_inicio`, `fecha_final` (null para base).
  - `hora_inicio_manana`, `hora_fin_manana`, `hora_inicio_tarde`, `hora_fin_tarde`.
- **Ubicación:** `ScheduleEditorLayout.jsx` -> `handleSaveDay`.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_guardar_horario_doctor('{"id_usuario": 65, "dia_semana": "LU", "fecha_inicio": "2026-01-01", "hora_inicio_manana": "08:00", "hora_fin_manana": "12:00"}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

---

## Catálogos y Utilidades

### 7. `pkgln_calendarios.sp_obtener_ausencias`
**Uso:** Carga bloqueos por vacaciones o permisos del profesional.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_obtener_ausencias('{"id_usuario": 65, "fecha_inicio": "2026-03-01T00:00:00", "fecha_fin": "2026-03-31T23:59:59"}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

### 8. `pkgln_calendarios.sp_obtener_estados_cita`
**Uso:** Población del filtro de estados en el calendario.
- **Ejemplo SQL:**
  ```sql
  DECLARE
    v_out CLOB; v_res NUMBER;
  BEGIN
    pkgln_calendarios.sp_obtener_estados_cita('{}', v_out, v_res);
    DBMS_OUTPUT.PUT_LINE(v_out);
  END;
  ```

### 9. `f_fecha_actual` (Función)
**Uso:** Sincroniza la fecha del sistema del cliente con la del servidor Oracle.
- **Ubicación:** `CalendarioContext.jsx` -> `useEffect` inicial.
- **Ejemplo SQL:**
  ```sql
  SELECT pkgln_calendarios.f_fecha_actual() FROM DUAL;
  ```

