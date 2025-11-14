import React, { useState } from 'react'
import { supabase } from '../supabase'
import './Auth.css'

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        onAuthSuccess(data.user)
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        alert('Revisa tu email para confirmar tu cuenta!')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔄 FileConverter Pro</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea una nueva cuenta'}
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>
        
        <p className="auth-switch">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="switch-button"
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}
