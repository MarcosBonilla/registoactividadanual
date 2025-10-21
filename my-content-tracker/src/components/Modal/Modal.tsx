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
  const [formData, setFormData] = useState<any>(item || {});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // If editing an existing item, load it. If creating new, initialize sensible defaults
    if (item) {
      setFormData(item);
    } else {
      const todayISO = new Date().toISOString();
      setFormData({
        title: "",
        type: "movie",
        rating: "",
        comment: "",
        date: todayISO,
        status: "",
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // basic validation
    if (!formData.title || !formData.title.toString().trim()) {
      setFormError('El título es obligatorio');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("No se pudo obtener el usuario autenticado.");
      setFormError('No se pudo obtener el usuario autenticado');
      return;
    }

    // accept comma as decimal separator (e.g., 3,5) and normalize to dot
    const rawRating = formData.rating === '' || formData.rating == null ? '' : String(formData.rating);
    const normalized = rawRating.replace(',', '.');
    const ratingVal = normalized === '' ? null : Number(normalized);

    const newItem = {
      title: formData.title,
      type: formData.type,
      rating: ratingVal,
      comment: formData.comment,
      date: formData.date,
      status: formData.status,
      // NOT sending coverUrl to DB on purpose — keep cover only for UI
      user_id: user.id,
    };

    try {
      let res;
      if (formData.id) {
        // Update existing record (don't attempt to write coverUrl)
        res = await supabase.from('contents').update(newItem).eq('id', formData.id).select().single();
      } else {
        // Insert new (exclude coverUrl field)
        res = await supabase.from('contents').insert([newItem]).select().single();
      }

      if (res.error) {
        console.error('Supabase error:', res.error);
        setFormError(res.error.message || 'Error guardando el ítem');
        return;
      }

      const saved = res.data;
      onSave(saved);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar el ítem editado:', err);
      setFormError(err?.message || String(err));
    }
  };

  if (!isOpen) return null;

  const statusOptions = statusOptionsByType[formData.type] || [];

  const isEditing = Boolean(formData?.id);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditing ? 'Editar ítem' : 'Crear ítem'}</h2>
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
            <input type="number" step="0.1" min="0" max="5" name="rating" value={formData.rating || ""} onChange={handleChange} placeholder="Ej: 3.5 o 3,5" />
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

          <button className="save-button" type="submit">{isEditing ? 'Guardar cambios' : 'Crear'}</button>
        </form>
        {formError && <div className="form-error">{formError}</div>}
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ModalEdit;
