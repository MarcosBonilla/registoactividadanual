// src/components/Dashboard/Dashboard.tsx
import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import Card from "../Card/Card"; // Importamos el componente Card

interface DashboardProps {
  items: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Eliminar ítem
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("contents")
      .update({ status: 3 })  // Marcamos como eliminado (estado 3)
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    }
  };

  // Editar ítem
  const handleEdit = async (id: string, newData: any) => {
    const { error } = await supabase
      .from("contents")
      .update(newData)
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, ...newData } : item
        )
      );
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="card-container">
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p>{error}</p>
        ) : items.length > 0 ? (
          items.map((item) => (
            <Card
              key={item.id}
              {...item}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        ) : (
          <p>No tienes ítems registrados.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
