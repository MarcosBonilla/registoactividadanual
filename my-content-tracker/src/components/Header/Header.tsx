import { useState } from "react";
import "./Header.scss";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const Header = ({ session }: { session: any }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");  // Redirigir a la página de login
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>myStuff</h1>
      </div>

      <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
        ☰
      </button>

      {session ? (
        <nav className={`nav ${open ? 'open' : ''}`}>
          <button onClick={() => { navigate("/dashboard"); setOpen(false) }}>Dashboard</button>
          <button onClick={() => { navigate("/stats"); setOpen(false) }}>Estadísticas</button>
          <button onClick={() => { navigate("/recomendaciones"); setOpen(false) }}>Recomendaciones</button>
          <button className="logout-btn" onClick={() => { handleLogout(); setOpen(false) }}>Cerrar sesión</button>
        </nav>
      ) : (
        <nav className={`nav ${open ? 'open' : ''}`}>
          <button onClick={() => { navigate("/login"); setOpen(false) }}>Iniciar sesión</button>
          <button onClick={() => { navigate("/register"); setOpen(false) }}>Registrarse</button>
        </nav>
      )}
    </header>
  );
};

export default Header;
