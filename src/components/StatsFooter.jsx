import { useCalendarioContext } from '../context/CalendarioContext';
import './StatsFooter.css';

export default function StatsFooter() {
    const { t, stats } = useCalendarioContext();

    if (!stats) return <div className="stats-footer loading">{t('loading')}</div>;

    return (
        <div className="stats-footer">
            <div className="stat-card">
                <div className="stat-icon bg-blue">📋</div>
                <div className="stat-info">
                    <label>Total de Citas</label>
                    <div className="stat-val">{stats.total_citas}</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon bg-green">✅</div>
                <div className="stat-info">
                    <label>Citas Atendidas</label>
                    <div className="stat-val">{stats.atendidas}</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon bg-orange">⏱️</div>
                <div className="stat-info">
                    <label>Citas pendientes</label>
                    <div className="stat-val">{stats.pendientes}</div>
                </div>
            </div>
        </div>
    );
}
