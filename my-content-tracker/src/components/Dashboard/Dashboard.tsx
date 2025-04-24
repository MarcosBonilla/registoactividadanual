import React, { useState, useEffect } from "react";
import "./Dashboard.scss";
import { FaPlus } from "react-icons/fa";
import ModalEdit from "../Modal/Modal";
import Card from "../Card/Card";
import { supabase } from "../../services/supabaseClient";  // Asegúrate de que tengas configurado Supabase

const Dashboard: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase.from("contents").select("*");
      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data);
      }
    };

    fetchItems();
  }, []);

  const handleSaveItem = (newItem: any) => {
    setItems((prevItems) => {
      // Elimina el ítem anterior (el que fue editado) usando el ID original
      return prevItems
        .filter((item) => item.id !== currentItem?.id)
        .concat(newItem); // Agrega el nuevo ítem
    });
  };
  

  const handleOpenModal = (item: any) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("contents").delete().eq("id", id);
      if (error) throw error;
      setItems((prevItems) => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <button className="add-item-btn" onClick={() => {
        setCurrentItem(null);
        setIsModalOpen(true);
      }}>
        <FaPlus size={24} />
      </button>
      <div className="items">
        {items.map((item) => (
          <Card
            key={item.id}
            {...item}
            onDelete={handleDeleteItem}
            onOpenModal={handleOpenModal}
          />
        ))}
      </div>

      <ModalEdit
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={currentItem}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default Dashboard;
