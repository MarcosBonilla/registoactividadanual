import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient"; // Asegúrate de tener la configuración de Supabase
import Card from "../Card/Card"; // Importamos el componente Card

const Dashboard: React.FC = () => {
  const [items, setItems] = useState([]);
  const userId = "user-id"; // Aquí deberías obtener el userId del contexto o autenticación

  // Cargar datos de Supabase
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setItems(data || []);
      }
    };

    fetchItems();
  }, [userId]);

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
        {items.map((item) => (
          <Card
            key={item.id}
            {...item}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
