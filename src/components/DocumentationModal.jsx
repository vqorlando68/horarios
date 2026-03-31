import React, { useState } from 'react';
import './DocumentationModal.css';

// ─── SQL Syntax Highlighter ────────────────────────────────────────────────
const HighlightSQL = ({ code }) => {
    const lines = code.split('\n');
    return (
        <code className="sql-code-block">
            {lines.map((line, idx) => {
                let html = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const comments = /(--.*)/g;
                const strings = /('[^']*')/g;
                const keywords = /\b(SET|SERVEROUTPUT|ON|DECLARE|BEGIN|END|IF|THEN|ELSE|ELSIF|FOR|LOOP|WHILE|SELECT|FROM|WHERE|AND|OR|IN|AS|INTO|UPDATE|INSERT|DELETE|CREATE|REPLACE|PACKAGE|BODY|PROCEDURE|OUT|CLOB|NUMBER|VARCHAR2|DATE|TRUE|FALSE|NULL|EXCEPTION|WHEN|OTHERS|RETURNING|DUAL)\b/g;
                const functions = /\b(pkgln_calendarios\.\w+|DBMS_OUTPUT\.PUT_LINE|DBMS_LOB\.SUBSTR|DBMS_LOB\.APPEND|DBMS_LOB\.CREATETEMPORARY|JSON_VALUE|TO_CHAR|TO_DATE|TRUNC|SYSDATE)\b/g;

                // Protect comments first
                const hasComment = html.match(comments);
                let commentPart = '';
                if (hasComment) {
                    const splitIdx = html.indexOf('--');
                    commentPart = `<span class="sql-comment">${html.substring(splitIdx)}</span>`;
                    html = html.substring(0, splitIdx);
                }

                html = html.replace(strings, '<span class="sql-string">$1</span>');
                html = html.replace(functions, '<span class="sql-function">$1</span>');
                html = html.replace(keywords, '<span class="sql-keyword">$1</span>');

                return (
                    <div key={idx} className="code-line">
                        <span className="line-number">{idx + 1}</span>
                        <span dangerouslySetInnerHTML={{ __html: (html + commentPart) || '&nbsp;' }} />
                    </div>
                );
            })}
        </code>
    );
};

// ─── JSON Viewer ─────────────────────────────────────────────────────────────
const JsonBlock = ({ code }) => (
    <pre className="json-block"><code>{code}</code></pre>
);

// ─── Params Table ─────────────────────────────────────────────────────────────
const ParamsTable = ({ params, direction }) => (
    <table className="params-table">
        <thead>
            <tr>
                <th>Parámetro</th>
                <th>Tipo</th>
                {direction === 'input' && <th>Req.</th>}
                <th>Descripción</th>
            </tr>
        </thead>
        <tbody>
            {params.map((p, i) => (
                <tr key={i}>
                    <td><code className="param-name">{p.name}</code></td>
                    <td><span className="param-type">{p.type}</span></td>
                    {direction === 'input' && (
                        <td>
                            <span className={`req-badge ${p.required ? 'req-yes' : 'req-no'}`}>
                                {p.required ? 'Sí' : 'No'}
                            </span>
                        </td>
                    )}
                    <td className="param-desc">{p.description}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

// ─── Copy Button ─────────────────────────────────────────────────────────────
const CopyButton = ({ text, label = 'Copiar' }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? '✓ Copiado' : label}
        </button>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function DocumentationModal({ docs = [], onClose }) {
    const [activeTab, setActiveTab] = useState(docs[0]?.id ?? '');
    const [activeSection, setActiveSection] = useState('params'); // 'params' | 'example'

    const currentDoc = docs.find(d => d.id === activeTab) ?? docs[0];

    if (!docs.length) {
        return (
            <div className="doc-overlay" onClick={onClose}>
                <div className="doc-modal" onClick={e => e.stopPropagation()}>
                    <div className="doc-header">
                        <div className="doc-header-left">
                            <span className="doc-header-icon">🗄️</span>
                            <h2>Documentación API PL/SQL</h2>
                        </div>
                        <button className="doc-close" onClick={onClose} title="Cerrar (Esc)">×</button>
                    </div>
                    <div className="doc-content doc-empty">
                        <p>Esta pantalla no tiene procedimientos de base de datos documentados.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="doc-overlay" onClick={onClose}>
            <div className="doc-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="doc-header">
                    <div className="doc-header-left">
                        <span className="doc-header-icon">🗄️</span>
                        <div>
                            <h2>Documentación API PL/SQL</h2>
                            <span className="doc-header-sub">
                                {docs.length} procedimiento{docs.length !== 1 ? 's' : ''} · <kbd>Ctrl+Alt+D</kbd> para cerrar
                            </span>
                        </div>
                    </div>
                    <button className="doc-close" onClick={onClose} title="Cerrar">×</button>
                </div>

                {/* ── Procedure Tabs ─────────────────────────────────── */}
                <div className="doc-tabs">
                    {docs.map(tab => (
                        <button
                            key={tab.id}
                            className={`doc-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="tab-pkg">{tab.package}.</span>
                            {tab.title}
                        </button>
                    ))}
                </div>

                {/* ── Sub-tabs ───────────────────────────────────────── */}
                <div className="doc-subtabs">
                    <button
                        className={`doc-subtab ${activeSection === 'params' ? 'active' : ''}`}
                        onClick={() => setActiveSection('params')}
                    >
                        📋 Parámetros y Respuesta
                    </button>
                    <button
                        className={`doc-subtab ${activeSection === 'example' ? 'active' : ''}`}
                        onClick={() => setActiveSection('example')}
                    >
                        ▶ Bloque Anónimo (SQL)
                    </button>
                </div>

                {/* ── Content ────────────────────────────────────────── */}
                <div className="doc-content">

                    {/* Purpose */}
                    <div className="purpose-box">
                        <span className="purpose-icon">💡</span>
                        <p>{currentDoc.purpose}</p>
                    </div>

                    {/* ── Section: Params & Response ─────────────────── */}
                    {activeSection === 'params' && (
                        <div className="params-section">

                            {/* Input Params */}
                            <div className="doc-section">
                                <div className="section-title-row">
                                    <h3>📥 Parámetros de Entrada (p_input JSON)</h3>
                                    <CopyButton text={currentDoc.inputJson} label="Copiar JSON" />
                                </div>
                                {currentDoc.inputParams?.length > 0
                                    ? <ParamsTable params={currentDoc.inputParams} direction="input" />
                                    : <p className="no-params">Sin parámetros de entrada adicionales.</p>
                                }
                                <div className="json-section">
                                    <span className="json-label">Ejemplo completo p_input:</span>
                                    <JsonBlock code={currentDoc.inputJson} />
                                </div>
                            </div>

                            {/* Output Params */}
                            <div className="doc-section">
                                <div className="section-title-row">
                                    <h3>📤 Parámetros de Salida</h3>
                                    <CopyButton text={currentDoc.outputJson} label="Copiar JSON" />
                                </div>
                                {currentDoc.outputParams?.length > 0
                                    ? <ParamsTable params={currentDoc.outputParams} direction="output" />
                                    : <p className="no-params">Sin parámetros de salida definidos.</p>
                                }
                                <div className="json-section">
                                    <span className="json-label">Estructura p_output (JSON CLOB):</span>
                                    <JsonBlock code={currentDoc.outputJson} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Section: SQL Example ───────────────────────── */}
                    {activeSection === 'example' && (
                        <div className="doc-section">
                            <div className="code-header">
                                <h3>Bloque anónimo para prueba directa en BD Oracle</h3>
                                <CopyButton text={currentDoc.sqlCode} label="Copiar SQL" />
                            </div>
                            <div className="code-container">
                                <HighlightSQL code={currentDoc.sqlCode} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
