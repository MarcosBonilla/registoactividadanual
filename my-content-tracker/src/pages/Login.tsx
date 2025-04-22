// src/pages/Login.tsx
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from "react-router-dom"; // Cambiado a react-router-dom
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Usamos useNavigate para redirigir

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Error: " + error.message);
      } else {
        navigate("/dashboard"); // Redirige al dashboard después del login
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
