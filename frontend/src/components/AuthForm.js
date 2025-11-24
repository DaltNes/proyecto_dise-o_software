import React, { useState } from 'react';
import { auth } from '../lib/supabase';
import './Auth.css';

const AuthForm = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (!email || !password) {
      setError('Email y contraseña son requeridos');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await auth.signIn(email, password);
      } else {
        result = await auth.signUp(email, password);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        if (isLogin) {
          onAuthSuccess(result.data.user);
        } else {
          setError('');
          alert('Registro exitoso. Revisa tu email para confirmar tu cuenta.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔄 FileConverter Pro</h2>
          <p>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="switch-button"
            >
              {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </p>
        </div>

        <div className="demo-info">
          <h4>🚀 Demo del Proyecto</h4>
          <p><strong>Curso:</strong> Diseño de Software - TICS316</p>
          <p><strong>Funciones:</strong></p>
          <ul>
            <li>✅ Autenticación con Supabase</li>
            <li>🔄 Conversión de archivos ZIP ↔ RAR</li>
            <li>📁 Gestión de archivos comprimidos</li>
            <li>🌍 Sistema multilenguaje</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;