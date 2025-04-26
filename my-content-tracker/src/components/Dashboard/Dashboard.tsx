import React, { useState, useEffect } from "react";
import "./Dashboard.scss";
import { FaPlus } from "react-icons/fa";
import ModalEdit from "../Modal/Modal";
import Card from "../Card/Card";
import { supabase } from "../../services/supabaseClient";

const Dashboard: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);

  const [activeType, setActiveType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("date-desc");  // Estado para ordenar

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

  // Función para ordenar los ítems según el criterio seleccionado
  const sortItems = (items: any[]) => {
    switch (sortOption) {
      case 'date-desc':
        return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date-asc':
        return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'rating-desc':
        return items.sort((a, b) => b.rating - a.rating);
      case 'rating-asc':
        return items.sort((a, b) => a.rating - b.rating);
      case 'title-asc':
        return items.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return items.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return items;
    }
  };

  const handleSaveItem = (newItem: any) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.id !== currentItem?.id).concat(newItem)
    );
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
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Filtro de ítems según tipo y búsqueda
  const filteredItems = items.filter((item) => {
    const matchesType = activeType ? item.type === activeType : true;
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Opciones de tipo de ítem
  const typeOptions = [
    { label: "Videojuegos", value: "videoGame" },
    { label: "Películas", value: "movie" },
    { label: "Libros", value: "book" },
    { label: "Series", value: "tvSerie" },
  ];
  

  const toggleTypeFilter = (value: string) => {
    setActiveType((prev) => (prev === value ? null : value));
  };

  return (
    <div className="dashboard">

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="type-buttons">
          {typeOptions.map(({ label, value }) => (
            <button
              key={value}
              className={activeType === value ? "active" : ""}
              onClick={() => toggleTypeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro de orden */}
        <div className="sort-select">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="date-desc">Fecha (↓)</option>
            <option value="date-asc">Fecha (↑)</option>
            <option value="rating-desc">Rating (↓)</option>
            <option value="rating-asc">Rating (↑)</option>
            <option value="title-asc">Título (A-Z)</option>
            <option value="title-desc">Título (Z-A)</option>
          </select>
        </div>
      </div>

      <button
        className="add-item-btn"
        onClick={() => {
          setCurrentItem(null);
          setIsModalOpen(true);
        }}
      >
        <FaPlus size={24} />
      </button>

      <div className="items">
        {sortItems(filteredItems).map((item) => (
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
