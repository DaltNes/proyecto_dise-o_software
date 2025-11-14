import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import FileConverter from './components/FileConverter'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión activa
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="App">
      {!user ? (
        <Auth onAuthSuccess={setUser} />
      ) : (
        <div>
          <header className="app-header">
            <h1>🔄 FileConverter Pro</h1>
            <div className="user-info">
              <span>Bienvenido, {user.email}</span>
              <button onClick={handleLogout} className="logout-btn">
                Cerrar Sesión
              </button>
            </div>
          </header>
          <FileConverter user={user} />
        </div>
      )}
    </div>
  )
}

export default App
