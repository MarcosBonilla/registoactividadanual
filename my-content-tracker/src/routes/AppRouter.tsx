import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Header from "../components/Header/Header";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AppRouter() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const currentSession = supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);  // Asegúrate de que la sesión se cargue al inicio
        setLoading(false);
      });
  
      // Listener para cambios en la autenticación
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);  // Actualiza la sesión cuando cambia
      });
  
      return () => {
        if (listener && typeof listener.unsubscribe === "function") {
          listener.unsubscribe();
        }
      };
    }, []);
  
    if (loading) return <p>Cargando sesión...</p>;
  
    return (
      <BrowserRouter>
        <Header session={session} />  {/* Pasar la sesión al Header */}
        <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        />
        <Routes>
          {!session ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    );
  }