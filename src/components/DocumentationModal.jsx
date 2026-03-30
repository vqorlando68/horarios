import React, { useState } from 'react';
import './DocumentationModal.css';

const documentationData = [
    {
        id: 'profesionales',
        title: 'sp_obtener_profesionales',
        purpose: 'Retorna el maestro de todos los médicos que tienen por lo menos un bloque de horario activo configurado dentro del sistema (tkr_horarios_doctor).',
        invocationInput: '{}',
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input CLOB;
  v_output CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{}';
  
  pkgln_calendarios.sp_obtener_profesionales(
    p_input => v_input,
    p_output => v_output,
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
        jsonExpected: `{
  "success": true,
  "data": [
    {
      "id": 65,
      "nombre": "65-Rodolfo Vargas"
    },
    {
      "id": 6,
      "nombre": "Carolina Avila"
    }
  ]
}`
    },
    {
        id: 'citas',
        title: 'sp_obtener_citas',
        purpose: 'Busca y retorna las citas programadas (tkr_citas) filtrando cruzadamente por el id_usuario del médico tratante y opcionalmente un rango de fechas.',
        invocationInput: '{"id_usuario": 65}',
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input CLOB;
  v_output CLOB;
  v_success NUMBER;
BEGIN
  -- Emulamos la estructura que manda el frontend React
  v_input := '{"id_usuario": 65}';
  
  pkgln_calendarios.sp_obtener_citas(
    p_input => v_input,
    p_output => v_output,
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
        jsonExpected: `{
  "success": true,
  "data": [
    {
      "id": 469,
      "paciente_nombre": "JUAN PEREZ",
      "fecha_inicio": "2026-03-04T16:00:00",
      "fecha_fin": "2026-03-04T16:20:00",
      "modalidad": "Presencial"
    }
  ]
}`
    },
    {
        id: 'horarios',
        title: 'sp_obtener_horarios',
        purpose: 'Calcula todas las franjas operativas y la consolidación de tiempos (Obligatorio/Voluntario) por día de la semana para un doctor específico.',
        invocationInput: '{"id_usuario": 65}',
        sqlCode: `SET SERVEROUTPUT ON;
DECLARE
  v_input CLOB;
  v_output CLOB;
  v_success NUMBER;
BEGIN
  v_input := '{"id_usuario": 65}';
  
  pkgln_calendarios.sp_obtener_horarios(
    p_input => v_input,
    p_output => v_output,
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
        jsonExpected: `{
  "success": true,
  "data": {
    "horarios": [
      {
        "dia_semana": "MI",
        "franjas": [
          {
            "inicio": "08:00",
            "fin": "11:40",
            "tipo_atencion": "V"
          }
        ]
      }
    ]
  }
}`
    }
];

// Ligero parser de SQL para colorear la sintaxis
const HighLightSQL = ({ code }) => {
    const lines = code.split('\n');
    return (
        <code className="sql-code-block">
            {lines.map((line, idx) => {
                let html = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                // Regex rules for simple coloring
                const comments = /(--.*)/g;
                const strings = /('[^']*')/g;
                const keywords = /\b(SET|SERVEROUTPUT|ON|DECLARE|BEGIN|END|IF|THEN|ELSE|ELSIF|FOR|LOOP|WHILE|SELECT|FROM|WHERE|AND|OR|IN|AS|INTO|UPDATE|INSERT|DELETE|CREATE|OR|REPLACE|PACKAGE|BODY|PROCEDURE|OUT|CLOB|NUMBER|VARCHAR2|DATE|TRUE|FALSE|NULL|EXCEPTION|WHEN|OTHERS|RETURNING|DUAL)\b/g;
                const functions = /\b(pkgln_calendarios\.\w+|DBMS_OUTPUT\.PUT_LINE|DBMS_LOB\.SUBSTR|DBMS_LOB\.APPEND|DBMS_LOB\.CREATETEMPORARY|JSON_VALUE|TO_CHAR|TO_DATE|TRUNC|SYSDATE)\b/g;

                // Protect comments first so keywords inside them aren't parsed
                const hasComment = html.match(comments);
                let commentPart = '';
                if (hasComment) {
                    const splitIdx = html.indexOf('--');
                    commentPart = html.substring(splitIdx);
                    html = html.substring(0, splitIdx);
                    commentPart = `<span class="sql-comment">${commentPart}</span>`;
                }

                html = html.replace(strings, '<span class="sql-string">$1</span>');
                html = html.replace(functions, '<span class="sql-function">$1</span>');
                html = html.replace(keywords, '<span class="sql-keyword">$1</span>');

                return (
                    <div key={idx} className="code-line">
                        <span className="line-number">{idx + 1}</span>
                        <span dangerouslySetInnerHTML={{ __html: html + commentPart || '&nbsp;' }} />
                    </div>
                );
            })}
        </code>
    );
};

export default function DocumentationModal({ onClose }) {
    const [activeTab, setActiveTab] = useState(documentationData[0].id);
    const [copied, setCopied] = useState(false);

    const currentDoc = documentationData.find(d => d.id === activeTab);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentDoc.sqlCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="doc-overlay" onClick={onClose}>
            <div className="doc-modal" onClick={e => e.stopPropagation()}>
                <div className="doc-header">
                    <h2>Documentación API Pl/SQL</h2>
                    <button className="doc-close" onClick={onClose}>×</button>
                </div>

                <div className="doc-tabs">
                    {documentationData.map(tab => (
                        <button
                            key={tab.id}
                            className={`doc-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>

                <div className="doc-content">
                    <section className="doc-section purpose-box">
                        <h3>1. Finalidad ({currentDoc.title})</h3>
                        <p>{currentDoc.purpose}</p>
                    </section>

                    <div className="doc-grid">
                        <section className="doc-section split-col">
                            <h3>2. Invocación desde Node/React</h3>
                            <div className="code-container invocation-code">
                                <code> p_input {'=>'} {currentDoc.invocationInput} </code>
                            </div>
                            <p style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                                El procedimiento responderá con un formato estándar <code>{`{success: true/false, data: []}`}</code> mediante el parámetro de salida <code>p_output</code>.
                            </p>
                        </section>

                        <section className="doc-section split-col">
                            <h3>4. Respuesta Esperada Pura (JSON CLOB)</h3>
                            <div className="code-container dark-container">
                                <pre><code>{currentDoc.jsonExpected}</code></pre>
                            </div>
                        </section>
                    </div>

                    <section className="doc-section">
                        <div className="code-header">
                            <h3>3. Ejemplo de Bloque Anónimo (Prueba BD)</h3>
                            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                                {copied ? '✓ Copiado' : 'Copiar Código SQL'}
                            </button>
                        </div>
                        <div className="code-container">
                            <HighLightSQL code={currentDoc.sqlCode} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
