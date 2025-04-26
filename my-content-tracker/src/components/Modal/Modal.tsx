import React, { useState, useEffect } from "react";
import "./Modal.scss";
import { supabase } from "../../services/supabaseClient";

const statusOptionsByType: Record<string, string[]> = {
  movie: ["vista", "por ver", "viendo"],
  book: ["leído", "por leer", "leyendo"],
  videoGame: ["jugado", "por jugar", "jugando"],
  tvSerie: ["vista", "por ver", "viendo"],
};

interface ModalEditProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSave: (newItem: any) => void;
}

const ModalEdit: React.FC<ModalEditProps> = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState(item || {});

  useEffect(() => {
    setFormData(item || {});
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("No se pudo obtener el usuario autenticado.");
      return;
    }

    const newItem = {
      title: formData.title,
      type: formData.type,
      rating: formData.rating,
      comment: formData.comment,
      date: formData.date,
      status: formData.status,
      user_id: user.id,
    };

    try {
      // Solo eliminar si el ID existe
      if (formData.id) {
        await supabase.from("contents").delete().eq("id", formData.id);
      }

      // Insertar ítem nuevo
      const { data, error } = await supabase
        .from("contents")
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      onSave(data);
      onClose();
    } catch (error) {
      console.error("Error al guardar el ítem editado:", error);
    }
  };

  if (!isOpen) return null;

  const statusOptions = statusOptionsByType[formData.type] || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Ítem</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input name="title" value={formData.title || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select name="type" value={formData.type || ""} onChange={handleChange}>
              <option value="movie">Película</option>
              <option value="book">Libro</option>
              <option value="videoGame">Videojuego</option>
              <option value="tvSerie">Serie</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rating</label>
            <input type="number" name="rating" value={formData.rating || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Comentario</label>
            <input name="comment" value={formData.comment || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input type="date" name="date" value={formData.date?.split("T")[0] || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select name="status" value={formData.status || ""} onChange={handleChange}>
              <option value="">Seleccionar estado</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <button className="save-button" type="submit">Guardar</button>
        </form>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ModalEdit;
