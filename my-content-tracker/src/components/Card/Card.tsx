import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./Card.scss";  // Estilos específicos para Card

interface CardProps {
  id: string;
  title: string;
  type: string;
  rating: number;
  comment: string;
  date: string;
  status: number;
  onDelete: (id: string) => void;
  onEdit: (id: string, newData: any) => void;
}

const typeIcons: Record<string, string> = {
  Movie: "🎬",
  Book: "📚",
  VideoGame: "🎮",
};

const Card: React.FC<CardProps> = ({
  id,
  title,
  type,
  rating,
  comment,
  date,
  status,
  onDelete,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedType, setEditedType] = useState(type);
  const [editedRating, setEditedRating] = useState(rating);
  const [editedComment, setEditedComment] = useState(comment);
  const [editedDate, setEditedDate] = useState(date);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSave = () => {
    if (
      editedTitle !== title ||
      editedType !== type ||
      editedRating !== rating ||
      editedComment !== comment ||
      editedDate !== date
    ) {
      onEdit(id, {
        title: editedTitle,
        type: editedType,
        rating: editedRating,
        comment: editedComment,
        date: editedDate,
        status,
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (isConfirmingDelete) {
      onDelete(id);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const icon = typeIcons[type] || "📦";
  const typeClass = type.toLowerCase(); // Ej: "movie", "book", "videogame"

  return (
    <div className={`card ${typeClass}`}>
      {isEditing ? (
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
          <input
            type="text"
            value={editedType}
            onChange={(e) => setEditedType(e.target.value)}
          />
          <input
            type="number"
            value={editedRating}
            onChange={(e) => setEditedRating(Number(e.target.value))}
          />
          <input
            type="text"
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
          />
          <input
            type="date"
            value={editedDate}
            onChange={(e) => setEditedDate(e.target.value)}
          />
          <button onClick={handleSave}>Guardar</button>
        </form>
      ) : (
        <div>
          <h3>{icon} {title}</h3>
          <p><strong>Tipo:</strong> {type}</p>
          <p><strong>Rating:</strong> {rating} ⭐</p>
          <p><strong>Comentario:</strong> {comment}</p>
          <p><strong>Fecha:</strong> {date}</p>
        </div>
      )}

      <div className="icons">
        <FaEdit onClick={() => setIsEditing(!isEditing)} />
        <FaTrash onClick={handleDelete} />
        {isConfirmingDelete && (
          <div className="confirmation">
            <p>¿Estás seguro de eliminar este ítem?</p>
            <button onClick={handleDelete}>Sí</button>
            <button onClick={() => setIsConfirmingDelete(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
