import React, { useState, useCallback } from 'react';
import './AppDialog.css';

// ─── Dialog global singleton ───────────────────────────────────────
let _showDialog = null;

export function useDialog() {
    return { showDialog: _showDialog };
}

// ─── Provider (place once near root or in ScheduleEditorLayout) ────
export function AppDialogProvider({ children }) {
    const [dialogs, setDialogs] = useState([]);

    const showDialog = useCallback(({ type = 'info', title, message, onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar' }) => {
        const id = Date.now();
        setDialogs(prev => [...prev, { id, type, title, message, onConfirm, onCancel, confirmText, cancelText }]);
    }, []);

    // Expose globally
    _showDialog = showDialog;

    const close = (id, action) => {
        const dlg = dialogs.find(d => d.id === id);
        setDialogs(prev => prev.filter(d => d.id !== id));
        if (action === 'confirm' && dlg?.onConfirm) dlg.onConfirm();
        if (action === 'cancel' && dlg?.onCancel) dlg.onCancel();
    };

    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '🚫', confirm: '❓' };

    return (
        <>
            {children}
            {dialogs.map(dlg => (
                <div key={dlg.id} className="app-dialog-overlay" onClick={() => close(dlg.id, 'cancel')}>
                    <div className={`app-dialog-box app-dialog-${dlg.type}`} onClick={e => e.stopPropagation()}>
                        <div className="app-dialog-icon">{icons[dlg.type] || icons.info}</div>
                        {dlg.title && <div className="app-dialog-title">{dlg.title}</div>}
                        <div className="app-dialog-message">{dlg.message}</div>
                        <div className="app-dialog-actions">
                            {dlg.onCancel !== undefined && (
                                <button className="app-dialog-btn app-dialog-btn-cancel" onClick={() => close(dlg.id, 'cancel')}>
                                    {dlg.cancelText}
                                </button>
                            )}
                            <button className={`app-dialog-btn app-dialog-btn-confirm app-dialog-btn-${dlg.type}`} onClick={() => close(dlg.id, 'confirm')}>
                                {dlg.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}
