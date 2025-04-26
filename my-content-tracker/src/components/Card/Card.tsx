import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import './Card.scss';

interface CardProps {
  id: string;
  title: string;
  type: string;
  rating: number;
  comment: string;
  date: string;
  status: string;
  onDelete: (id: string) => void;
  onOpenModal: (item: any) => void;  // Función para abrir el modal con los datos
}

const typeIcons: Record<string, string> = {
  movie: "🎬",
  book: "📖",
  videoGame: "🕹️",
  tvSerie: "📺",
};

const Card: React.FC<CardProps> = ({ id, title, type, rating, comment, date, status, onDelete, onOpenModal }) => {
  const icon = typeIcons[type] || "📦";
  const typeClass = type.toLowerCase();

  return (
    <div className={`card ${typeClass}`}>
      <h3>{icon} {title}</h3>
      <p><strong>Tipo:</strong> {type}</p>
      <p><strong>Rating:</strong> {rating} ⭐</p>
      <p><strong>Comentario:</strong> {comment}</p>
      <p><strong>Fecha:</strong> {date}</p>
      <p><strong>Estado:</strong> {status}</p>

      <div className="icons">
        <FaEdit onClick={() => onOpenModal({ id, title, type, rating, comment, date, status })} /> {/* Llamar al modal desde el padre */}
        <FaTrash onClick={() => onDelete(id)} />
      </div>
    </div>
  );
};

export default Card;
