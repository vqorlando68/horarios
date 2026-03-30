import { useCalendarioContext } from '../context/CalendarioContext';
import './AppointmentModal.css';

export default function AppointmentModal({ appt }) {
    const { closeAppointmentDetails, t } = useCalendarioContext();

    if (!appt) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container">
                <button className="modal-close" onClick={closeAppointmentDetails}>×</button>

                <div className="modal-header">
                    <h2>{t('patientDetails')}</h2>
                    <span className="subtitle">{t('apptInfo')}</span>
                </div>

                <div className="modal-body">
                    <div className="detail-group full-width">
                        <label>{t('fullName')}</label>
                        <div className="value large">{appt.paciente_nombre}</div>
                    </div>

                    <div className="detail-row">
                        <div className="detail-group">
                            <label>{t('idDoc')}</label>
                            <div className="value">{appt.paciente_doc_tipo} {appt.paciente_doc_num}</div>
                        </div>
                        <div className="detail-group">
                            <label>{t('dob')}</label>
                            <div className="value">{appt.paciente_fecha_nac}</div>
                        </div>
                    </div>

                    <div className="detail-group full-width">
                        <label>{t('phone')}</label>
                        <div className="value">{appt.paciente_telefono}</div>
                    </div>

                    <div className="detail-group full-width">
                        <label>{t('address')}</label>
                        <div className="value">{appt.paciente_direccion}</div>
                    </div>

                    <div className="divider"></div>

                    <div className="detail-row">
                        <div className="detail-group">
                            <label>{t('apptCode')}</label>
                            <div className="value highlight-blue">{appt.id}</div>
                        </div>
                        <div className="detail-group">
                            <label>{t('apptTime')}</label>
                            <div className="value">
                                {appt.fecha_inicio.split('T')[1].substring(0, 5)} - {appt.fecha_fin.split('T')[1].substring(0, 5)}
                            </div>
                        </div>
                    </div>

                    <div className="detail-group full-width">
                        <label>{t('consultReason')}</label>
                        <div className="value" style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            paddingRight: '8px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            border: '1px solid #f1f5f9',
                            padding: '8px',
                            borderRadius: '6px',
                            background: '#fafafa'
                        }}>
                            {appt.motivo}
                        </div>
                    </div>

                    <div className="detail-group full-width">
                        <label>{t('professional')}</label>
                        <div className="value highlight-blue">{appt.profesional_nombre}</div>
                    </div>

                    <div className="detail-row">
                        <div className="detail-group">
                            <label>{t('entity')}</label>
                            <div className="value highlight-green">{appt.entidad}</div>
                        </div>
                        <div className="detail-group">
                            <label>{t('status')}</label>
                            <div className="value status-badge" style={{ color: appt.color_hex }}>
                                ● {appt.estado}
                            </div>
                        </div>
                    </div>

                    {appt.link_detalle && (
                        <div className="detail-link" style={{ marginTop: '16px', marginBottom: '16px' }}>
                            <a href={appt.link_detalle} target="_blank" rel="noopener noreferrer">{t('viewDetail')}</a>
                        </div>
                    )}

                    <button className="primary-btn" onClick={closeAppointmentDetails}>Cerrar Ventana</button>
                </div>
            </div>
        </div>
    );
}
