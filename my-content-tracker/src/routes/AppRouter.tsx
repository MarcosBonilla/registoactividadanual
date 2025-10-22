import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Header from "../components/Header/Header";
import Recommendations from '../pages/Recommendations';
import Stats from '../pages/Stats';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AppRouter() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session); 
        setLoading(false);
      });
  
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);  
      });
  
      return () => {
        if (listener && listener.subscription && typeof listener.subscription.unsubscribe === 'function') {
          listener.subscription.unsubscribe();
        }
      };
    }, []);
  
    if (loading) return <p>Cargando sesión...</p>;
  
    return (
      <BrowserRouter>
        <Header session={session} />  {}
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
              <Route path="/stats" element={<Stats />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
              <Route path="/recomendaciones" element={<Recommendations />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    );
  }