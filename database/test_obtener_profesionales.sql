SET SERVEROUTPUT ON;
DECLARE
  v_input CLOB;
  v_output CLOB;
  v_success NUMBER;
BEGIN
  -- Inicializamos el JSON vacío
  v_input := '{}';
  
  -- Llamamos a la función
  pkgln_calendarios.sp_obtener_profesionales(
    p_input => v_input,
    p_output => v_output,
    p_success => v_success
  );
  
  -- Mostramos el resultado por pantalla
  IF v_success = 1 THEN
    DBMS_OUTPUT.PUT_LINE('SUCESO: 1');
    -- Como v_output es un CLOB, DBMS_OUTPUT.PUT_LINE podría fallar si es muy grande (> 32k)
    -- Por seguridad lo cortamos a los primeros caracteres para verlo
    DBMS_OUTPUT.PUT_LINE('DATA: ' || DBMS_LOB.SUBSTR(v_output, 4000, 1));
  ELSE
    DBMS_OUTPUT.PUT_LINE('ERROR: 0');
    DBMS_OUTPUT.PUT_LINE('MSG: ' || DBMS_LOB.SUBSTR(v_output, 4000, 1));
  END IF;
END;
/
