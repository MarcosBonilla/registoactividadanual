// src/pages/Register.tsx
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './auth.css'
import { Button } from '../components/ui/button'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar los campos
    if (!email || !password || !confirmPassword) {
      setError('Por favor, ingrese todos los campos')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      console.log('Usuario registrado:', data)
      // Redirigir al login para que confirme o inicie sesión
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Error al registrar')
    }

    // Limpiar campos
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-container">
      <h2>Crear cuenta</h2>
      {error && <p className="error-msg">{error}</p>}
      <form className="auth-form" onSubmit={handleRegister}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="auth-actions">
          <Button type="submit">Crear cuenta</Button>
          <Button type="button" className="secondary" onClick={() => navigate('/login')}>
            Volver a login
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Register
