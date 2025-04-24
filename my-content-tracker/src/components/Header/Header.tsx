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
    <header>
      <h1>Mi Aplicación</h1>
      {session ? (
        <button onClick={handleLogout}>Cerrar sesión</button> // Botón de logout si hay sesión
      ) : (
        <>
          <button onClick={() => navigate("/login")}>Iniciar sesión</button>  {/* Botón de login */}
          <button onClick={() => navigate("/register")}>Registrarse</button> {/* Botón de registro */}
        </>
      )}
    </header>
  );
};

export default Header;
