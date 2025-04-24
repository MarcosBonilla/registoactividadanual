import { useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const Header = ({ session }: { session: any }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");  // Redirigir a la página de login
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>Mi Aplicación</h1>
      </div>

      {session ? (
        <nav className="nav">
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/stats")}>Estadísticas</button>
          <button onClick={() => navigate("/recommendations")}>Recomendaciones</button>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </nav>
      ) : (
        <nav className="nav">
          <button onClick={() => navigate("/login")}>Iniciar sesión</button>
          <button onClick={() => navigate("/register")}>Registrarse</button>
        </nav>
      )}
    </header>
  );
};

export default Header;
