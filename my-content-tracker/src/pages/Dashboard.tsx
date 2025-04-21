"use client";

import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Button } from "../components/ui/button";
import { ContentItem } from "../types/types";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        navigate("/login"); // redirigir si no hay sesión
      } else {
        setUserEmail(user.email);
        fetchContent(user.email);
      }
    };

    getUser();
  }, [navigate]);

  const fetchContent = async (email: string) => {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("user_email", email);

    if (error) {
      console.error("Error al obtener contenido:", error);
    } else {
      setContent(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout}>Cerrar sesión</Button>
      </div>

      <h2 className="text-lg font-semibold mb-4">Contenido de {userEmail}</h2>

      {content.length === 0 ? (
        <p>No hay contenido aún.</p>
      ) : (
        <ul className="space-y-2">
          {content.map((item) => (
            <li key={item.id} className="border rounded p-4 shadow">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-500">
                Tipo: {item.type} | Año: {item.year}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
