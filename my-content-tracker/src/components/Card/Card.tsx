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

const Card: React.FC<CardProps> = ({ id, title, type, rating, comment, date, status, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedType, setEditedType] = useState(type);
  const [editedRating, setEditedRating] = useState(rating);
  const [editedComment, setEditedComment] = useState(comment);
  const [editedDate, setEditedDate] = useState(date);

  const handleSave = () => {
    onEdit(id, {
      title: editedTitle,
      type: editedType,
      rating: editedRating,
      comment: editedComment,
      date: editedDate,
      status
    });
    setIsEditing(false);
  };

  return (
    <div className="card">
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
          <button onClick={handleSave}>Save</button>
        </form>
      ) : (
        <div>
          <h3>{title}</h3>
          <p>{type}</p>
          <p>{rating} ⭐</p>
          <p>{comment}</p>
          <p>{date}</p>
        </div>
      )}

      <div className="icons">
        <FaEdit onClick={() => setIsEditing(!isEditing)} />
        <FaTrash onClick={() => onDelete(id)} />
      </div>
    </div>
  );
};

export default Card;
