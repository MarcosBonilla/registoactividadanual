import React, { useState, useEffect } from "react";
import "./Modal.scss";
import { supabase } from "../../services/supabaseClient";
import { TMDB_API_KEY, RAWG_API_KEY } from '../../services/apikeys';

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
      // map duration_minutes to duration_hours for editable field
      const mapped = { ...item } as any;
      if (item.type === 'videoGame' && item.duration_minutes != null) {
        mapped.duration_hours = Math.round(item.duration_minutes / 60);
      }
      setFormData(mapped);
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

    const newItem: any = {
      title: formData.title,
      type: formData.type,
      rating: ratingVal,
      comment: formData.comment,
      date: formData.date,
      status: formData.status,
      user_id: user.id,
    };

    // If user provided hours for videogames, prefer that (store minutes)
    const userProvidedHours = formData.duration_hours !== undefined && formData.duration_hours !== '';
    let userDurationOverride = false;
    if (formData.type === 'videoGame' && userProvidedHours) {
      const h = Number(formData.duration_hours);
      if (!Number.isNaN(h)) {
        newItem.duration_minutes = Math.round(h * 60);
        userDurationOverride = true;
      }
    }

  // Optional external fields (may be provided by a recommendation)
    if (formData.external_provider) newItem.external_provider = formData.external_provider;
    if (formData.external_id) newItem.external_id = formData.external_id;
    if (formData.cover_url) newItem.cover_url = formData.cover_url;
    if (formData.coverUrl) newItem.cover_url = formData.coverUrl; // support camelCase
    if (formData.duration_minutes) newItem.duration_minutes = formData.duration_minutes;
    if (formData.durationMinutes) newItem.duration_minutes = formData.durationMinutes;
    if (formData.metacritic) newItem.metacritic = formData.metacritic;

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

      // Try to enrich the saved row by querying the corresponding external API
      try {
  await fetchAndUpdateExternalData(saved.id, newItem.type, newItem.title, userDurationOverride);
      } catch (e) {
        console.warn('Enriquecimiento externo fallido:', e);
      }

      // Reload the saved row to include enrichment
      const { data: refreshed, error: refErr } = await supabase.from('contents').select('*').eq('id', saved.id).single();
      if (refErr) {
        console.warn('No se pudo recargar el registro guardado:', refErr);
        onSave(saved);
      } else {
        onSave(refreshed);
      }

      onClose();
    } catch (err: any) {
      console.error('Error al guardar el ítem editado:', err);
      setFormError(err?.message || String(err));
    }
  };

  // Busca en el proveedor externo (según type) y actualiza el registro con external_id, cover_url y duration_minutes si encuentra datos
  const fetchAndUpdateExternalData = async (rowId: string, type: string, title: string, userOverrideDuration = false) => {
    try {
      if (!title) return;
      const payload: any = {};

      if (type === 'movie') {
        const s = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
        if (!s.ok) throw new Error('TMDb search failed');
        const j = await s.json();
        const m = j.results?.[0];
        if (m) {
          const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_API_KEY}`);
          if (detailsRes.ok) {
            const d = await detailsRes.json();
            payload.external_provider = 'tmdb';
            payload.external_id = String(m.id);
            payload.cover_url = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null;
            payload.duration_minutes = d.runtime || null;
          }
        }
      } else if (type === 'tvSerie') {
        const s = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
        if (!s.ok) throw new Error('TMDb search failed');
        const j = await s.json();
        const m = j.results?.[0];
        if (m) {
          const detailsRes = await fetch(`https://api.themoviedb.org/3/tv/${m.id}?api_key=${TMDB_API_KEY}`);
          if (detailsRes.ok) {
            const d = await detailsRes.json();
            payload.external_provider = 'tmdb';
            payload.external_id = String(m.id);
            payload.cover_url = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null;
            payload.duration_minutes = Array.isArray(d.episode_run_time) && d.episode_run_time.length > 0 ? d.episode_run_time[0] : null;
          }
        }
      } else if (type === 'videoGame') {
        const s = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`);
        if (!s.ok) throw new Error('RAWG search failed');
        const j = await s.json();
        const g = j.results?.[0];
        if (g) {
          const detailsRes = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_API_KEY}`);
          if (detailsRes.ok) {
            const d = await detailsRes.json();
            payload.external_provider = 'rawg';
            payload.external_id = String(g.id);
            payload.cover_url = d.background_image || null;
            payload.duration_minutes = d.playtime ? Math.round(d.playtime * 60) : null;
            if (d.metacritic) payload.metacritic = d.metacritic;
          }
        }
      } else if (type === 'book') {
        const s = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`);
        if (!s.ok) throw new Error('OpenLibrary search failed');
        const j = await s.json();
        const b = j.docs?.[0];
        if (b) {
          const pages = b.number_of_pages_median || b.number_of_pages || null;
          payload.external_provider = 'openlibrary';
          payload.external_id = b.key || null;
          payload.cover_url = b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : null;
          payload.duration_minutes = pages ? Math.round(pages * 1) : null; // heuristic: 1 min/page
        }
      }

      if (Object.keys(payload).length > 0) {
        // If the user provided a duration override, do not let the external API overwrite it
        if (userOverrideDuration && 'duration_minutes' in payload) {
          delete payload.duration_minutes;
        } else if ('duration_minutes' in payload) {
          // Otherwise, avoid overwriting an existing duration in DB
          const { data: current, error: currErr } = await supabase.from('contents').select('duration_minutes').eq('id', rowId).single();
          if (!currErr && current && current.duration_minutes != null) {
            delete payload.duration_minutes;
          }
        }

        if (Object.keys(payload).length > 0) {
          const { error } = await supabase.from('contents').update(payload).eq('id', rowId);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.warn('Enrichment error:', err);
      throw err;
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

          {formData.type === 'videoGame' && (
            <div className="form-group">
              <label>Horas jugadas (opcional)</label>
              <input type="number" min="0" step="1" name="duration_hours" value={formData.duration_hours || ""} onChange={handleChange} placeholder="Horas" />
              <small>Si completas esto se usará en lugar de la duración que pueda traer la API externa.</small>
            </div>
          )}

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
