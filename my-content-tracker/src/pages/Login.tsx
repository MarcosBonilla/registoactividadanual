// src/pages/Login.tsx
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar los campos
    if (!email || !password) {
      setError('Por favor, ingrese todos los campos')
      return
    }

    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      console.log('Usuario logeado:', user)
      // Redirigir o realizar cualquier otra acción después del login
    } catch (error: any) {
      setError(error.message)
    }

    // Limpiar campos y error
    setError('')
    setEmail('')
    setPassword('')
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
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
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login
