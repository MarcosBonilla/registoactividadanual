// src/pages/Login.tsx
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from "react-router-dom"; 
import './auth.css'
import { Button } from '../components/ui/button'

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate(); 

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message)
      } else {
        navigate("/dashboard"); 
      }
    } catch (err: any) {
      console.error("Error during login:", err);
      setError(err?.message ?? 'Error inesperado')
    }
  };

  return (
    <div className="auth-container">
      <h1>Iniciar sesión</h1>
      <form className="auth-form" onSubmit={handleLogin}>
        {error && <div className="error-msg">{error}</div>}
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <div className="auth-actions">
          <Button type="submit">Entrar</Button>
          <Button type="button" className="secondary" onClick={() => navigate('/register')}>
            Crear cuenta
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
