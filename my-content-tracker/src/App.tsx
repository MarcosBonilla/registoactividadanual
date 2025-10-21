import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./services/supabaseClient";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header/Header";

export default function AppRouter() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSession returns { data: { session } }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      // listener is of shape { subscription }
      try {
        // safely attempt to unsubscribe if available
        // @ts-ignore
        if (listener && listener.subscription && typeof listener.subscription.unsubscribe === 'function') {
          // @ts-ignore
          listener.subscription.unsubscribe();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  if (loading) return <p>Cargando sesión...</p>;

  return (
    <BrowserRouter>
      <Header session={session} /> {/* Pasar la sesión al Header */}
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
