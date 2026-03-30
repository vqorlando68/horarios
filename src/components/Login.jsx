'use client';
import { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
    const [usuario, setUsuario] = useState('');
    const [clave, setClave] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, clave })
            });
            const data = await res.json();
            if (data.success) {
                onLogin(data.usuario);
            } else {
                setError(data.error || 'Usuario o clave incorrectos');
            }
        } catch (err) {
            setError('Error de conexión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">📅</div>
                    <span className="login-logo-text">Horarios</span>
                </div>

                <h2 className="login-title">Bienvenido</h2>
                <p className="login-subtitle">Ingrese sus credenciales para continuar</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label className="login-label">Usuario</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">👤</span>
                            <input
                                id="login-usuario"
                                type="text"
                                className="login-input"
                                placeholder="Ingrese su usuario"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                required
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label">Clave</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">🔒</span>
                            <input
                                id="login-clave"
                                type="password"
                                className="login-input"
                                placeholder="Ingrese su clave"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                        id="login-submit-btn"
                    >
                        {loading ? (
                            <><div className="login-spinner" /> Verificando...</>
                        ) : (
                            <>Ingresar →</>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    Sistema de Horarios y Citas · Teker
                </div>
            </div>
        </div>
    );
}
