import React from "react";
import { FaEdit, FaTrash, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import './Card.scss';

interface CardProps {
  id: string;
  title: string;
  type: string;
  rating?: number | null;
  comment?: string | null;
  date?: string | null;
  status?: string | null;
  onDelete: (id: string) => void;
  onOpenModal: (item: any) => void;  // Función para abrir el modal con los datos
}

const typeIcons: Record<string, string> = {
  movie: "🎬",
  book: "📖",
  videoGame: "🕹️",
  tvSerie: "📺",
};

const categoryLabel = (k: string) => {
  switch (k) {
    case 'videoGame': return 'Videojuego';
    case 'book': return 'Libro';
    case 'movie': return 'Película';
    case 'tvSerie': return 'Serie';
    default: return k;
  }
}

// render stars with half-star support using unicode
const renderStars = (value?: number | null) => {
  if (value == null) return null;
  const v = Math.max(0, Math.min(5, value));
  const fullCount = Math.floor(v);
  const frac = v - fullCount;
  // decide half/full
  let half = false;
  let extraFull = 0;
  if (frac >= 0.75) extraFull = 1;
  else if (frac >= 0.25) half = true;

  const icons = [] as React.ReactNode[];
  for (let i = 0; i < fullCount + extraFull; i++) icons.push(<FaStar key={`f${i}`} />);
  if (half) icons.push(<FaStarHalfAlt key="half" />);
  while (icons.length < 5) icons.push(<FaRegStar key={`e${icons.length}`} />);

  return (
    <span className="stars" role="img" aria-label={`Puntuación ${v.toFixed(1)} de 5`}>
      {icons.map((ic, idx) => (
        <span key={idx} className="star-icon">{ic}</span>
      ))}
    </span>
  );
}

const Card: React.FC<CardProps> = ({ id, title, type, rating, comment, date, status, onDelete, onOpenModal }) => {
  const icon = typeIcons[type] || "📦";
  const typeLabel = categoryLabel(type);
  const typeClass = type.toLowerCase();

  return (
    <div className={`card ${typeClass}`}>
      <div className="card-header">
        <h3>{icon} {title}</h3>
        <div className="card-actions">
          <FaEdit onClick={() => onOpenModal({ id, title, type, rating, comment, date, status })} />
          <FaTrash onClick={() => onDelete(id)} />
        </div>
      </div>

      <div className="card-subtitle">{typeLabel}</div>

  <div className="card-rating">{renderStars(rating)}</div>

      {comment ? <div className="card-comment">{comment}</div> : null}

      <div className="card-footer">
        <div className="card-date">{date ? (() => {
          try {
            const d = new Date(date);
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
          } catch (e) { return date.split('T')[0] }
        })() : ''}</div>
        <div className="card-status">{status || ''}</div>
      </div>
    </div>
  );
};

export default Card;
